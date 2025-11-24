from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import os
from app.cruds.crud_cotizaciones import CRUDCotizacion
from app.schemas import CotizacionCreate, CotizacionResponse, CotizacionUpdate
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
        # Crear cotización en la base de datos y generar PDF dentro del CRUD
        nueva_cotizacion = crud_cotizacion.crear_cotizacion(
            cotizacion_data=cotizacion,
            usuario_id=current_user.get('id')  # Asignar el ID del usuario autenticado
        )

        logger.info(f"Cotización creada exitosamente con ID {nueva_cotizacion.id}")
        return nueva_cotizacion
    except Exception as e:
        logger.error(f"Error al crear la cotización: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear la cotización: {str(e)}"
        )


@router.put(
    "/cotizaciones/{cotizacion_id}",
    response_model=CotizacionResponse,
    tags=["Cotizaciones"],
    summary="Actualizar una cotización"
)
def update_cotizacion(
    cotizacion_id: int,
    cotizacion_data: CotizacionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Actualiza los datos de una cotización, incluyendo cabecera y detalles.
    Regenera el PDF cuando cambian los productos o los totales.
    """
    crud_cotizacion.db = db
    try:
        return crud_cotizacion.actualizar_cotizacion(cotizacion_id, cotizacion_data)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error al actualizar la cotización con ID {cotizacion_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar la cotización: {str(e)}"
        )


@router.patch(
    "/cotizaciones/{cotizacion_id}",
    response_model=CotizacionResponse,
    tags=["Cotizaciones"],
    summary="Actualizar parcialmente una cotización"
)
def partial_update_cotizacion(
    cotizacion_id: int,
    cotizacion_data: CotizacionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Permite actualizar parcialmente una cotización existente.
    Regenera el PDF en caso de cambios relevantes.
    """
    crud_cotizacion.db = db
    try:
        return crud_cotizacion.actualizar_cotizacion(cotizacion_id, cotizacion_data)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error al actualizar parcialmente la cotización con ID {cotizacion_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar la cotización: {str(e)}"
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
    crud_cotizacion = CRUDCotizacion(db)
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


@router.put(
    "/cotizaciones/{cotizacion_id}/cancel",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Cotizaciones"],
    summary="Cancelar una cotización",
)
def cancel_cotizacion(
    cotizacion_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Cancela (elimina) una cotización existente."""
    crud_cotizacion = CRUDCotizacion(db)
    try:
        crud_cotizacion.eliminar_cotizacion(cotizacion_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error al cancelar cotización con ID {cotizacion_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al cancelar la cotización: {str(e)}"
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
    Descarga un PDF para una cotización específica.
    """
    crud_cotizacion.db = db
    try:
        # Verificar si la cotización existe
        cotizacion = crud_cotizacion.obtener_cotizacion(cotizacion_id)
        if not cotizacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Cotización no encontrada"
            )

        # Verificar si el PDF ya existe
        pdf_path = os.path.join(PDF_STORAGE_PATH, f"Cotizacion_{cotizacion_id}.pdf")
        if not os.path.exists(pdf_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El PDF de la cotización no ha sido generado aún."
            )

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
