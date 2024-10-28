from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from fastapi import HTTPException, status
from app.models import Inventario
from app.schemas import InventarioCreate

class CRUDInventario:
    def __init__(self, db: Session):
        self.db = db

    def agregar_item(self, item: InventarioCreate):
        try:
            db_item = Inventario(**item.dict())
            self.db.add(db_item)
            self.db.commit()
            self.db.refresh(db_item)
            return db_item
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El item ya existe o hay un error de integridad"
            )
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al agregar el item: {str(e)}"
            )

    def obtener_item(self, item_id: int):
        db_item = self.db.query(Inventario).filter(Inventario.id == item_id).first()
        if db_item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item no encontrado"
            )
        return db_item

    def obtener_items(self, skip: int = 0, limit: int = 10):
        return self.db.query(Inventario).offset(skip).limit(limit).all()

    def actualizar_item(self, item_id: int, item: InventarioCreate):
        db_item = self.db.query(Inventario).filter(Inventario.id == item_id).first()
        if db_item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item no encontrado"
            )

        for key, value in item.dict().items():
            setattr(db_item, key, value)

        try:
            self.db.commit()
            self.db.refresh(db_item)
            return db_item
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar el item: {str(e)}"
            )

    def eliminar_item(self, item_id: int):
        db_item = self.db.query(Inventario).filter(Inventario.id == item_id).first()
        if db_item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item no encontrado"
            )

        try:
            self.db.delete(db_item)
            self.db.commit()
            return db_item
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar el item: {str(e)}"
            )
