from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import InventarioCreate, Inventario
from app.cruds.crud_inventario import CRUDInventario  # Nuevo import desde cruds
from app.auth import get_current_user

router = APIRouter()
crud_inventario = CRUDInventario(db=None)  # Inicializar sin conexión

@router.post("/inventario", response_model=Inventario)
def add_item(item: InventarioCreate, db: Session = Depends(get_db),
             current_user: dict = Depends(get_current_user)):
    if current_user['rol'] not in ["Admin", "Almacen"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")

    crud_inventario.db = db
    return crud_inventario.agregar_item(item)

@router.get("/inventario/{item_id}", response_model=Inventario)
def get_item(item_id: int, db: Session = Depends(get_db)):
    crud_inventario.db = db
    return crud_inventario.obtener_item(item_id)

@router.get("/inventario", response_model=list[Inventario])
def get_items(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    crud_inventario.db = db
    return crud_inventario.obtener_items(skip=skip, limit=limit)

@router.put("/inventario/{item_id}", response_model=Inventario)
def update_item(item_id: int, item: InventarioCreate, db: Session = Depends(get_db),
                current_user: dict = Depends(get_current_user)):
    if current_user['rol'] not in ["Admin", "Almacen"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")

    crud_inventario.db = db
    return crud_inventario.actualizar_item(item_id, item)

@router.delete("/inventario/{item_id}", response_model=Inventario)
def delete_item(item_id: int, db: Session = Depends(get_db),
                current_user: dict = Depends(get_current_user)):
    if current_user['rol'] != "Admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")

    crud_inventario.db = db
    return crud_inventario.eliminar_item(item_id)
