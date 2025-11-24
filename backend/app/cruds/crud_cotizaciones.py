from decimal import Decimal
from typing import Optional
import logging
import os

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Cliente,
    ClienteCotizacion,
    Cotizacion,
    CotizacionDetalle,
    Producto,
    Proyecto,
)
from app.schemas import (
    ClienteCotizacionCreate,
    CotizacionCreate,
    CotizacionDetalleCreate,
    CotizacionUpdate,
)
from app.cruds.crud_clientes import CRUDClienteCotizacion
from app.utils.pdf_utils import generate_pdf

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
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

            # Validar proyecto asociado si se proporciona
            proyecto = None

            if cotizacion_data.proyecto_id is not None:
                proyecto = (
                    self.db.query(Proyecto)
                    .filter(Proyecto.id == cotizacion_data.proyecto_id)
                    .first()
                )
                if not proyecto:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Proyecto con ID {cotizacion_data.proyecto_id} no encontrado."
                    )

            # Crear la cotización con el nombre del cliente
            nueva_cotizacion = Cotizacion(
                cliente=cliente.nombre,
                total=cotizacion_data.total,
                usuario_id=usuario_id,
                proyecto_id=proyecto.id if proyecto else None,
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
                estado="pendiente",
            )
            crud_cliente_cotizacion.asociar_cotizacion_cliente(cliente_cotizacion_data)

            # Commit después de agregar todos los datos
            self.db.commit()

            cotizacion_completa = self.obtener_cotizacion(nueva_cotizacion.id)
            self._generar_y_guardar_pdf(
                cotizacion_completa,
                cotizacion_data.costo_envio,
                cotizacion_data.variante_envio,
            )

            logger.info(f"Cotización creada con ID {cotizacion_completa.id} por el usuario {usuario_id}")
            return cotizacion_completa
        except HTTPException:
            self.db.rollback()
            raise
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
                .options(
                    joinedload(Cotizacion.detalles).joinedload(CotizacionDetalle.producto),
                    joinedload(Cotizacion.proyecto),
                    joinedload(Cotizacion.cliente_asociacion).joinedload(ClienteCotizacion.cliente),
                )
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
            cotizaciones = (
                self.db.query(Cotizacion)
                .options(
                    joinedload(Cotizacion.detalles).joinedload(CotizacionDetalle.producto),
                    joinedload(Cotizacion.proyecto),
                    joinedload(Cotizacion.cliente_asociacion).joinedload(ClienteCotizacion.cliente),
                )
                .all()
            )
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

    def actualizar_cabecera_cotizacion(self, cotizacion: Cotizacion, cotizacion_data: CotizacionUpdate) -> bool:
        cabecera_modificada = False
        cliente = None

        if cotizacion_data.cliente_id is not None:
            cliente = self.db.query(Cliente).filter(Cliente.id == cotizacion_data.cliente_id).first()
            if not cliente:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Cliente con ID {cotizacion_data.cliente_id} no encontrado."
                )
            cotizacion.cliente = cliente.nombre
            cabecera_modificada = True

        if cotizacion_data.proyecto_id is not None:
            if cotizacion_data.proyecto_id:
                proyecto = (
                    self.db.query(Proyecto)
                    .filter(Proyecto.id == cotizacion_data.proyecto_id)
                    .first()
                )
                if not proyecto:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Proyecto con ID {cotizacion_data.proyecto_id} no encontrado."
                    )
                cotizacion.proyecto_id = proyecto.id
            else:
                cotizacion.proyecto_id = None
            cabecera_modificada = True
        elif cliente:
            # Si se cambia de cliente y no se especifica un proyecto, se usa la información del cliente
            cotizacion.proyecto_id = None
            cabecera_modificada = True

        if cotizacion_data.total is not None:
            cotizacion.total = cotizacion_data.total
            cabecera_modificada = True

        return cabecera_modificada

    def actualizar_detalles_cotizacion(
        self, cotizacion: Cotizacion, detalles_data: list[CotizacionDetalleCreate]
    ) -> Decimal:
        if not detalles_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cotización debe incluir al menos un producto."
            )

        self.db.query(CotizacionDetalle).filter(
            CotizacionDetalle.cotizacion_id == cotizacion.id
        ).delete()

        total = Decimal("0")
        for detalle in detalles_data:
            producto = self.db.query(Producto).filter(Producto.id == detalle.producto_id).first()
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Producto con ID {detalle.producto_id} no encontrado."
                )

            detalle_total = Decimal(detalle.cantidad) * Decimal(detalle.precio_unitario)
            nuevo_detalle = CotizacionDetalle(
                cotizacion_id=cotizacion.id,
                producto_id=detalle.producto_id,
                cantidad=detalle.cantidad,
                precio_unitario=detalle.precio_unitario,
                total=detalle_total,
                tipo_variante=detalle.tipo_variante,
            )
            self.db.add(nuevo_detalle)
            total += detalle_total

        return total

    def _generar_y_guardar_pdf(
        self,
        cotizacion: Cotizacion,
        costo_envio: Optional[Decimal],
        variante_envio: Optional[str],
    ) -> None:
        cliente_asociacion = cotizacion.cliente_asociacion[0] if cotizacion.cliente_asociacion else None
        cliente_relacionado = cliente_asociacion.cliente if cliente_asociacion else None

        proyecto_nombre = (
            cotizacion.proyecto.nombre
            if cotizacion.proyecto
            else (cliente_relacionado.proyecto if cliente_relacionado and cliente_relacionado.proyecto else "")
        )
        proyecto_direccion = (
            cotizacion.proyecto.direccion
            if cotizacion.proyecto and cotizacion.proyecto.direccion
            else (cliente_relacionado.direccion if cliente_relacionado and cliente_relacionado.direccion else "")
        )

        cotizacion_data_pdf = {
            "id": cotizacion.id,
            "fecha": cotizacion.fecha.strftime("%d/%m/%Y"),
            "cliente_nombre": cotizacion.cliente,
            "cliente_proyecto": proyecto_nombre or "Sin proyecto seleccionado",
            "cliente_direccion": proyecto_direccion or "Dirección no especificada",
            "proyecto_nombre": proyecto_nombre or "Sin proyecto seleccionado",
            "proyecto_direccion": proyecto_direccion or "Dirección no especificada",
            "productos": [
                {
                    "producto_id": detalle.producto_id,
                    "nombre": detalle.producto.nombre if detalle.producto else "Sin nombre",
                    "color": detalle.producto.color if detalle.producto else None,
                    "formato": detalle.producto.formato if detalle.producto else None,
                    "cantidad": float(detalle.cantidad),
                    "precio_unitario": float(detalle.precio_unitario),
                    "total": float(detalle.total),
                    "tipo_variante": detalle.tipo_variante,
                }
                for detalle in cotizacion.detalles
            ],
            "total": float(cotizacion.total),
            "costo_envio": float(costo_envio) if costo_envio is not None else 0.0,
            "variante_envio": variante_envio or "N/A",
        }

        try:
            pdf = generate_pdf(cotizacion_data_pdf)
            pdf_path = os.path.join(PDF_STORAGE_PATH, f"Cotizacion_{cotizacion.id}.pdf")
            with open(pdf_path, "wb") as pdf_file:
                pdf_file.write(pdf)
            logger.info(f"PDF guardado en: {pdf_path}")
        except Exception as e:
            logger.error(
                f"Error al generar el PDF para la cotización {cotizacion.id}: {e}"
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al generar el PDF: {str(e)}",
            )

    def actualizar_cotizacion(self, cotizacion_id: int, cotizacion_data: CotizacionUpdate) -> Cotizacion:
        try:
            cotizacion = (
                self.db.query(Cotizacion)
                .options(
                    joinedload(Cotizacion.detalles).joinedload(CotizacionDetalle.producto),
                    joinedload(Cotizacion.proyecto),
                    joinedload(Cotizacion.cliente_asociacion).joinedload(ClienteCotizacion.cliente),
                )
                .filter(Cotizacion.id == cotizacion_id)
                .first()
            )

            if not cotizacion:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Cotización no encontrada",
                )

            cabecera_modificada = self.actualizar_cabecera_cotizacion(cotizacion, cotizacion_data)
            detalles_modificados = False

            if cotizacion_data.detalles is not None:
                total_detalles = self.actualizar_detalles_cotizacion(cotizacion, cotizacion_data.detalles)
                detalles_modificados = True
                if cotizacion_data.total is None:
                    cotizacion.total = total_detalles

            regenerar_pdf = (
                cabecera_modificada or detalles_modificados or cotizacion_data.total is not None
            )

            self.db.commit()
            cotizacion_actualizada = self.obtener_cotizacion(cotizacion_id)

            if regenerar_pdf or cotizacion_data.costo_envio is not None or cotizacion_data.variante_envio is not None:
                self._generar_y_guardar_pdf(
                    cotizacion_actualizada,
                    cotizacion_data.costo_envio,
                    cotizacion_data.variante_envio,
                )

            return cotizacion_actualizada
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error al actualizar la cotización con ID {cotizacion_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar la cotización: {str(e)}",
            )
