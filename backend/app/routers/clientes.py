from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas import (
    ClienteCreate,
    ClienteUpdate,
    ClienteResponse,
    ClienteCotizacionCreate,
    ClienteCotizacionResponse,
)
from app.cruds.crud_clientes import CRUDCliente, CRUDClienteCotizacion
from app.database import get_db
from app.auth import get_current_user

router = APIRouter()

# Instancias de los CRUDs
crud_cliente = CRUDCliente(db=None)
crud_cliente_cotizacion = CRUDClienteCotizacion(db=None)

@router.post(
    "/clientes",
    response_model=ClienteResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Clientes"],
    summary="Crear un nuevo cliente"
)
def create_cliente(
    cliente: ClienteCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Crear un nuevo cliente.
    """
    crud_cliente.db = db
    try:
        return crud_cliente.crear_cliente(cliente_data=cliente)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear cliente: {str(e)}"
        )

@router.get(
    "/clientes/{cliente_id}",
    response_model=ClienteResponse,
    tags=["Clientes"],
    summary="Obtener un cliente por ID"
)
def get_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener un cliente específico por su ID.
    """
    crud_cliente.db = db
    try:
        return crud_cliente.obtener_cliente(cliente_id=cliente_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener cliente: {str(e)}"
        )

@router.get(
    "/clientes",
    response_model=list[ClienteResponse],
    tags=["Clientes"],
    summary="Obtener todos los clientes"
)
def get_all_clientes(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener todos los clientes.
    """
    crud_cliente.db = db
    try:
        return crud_cliente.obtener_clientes()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener clientes: {str(e)}"
        )

@router.delete(
    "/clientes/{cliente_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Clientes"],
    summary="Eliminar un cliente"
)
def eliminar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    crud_cliente = CRUDCliente(db)
    crud_cliente.eliminar_cliente(cliente_id)


@router.post(
    "/clientes/cotizaciones",
    response_model=ClienteCotizacionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Clientes"],
    summary="Asociar una cotización a un cliente"
)
def asociar_cotizacion_cliente(
    cliente_cotizacion: ClienteCotizacionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Asociar una cotización a un cliente.
    """
    crud_cliente_cotizacion.db = db
    try:
        return crud_cliente_cotizacion.asociar_cotizacion_cliente(cliente_cotizacion_data=cliente_cotizacion)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al asociar cotización a cliente: {str(e)}"
        )

@router.get(
    "/clientes/{cliente_id}/cotizaciones",
    response_model=list[ClienteCotizacionResponse],
    tags=["Clientes"],
    summary="Obtener cotizaciones asociadas a un cliente"
)
def get_cotizaciones_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener todas las cotizaciones asociadas a un cliente.
    """
    crud_cliente_cotizacion.db = db
    try:
        return crud_cliente_cotizacion.obtener_cotizaciones_cliente(cliente_id=cliente_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener cotizaciones del cliente: {str(e)}"
        )

@router.put("/clientes/{cliente_id}", response_model=ClienteResponse, tags=["Clientes"])
def actualizar_cliente(
    cliente_id: int,
    cliente_data: ClienteUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Actualiza un cliente existente.
    """
    crud_cliente = CRUDCliente(db)
    return crud_cliente.actualizar_cliente(cliente_id, cliente_data)
