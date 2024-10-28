# backend/app/routers/productos.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ProductoCreate, Producto
from app.cruds.crud_productos import CRUDProducto  # Nuevo import desde cruds
from app.auth import get_current_user  # Obtener usuario actual

router = APIRouter()
crud_producto = CRUDProducto(db=None)  # Inicializamos sin conexión

@router.post("/productos", response_model=Producto)
def create_producto(producto: ProductoCreate, db: Session = Depends(get_db),
                    current_user: dict = Depends(get_current_user)):
    if current_user['rol'] not in ["Admin", "Modificador"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")

    crud_producto.db = db  # Asignamos la sesión
    return crud_producto.crear_producto(producto)

@router.get("/productos/{producto_id}", response_model=Producto)
def read_producto(producto_id: int, db: Session = Depends(get_db)):
    crud_producto.db = db
    return crud_producto.obtener_producto(producto_id)

@router.get("/productos", response_model=list[Producto])
def read_productos(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    crud_producto.db = db
    return crud_producto.obtener_productos(skip=skip, limit=limit)

@router.put("/productos/{producto_id}", response_model=Producto)
def update_producto(producto_id: int, producto: ProductoCreate, db: Session = Depends(get_db),
                    current_user: dict = Depends(get_current_user)):
    if current_user['rol'] not in ["Admin", "Modificador"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")

    crud_producto.db = db
    return crud_producto.actualizar_producto(producto_id, producto)

@router.delete("/productos/{producto_id}", response_model=Producto)
def delete_producto(producto_id: int, db: Session = Depends(get_db),
                    current_user: dict = Depends(get_current_user)):
    if current_user['rol'] != "Admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")

    crud_producto.db = db
    return crud_producto.eliminar_producto(producto_id)
