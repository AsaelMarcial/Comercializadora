# backend/app/routers/inventario.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import InventarioCreate, Inventario
from app.crud import CRUDInventario
from app.auth import get_current_user  # Importamos la función para obtener el usuario actual

router = APIRouter()
crud_inventario = CRUDInventario(db=None)  # Inicializamos sin conexión, se asignará más tarde


@router.post("/inventario", response_model=Inventario)
def create_inventario(inventario: InventarioCreate, db: Session = Depends(get_db),
                      current_user: dict = Depends(get_current_user)):
    if current_user['rol'] not in ["Admin", "Modificador"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")

    crud_inventario.db = db  # Asignamos la sesión a la clase
    return crud_inventario.crear_inventario(inventario)


@router.get("/inventario/{producto_id}", response_model=Inventario)
def read_inventario(producto_id: int, db: Session = Depends(get_db)):
    crud_inventario.db = db
    db_inventario = crud_inventario.obtener_inventario(producto_id)
    if db_inventario is None:
        raise HTTPException(status_code=404, detail="Inventario no encontrado")
    return db_inventario


@router.put("/inventario/{producto_id}", response_model=Inventario)
def update_inventario(producto_id: int, cantidad: int, db: Session = Depends(get_db),
                      current_user: dict = Depends(get_current_user)):
    if current_user['rol'] not in ["Admin", "Modificador"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")

    crud_inventario.db = db
    db_inventario = crud_inventario.actualizar_inventario(producto_id, cantidad)
    if db_inventario is None:
        raise HTTPException(status_code=404, detail="Inventario no encontrado")
    return db_inventario


@router.delete("/inventario/{producto_id}", response_model=Inventario)
def delete_inventario(producto_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user['rol'] != "Admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")

    crud_inventario.db = db
    db_inventario = crud_inventario.eliminar_inventario(producto_id)
    if db_inventario is None:
        raise HTTPException(status_code=404, detail="Inventario no encontrado")
    return db_inventario
