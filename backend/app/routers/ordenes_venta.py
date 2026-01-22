from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.auth import get_current_user
from app.models import OrdenVenta
from app.schemas import OrdenVenta as OrdenVentaSchema, OrdenVentaUpdate

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/ordenes-venta",
    response_model=list[OrdenVentaSchema],
    tags=["Órdenes de venta"],
    summary="Obtener todas las órdenes de venta",
)
def obtener_ordenes_venta(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    try:
        return db.query(OrdenVenta).order_by(OrdenVenta.fecha.desc()).all()
    except Exception as e:
        logger.error(f"Error al obtener órdenes de venta: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener órdenes de venta: {str(e)}",
        )


@router.get(
    "/ordenes-venta/{orden_id}",
    response_model=OrdenVentaSchema,
    tags=["Órdenes de venta"],
    summary="Obtener una orden de venta por ID",
)
def obtener_orden_venta(
    orden_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    orden = db.query(OrdenVenta).filter(OrdenVenta.id == orden_id).first()
    if not orden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Orden de venta con ID {orden_id} no encontrada.",
        )
    return orden


@router.patch(
    "/ordenes-venta/{orden_id}",
    response_model=OrdenVentaSchema,
    tags=["Órdenes de venta"],
    summary="Actualizar estado/comentarios de una orden de venta",
)
def actualizar_orden_venta(
    orden_id: int,
    payload: OrdenVentaUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    orden = db.query(OrdenVenta).filter(OrdenVenta.id == orden_id).first()
    if not orden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Orden de venta con ID {orden_id} no encontrada.",
        )

    if payload.estado is not None:
        orden.estado = payload.estado
    if payload.comentarios is not None:
        orden.comentarios = payload.comentarios

    db.commit()
    db.refresh(orden)
    return orden
