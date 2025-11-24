from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.cruds.crud_sucursales import CRUDSucursal
from app.database import get_db
from app.schemas import Sucursal, SucursalCreate, SucursalUpdate

router = APIRouter()


@router.post("/sucursales", response_model=Sucursal, tags=["Sucursales"], summary="Crear una sucursal")
def create_sucursal(
    sucursal: SucursalCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    crud_sucursal = CRUDSucursal(db)
    return crud_sucursal.crear_sucursal(sucursal)


@router.get("/sucursales", response_model=list[Sucursal], tags=["Sucursales"], summary="Listar sucursales")
def read_sucursales(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    crud_sucursal = CRUDSucursal(db)
    return crud_sucursal.obtener_sucursales()


@router.get("/sucursales/{sucursal_id}", response_model=Sucursal, tags=["Sucursales"], summary="Obtener sucursal")
def read_sucursal(
    sucursal_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    crud_sucursal = CRUDSucursal(db)
    return crud_sucursal.obtener_sucursal(sucursal_id)


@router.put("/sucursales/{sucursal_id}", response_model=Sucursal, tags=["Sucursales"], summary="Actualizar sucursal")
def update_sucursal(
    sucursal_id: int,
    sucursal: SucursalUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    crud_sucursal = CRUDSucursal(db)
    return crud_sucursal.actualizar_sucursal(sucursal_id, sucursal)


@router.delete("/sucursales/{sucursal_id}", response_model=Sucursal, tags=["Sucursales"], summary="Eliminar sucursal")
def delete_sucursal(
    sucursal_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    crud_sucursal = CRUDSucursal(db)
    return crud_sucursal.eliminar_sucursal(sucursal_id)
