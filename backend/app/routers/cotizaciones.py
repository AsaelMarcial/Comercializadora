from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import os
from app.cruds.crud_cotizaciones import CRUDCotizacion
from app.schemas import CotizacionCreate, CotizacionResponse
from app.database import get_db
from app.auth import get_current_user
from app.utils.pdf_utils import generate_pdf
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

router = APIRouter()

# Instancia del CRUD
crud_cotizacion = CRUDCotizacion(db=None)

PDF_STORAGE_PATH = os.path.join(os.path.dirname(__file__), "../pdf_storage")
os.makedirs(PDF_STORAGE_PATH, exist_ok=True)

@router.post(
    "/cotizaciones",
    response_model=CotizacionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Cotizaciones"],
    summary="Crear una nueva cotización"
)
def create_cotizacion(
    cotizacion: CotizacionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Crear una nueva cotización con sus detalles.
    Genera un PDF automáticamente al guardar la cotización.
    """
    crud_cotizacion.db = db
    try:
        nueva_cotizacion = crud_cotizacion.crear_cotizacion(
            cotizacion_data=cotizacion,
            usuario_id=1
        )

        # Generar PDF
        cotizacion_data = {
            "id": nueva_cotizacion.id,
            "cliente": nueva_cotizacion.cliente,
            "fecha": nueva_cotizacion.fecha.strftime("%d/%m/%Y"),
            "productos": [
                {
                    "producto_id": detalle.producto_id,
                    "cantidad": float(detalle.cantidad),
                    "precio_unitario": float(detalle.precio_unitario),
                    "total": float(detalle.total),
                }
                for detalle in nueva_cotizacion.detalles
            ],
            "total": float(nueva_cotizacion.total),
        }
        pdf = generate_pdf(cotizacion_data)

        # Guardar el PDF en el sistema de archivos
        pdf_path = os.path.join(PDF_STORAGE_PATH, f"Cotizacion_{nueva_cotizacion.id}.pdf")
        with open(pdf_path, "wb") as pdf_file:
            pdf_file.write(pdf)

        logger.info(f"PDF generado y guardado en: {pdf_path}")
        return nueva_cotizacion
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error al crear cotización para el usuario {current_user['id']}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear la cotización: {str(e)}"
        )

@router.get(
    "/cotizaciones/{cotizacion_id}",
    response_model=CotizacionResponse,
    tags=["Cotizaciones"],
    summary="Obtener una cotización por ID"
)
def get_cotizacion(
    cotizacion_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Devuelve una cotización específica con sus detalles.
    """
    crud_cotizacion.db = db
    try:
        cotizacion = crud_cotizacion.obtener_cotizacion(cotizacion_id)
        return cotizacion
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error al obtener cotización con ID {cotizacion_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener la cotización: {str(e)}"
        )

@router.get(
    "/cotizaciones",
    response_model=list[CotizacionResponse],
    tags=["Cotizaciones"],
    summary="Obtener todas las cotizaciones"
)
def get_all_cotizaciones(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Devuelve una lista de todas las cotizaciones con sus detalles.
    """
    crud_cotizacion.db = db
    try:
        return crud_cotizacion.obtener_cotizaciones()
    except Exception as e:
        logger.error(f"Error al obtener todas las cotizaciones: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener las cotizaciones: {str(e)}"
        )

@router.delete(
    "/cotizaciones/{cotizacion_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Cotizaciones"],
    summary="Eliminar una cotización"
)
def delete_cotizacion(
    cotizacion_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Elimina una cotización y sus detalles asociados.
    """
    crud_cotizacion.db = db
    try:
        crud_cotizacion.eliminar_cotizacion(cotizacion_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error al eliminar cotización con ID {cotizacion_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar la cotización: {str(e)}"
        )

@router.get(
    "/cotizaciones/{cotizacion_id}/pdf",
    tags=["Cotizaciones"],
    summary="Descargar PDF de una cotización"
)
def descargar_pdf_cotizacion(
    cotizacion_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Genera y descarga un PDF para una cotización específica.
    """
    crud_cotizacion.db = db
    try:
        # Obtener la cotización desde la base de datos
        cotizacion = crud_cotizacion.obtener_cotizacion(cotizacion_id)
        if not cotizacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Cotización no encontrada"
            )

        # Verificar si el PDF ya existe
        pdf_path = os.path.join(PDF_STORAGE_PATH, f"Cotizacion_{cotizacion_id}.pdf")
        if not os.path.exists(pdf_path):
            # Generar el PDF si no existe
            cotizacion_data = {
                "id": cotizacion.id,
                "cliente": cotizacion.cliente,
                "fecha": cotizacion.fecha.strftime("%d/%m/%Y"),
                "productos": [
                    {
                        "producto_id": detalle.producto_id,
                        "cantidad": detalle.cantidad,
                        "precio_unitario": float(detalle.precio_unitario),
                        "total": float(detalle.total),
                    }
                    for detalle in cotizacion.detalles
                ],
                "total": float(cotizacion.total),
            }
            pdf = generate_pdf(cotizacion_data)
            with open(pdf_path, "wb") as pdf_file:
                pdf_file.write(pdf)

        # Leer y enviar el PDF como respuesta
        pdf_stream = io.BytesIO()
        with open(pdf_path, "rb") as pdf_file:
            pdf_stream.write(pdf_file.read())
        pdf_stream.seek(0)

        headers = {
            "Content-Disposition": f"attachment; filename=Cotizacion_{cotizacion_id}.pdf"
        }
        return StreamingResponse(pdf_stream, media_type="application/pdf", headers=headers)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error al descargar el PDF de la cotización con ID {cotizacion_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al descargar el PDF: {str(e)}"
        )
