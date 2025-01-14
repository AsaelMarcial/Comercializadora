from fastapi import APIRouter, status, HTTPException, Depends
from app.cruds.crud_cotizaciones import CRUDCotizacion
from app.schemas import CotizacionCreate, CotizacionResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user

router = APIRouter()

# Instancia del CRUD
crud_cotizacion = CRUDCotizacion(db=None)

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
    Recibe un objeto CotizacionCreate que incluye cliente, total y detalles de productos.
    """
    crud_cotizacion.db = db
    try:
        nueva_cotizacion = crud_cotizacion.crear_cotizacion(
            cotizacion_data=cotizacion,
            usuario_id=current_user["id"]
        )
        return nueva_cotizacion
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error al crear cotización: {e}")
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
        print(f"Error al obtener cotización: {e}")
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
        print(f"Error al obtener todas las cotizaciones: {e}")
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
        print(f"Error al eliminar cotización: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar la cotización: {str(e)}"
        )

@router.get("/cotizaciones/{cotizacion_id}/pdf", tags=["Cotizaciones"])
def descargar_pdf_cotizacion(cotizacion_id: int, db: Session = Depends(get_db)):
    """
    Genera y descarga un PDF para una cotización específica.
    """
    # Obtener la cotización desde la base de datos
    crud_cotizacion = CRUDCotizacion(db)
    cotizacion = crud_cotizacion.obtener_cotizacion(cotizacion_id)

    if not cotizacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cotización no encontrada"
        )

    # Formatear los datos para el template
    cotizacion_data = {
        "id": cotizacion.id,
        "cliente": cotizacion.cliente,
        "fecha": cotizacion.fecha.strftime("%d/%m/%Y"),
        "total": f"${cotizacion.total:.2f}",
        "detalles": [
            {
                "producto": detalle.producto.nombre,
                "unidad": detalle.producto.unidad_venta,
                "cantidad": detalle.cantidad,
                "precio_unitario": f"${detalle.precio_unitario:.2f}",
                "importe": f"${detalle.total:.2f}",
            }
            for detalle in cotizacion.detalles
        ],
    }

    # Generar el PDF
    pdf = generate_pdf(cotizacion_data)

    # Devolver el PDF como respuesta
    pdf_stream = io.BytesIO(pdf)
    headers = {
        "Content-Disposition": f"attachment; filename=Cotizacion_{cotizacion_id}.pdf"
    }
    return StreamingResponse(pdf_stream, media_type="application/pdf", headers=headers)