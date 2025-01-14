from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from app.models import Cotizacion, CotizacionDetalle
from app.schemas import CotizacionCreate, CotizacionDetalleCreate

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
            detalles_procesados = []
            for detalle in cotizacion_data.detalles:
                nuevo_detalle = CotizacionDetalle(
                    cotizacion_id=nueva_cotizacion.id,
                    producto_id=detalle.producto_id,
                    cantidad=detalle.cantidad,
                    precio_unitario=detalle.precio_unitario,
                    total=detalle.cantidad * detalle.precio_unitario  # Cambiar `subtotal` a `total`
                )
                self.db.add(nuevo_detalle)
                detalles_procesados.append(nuevo_detalle)

            self.db.commit()  # Confirmar transacción después de procesar detalles
            return nueva_cotizacion
        except Exception as e:
            self.db.rollback()
            print(f"Error en crear_cotizacion: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear la cotización: {str(e)}"
            )

    def obtener_cotizacion(self, cotizacion_id: int) -> Cotizacion:
        cotizacion = self.db.query(Cotizacion).filter(Cotizacion.id == cotizacion_id).first()
        if not cotizacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cotización no encontrada"
            )
        return cotizacion

    def obtener_cotizaciones(self):
        return self.db.query(Cotizacion).all()

    def eliminar_cotizacion(self, cotizacion_id: int):
        cotizacion = self.db.query(Cotizacion).filter(Cotizacion.id == cotizacion_id).first()
        if not cotizacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cotización no encontrada"
            )

        try:
            # Los detalles se eliminan automáticamente debido a la relación ondelete="CASCADE"
            self.db.delete(cotizacion)
            self.db.commit()
            return cotizacion
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar la cotización: {str(e)}"
            )

