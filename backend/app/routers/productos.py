# backend/app/routers/productos.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ProductoCreate, Producto
from app.crud import CRUDProducto
from app.auth import get_current_user  # Importamos la función para obtener el usuario actual

router = APIRouter()
crud_producto = CRUDProducto(db=None)  # Inicializamos sin conexión, se asignará más tarde


@router.post("/productos", response_model=Producto)
def create_producto(producto: ProductoCreate, db: Session = Depends(get_db),
                    current_user: dict = Depends(get_current_user)):
    if current_user['rol'] not in ["Admin", "Modificador"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")

    crud_producto.db = db  # Asignamos la sesión a la clase
    return crud_producto.crear_producto(producto, current_user['sub'])


@router.get("/productos/{producto_id}", response_model=Producto)
def read_producto(producto_id: int, db: Session = Depends(get_db)):
    crud_producto.db = db
    db_producto = crud_producto.obtener_producto(producto_id)
    if db_producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return db_producto


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
    db_producto = crud_producto.actualizar_producto(producto_id, producto, current_user['sub'])
    if db_producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return db_producto


@router.delete("/productos/{producto_id}", response_model=Producto)
def delete_producto(producto_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user['rol'] != "Admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")

    crud_producto.db = db
    db_producto = crud_producto.eliminar_producto(producto_id)
    if db_producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return db_producto
