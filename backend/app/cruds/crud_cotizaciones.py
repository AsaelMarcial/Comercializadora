from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from app.models import Cotizacion, CotizacionDetalle, Producto
from app.schemas import CotizacionCreate
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CRUDCotizacion:
    def __init__(self, db: Session):
        self.db = db

    def crear_cotizacion(self, cotizacion_data: CotizacionCreate, usuario_id: int) -> Cotizacion:
        try:
            # Crear la cotización principal
            nueva_cotizacion = Cotizacion(
                cliente=cotizacion_data.cliente,
                total=cotizacion_data.total,
                usuario_id=usuario_id
            )
            self.db.add(nueva_cotizacion)
            self.db.commit()
            self.db.refresh(nueva_cotizacion)

            # Crear los detalles de la cotización
            for detalle in cotizacion_data.detalles:
                # Validar que el producto exista
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

            self.db.commit()
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