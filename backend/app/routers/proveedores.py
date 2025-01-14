from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ProveedorCreate, Proveedor
from app.cruds.crud_proveedores import CRUDProveedor
from app.auth import get_current_user

router = APIRouter()

@router.post(
    "/proveedores",
    response_model=Proveedor,
    tags=["Proveedores"],
    summary="Crear un nuevo proveedor"
)
def create_proveedor(
    proveedor: ProveedorCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    crud_proveedor = CRUDProveedor(db)
    try:
        nuevo_proveedor = crud_proveedor.crear_proveedor(proveedor)
        print(f"Proveedor creado con éxito: {nuevo_proveedor}")
        return nuevo_proveedor
    except Exception as e:
        print(f"Error en create_proveedor: {e}")
        raise HTTPException(status_code=500, detail=f"Error al crear el proveedor: {str(e)}")

@router.get("/proveedores/{proveedor_id}", response_model=Proveedor)
def read_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    crud_proveedor = CRUDProveedor(db)
    return crud_proveedor.obtener_proveedor(proveedor_id)

@router.get("/proveedores", response_model=list[Proveedor])
def read_proveedores(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    crud_proveedor = CRUDProveedor(db)
    return crud_proveedor.obtener_proveedores()

@router.put("/proveedores/{proveedor_id}", response_model=Proveedor)
def update_proveedor(
    proveedor_id: int,
    proveedor: ProveedorCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    crud_proveedor = CRUDProveedor(db)
    return crud_proveedor.actualizar_proveedor(proveedor_id, proveedor)

@router.delete("/proveedores/{proveedor_id}", response_model=Proveedor)
def delete_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    crud_proveedor = CRUDProveedor(db)
    try:
        proveedor_eliminado = crud_proveedor.eliminar_proveedor(proveedor_id)
        return proveedor_eliminado
    except Exception as e:
        print(f"Error en delete_proveedor: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al eliminar el proveedor: {str(e)}"
        )
