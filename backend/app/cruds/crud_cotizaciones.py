from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from app.models import Cotizacion, CotizacionDetalle, Producto, Cliente
from app.schemas import CotizacionCreate, ClienteCotizacionCreate
from app.cruds.crud_clientes import CRUDClienteCotizacion
import logging
from app.utils.pdf_utils import generate_pdf
from app.utils.remision_pdf_utils import generate_nota_remision_pdf
import os

logger = logging.getLogger(__name__)

PDF_STORAGE_PATH = os.path.join(os.path.dirname(__file__), "../pdf_storage")
os.makedirs(PDF_STORAGE_PATH, exist_ok=True)

class CRUDCotizacion:
    def __init__(self, db: Session):
        self.db = db

    def crear_cotizacion(self, cotizacion_data: CotizacionCreate, usuario_id: int) -> Cotizacion:
        try:
            # Validar que el cliente exista
            cliente = self.db.query(Cliente).filter(Cliente.id == cotizacion_data.cliente_id).first()
            if not cliente:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Cliente con ID {cotizacion_data.cliente_id} no encontrado."
                )

            # Crear la cotización con el nombre del cliente
            nueva_cotizacion = Cotizacion(
                cliente=cliente.nombre,
                total=cotizacion_data.total,
                usuario_id=usuario_id
            )
            self.db.add(nueva_cotizacion)
            self.db.flush()  # No hacemos commit aquí para evitar inconsistencias

            # Validar que haya productos en la cotización
            if not cotizacion_data.detalles:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La cotización debe incluir al menos un producto."
                )

            # Crear los detalles de la cotización
            for detalle in cotizacion_data.detalles:
                producto = self.db.query(Producto).filter(Producto.id == detalle.producto_id).first()
                if not producto:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Producto con ID {detalle.producto_id} no encontrado."
                    )

                nuevo_detalle = CotizacionDetalle(
                    cotizacion_id=nueva_cotizacion.id,
                    producto_id=detalle.producto_id,
                    cantidad=detalle.cantidad,
                    precio_unitario=detalle.precio_unitario,
                    total=detalle.cantidad * detalle.precio_unitario,
                    tipo_variante=detalle.tipo_variante
                )
                self.db.add(nuevo_detalle)

            # Asociar la cotización con el cliente en la tabla clientes_cotizacion
            crud_cliente_cotizacion = CRUDClienteCotizacion(self.db)
            cliente_cotizacion_data = ClienteCotizacionCreate(
                cotizacion_id=nueva_cotizacion.id,
                cliente_id=cliente.id,
                estado="pendiente"
            )
            crud_cliente_cotizacion.asociar_cotizacion_cliente(cliente_cotizacion_data)

            # Commit después de agregar todos los datos
            self.db.commit()
            self.db.refresh(nueva_cotizacion)

            # Incluir información completa del cliente en cotizacion_data para el PDF
            cliente_nombre = cliente.nombre
            cliente_proyecto = cliente.proyecto
            cliente_direccion = cliente.direccion

            # Crear el diccionario para el PDF
            cotizacion_data_pdf = {
                "id": nueva_cotizacion.id,
                "fecha": nueva_cotizacion.fecha.strftime("%d/%m/%Y"),
                "cliente_nombre": cliente_nombre,
                "cliente_proyecto": cliente_proyecto,
                "cliente_direccion": cliente_direccion,
                "productos": [
                    {
                        "producto_id": detalle.producto_id,
                        "nombre": detalle.producto.nombre if detalle.producto else "Sin nombre",
                        "color" : detalle.producto.color,
                        "formato" : detalle.producto.formato,
                        "cantidad": float(detalle.cantidad),
                        "precio_unitario": float(detalle.precio_unitario),
                        "total": float(detalle.total),
                        "tipo_variante": detalle.tipo_variante
                    }
                    for detalle in nueva_cotizacion.detalles
                ],
                "total": float(nueva_cotizacion.total),
                "costo_envio": float(cotizacion_data.costo_envio),
                "variante_envio": cotizacion_data.variante_envio,
            }
            # Generar PDF con la información completa del cliente
            try:
                logger.info(f"Datos enviados a generate_pdf: {cotizacion_data_pdf}")
                pdf = generate_pdf(cotizacion_data_pdf)
                pdf_path = os.path.join(PDF_STORAGE_PATH, f"Cotizacion_{nueva_cotizacion.id}.pdf")
                with open(pdf_path, "wb") as pdf_file:
                    pdf_file.write(pdf)

                logger.info(f"PDF generado y guardado en: {pdf_path}")
            except Exception as e:
                logger.error(f"Error al generar el PDF para la cotización {nueva_cotizacion.id}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error al generar el PDF: {str(e)}"
                )

            remision_data_pdf = {
                "id": nueva_cotizacion.id,
                "fecha": nueva_cotizacion.fecha.strftime("%d/%m/%Y"),
                "cliente_nombre": cliente_nombre,
                "cliente_proyecto": cliente_proyecto,
                "cliente_direccion": cliente_direccion,
                "productos": [
                    {
                        "producto_id": detalle.producto_id,
                        "nombre": detalle.producto.nombre if detalle.producto else "Sin nombre",
                        "color": detalle.producto.color if detalle.producto else None,
                        "formato": detalle.producto.formato if detalle.producto else None,
                        "cantidad": float(detalle.cantidad),
                        "tipo_variante": detalle.tipo_variante,
                    }
                    for detalle in nueva_cotizacion.detalles
                ],
            }

            try:
                remision_pdf = generate_nota_remision_pdf(remision_data_pdf)
                remision_pdf_path = os.path.join(PDF_STORAGE_PATH, f"NotaRemision_{nueva_cotizacion.id}.pdf")
                with open(remision_pdf_path, "wb") as remision_file:
                    remision_file.write(remision_pdf)

                logger.info(f"Nota de remisión generada y guardada en: {remision_pdf_path}")
            except Exception as e:
                logger.error(
                    f"Error al generar la nota de remisión para la cotización {nueva_cotizacion.id}: {e}"
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error al generar la nota de remisión: {str(e)}"
                )

            logger.info(f"Cotización creada con ID {nueva_cotizacion.id} por el usuario {usuario_id}")
            return nueva_cotizacion
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error en crear_cotizacion para el usuario {usuario_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear la cotización: {str(e)}"
            )

    def obtener_cotizacion(self, cotizacion_id: int) -> Cotizacion:
        try:
            cotizacion = (
                self.db.query(Cotizacion)
                .options(joinedload(Cotizacion.detalles).joinedload(CotizacionDetalle.producto))
                .filter(Cotizacion.id == cotizacion_id)
                .first()
            )
            if not cotizacion:
                logger.warning(f"Cotización con ID {cotizacion_id} no encontrada")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Cotización no encontrada"
                )
            return cotizacion
        except Exception as e:
            logger.error(f"Error al obtener la cotización con ID {cotizacion_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener la cotización: {str(e)}"
            )

    def obtener_cotizaciones(self):
        try:
            cotizaciones = self.db.query(Cotizacion).all()
            logger.info(f"Se obtuvieron {len(cotizaciones)} cotizaciones")
            return cotizaciones
        except Exception as e:
            logger.error(f"Error al obtener todas las cotizaciones: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener las cotizaciones: {str(e)}"
            )

    def eliminar_cotizacion(self, cotizacion_id: int):
        try:
            # Buscar la cotización
            cotizacion = self.db.query(Cotizacion).filter(Cotizacion.id == cotizacion_id).first()
            if not cotizacion:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Cotización no encontrada"
                )

            # Eliminar los detalles de la cotización
            self.db.query(CotizacionDetalle).filter(CotizacionDetalle.cotizacion_id == cotizacion_id).delete()

            # Eliminar la cotización principal
            self.db.delete(cotizacion)
            self.db.commit()
            logger.info(f"Cotización con ID {cotizacion_id} eliminada correctamente.")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error al eliminar la cotización con ID {cotizacion_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar la cotización: {str(e)}"
            )