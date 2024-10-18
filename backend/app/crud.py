# backend/app/crud.py

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.models import Producto, Inventario
from app.schemas import ProductoCreate
from app.schemas import InventarioCreate


class CRUDProducto:
    def __init__(self, db: Session):
        self.db = db

    def crear_producto(self, producto: ProductoCreate):
        try:
            db_producto = Producto(**producto.dict())
            self.db.add(db_producto)
            self.db.commit()
            self.db.refresh(db_producto)
            return db_producto
        except IntegrityError:
            self.db.rollback()  # Deshacer cambios en caso de error
            raise ValueError("El producto ya existe o hay un error de integridad")
        except SQLAlchemyError as e:
            self.db.rollback()  # Deshacer cambios en caso de error
            raise ValueError(f"Error al crear el producto: {str(e)}")

    def obtener_producto(self, producto_id: int):
        db_producto = self.db.query(Producto).filter(Producto.id == producto_id).first()
        if db_producto is None:
            raise ValueError("Producto no encontrado")
        return db_producto

    def obtener_productos(self, skip: int = 0, limit: int = 10):
        return self.db.query(Producto).offset(skip).limit(limit).all()

    def actualizar_producto(self, producto_id: int, producto: ProductoCreate):
        db_producto = self.db.query(Producto).filter(Producto.id == producto_id).first()
        if db_producto is None:
            raise ValueError("Producto no encontrado")

        for key, value in producto.dict().items():
            setattr(db_producto, key, value)  # Actualiza cada campo

        try:
            self.db.commit()
            self.db.refresh(db_producto)
            return db_producto
        except SQLAlchemyError as e:
            self.db.rollback()  # Deshacer cambios en caso de error
            raise ValueError(f"Error al actualizar el producto: {str(e)}")

    def eliminar_producto(self, producto_id: int):
        db_producto = self.db.query(Producto).filter(Producto.id == producto_id).first()
        if db_producto is None:
            raise ValueError("Producto no encontrado")

        try:
            self.db.delete(db_producto)
            self.db.commit()
            return db_producto
        except SQLAlchemyError as e:
            self.db.rollback()  # Deshacer cambios en caso de error
            raise ValueError(f"Error al eliminar el producto: {str(e)}")


class CRUDInventario:
    def __init__(self, db: Session):
        self.db = db

    def crear_inventario(self, inventario: InventarioCreate):
        db_inventario = Inventario(**inventario.dict())
        self.db.add(db_inventario)
        self.db.commit()
        self.db.refresh(db_inventario)
        return db_inventario

    def obtener_inventario(self, producto_id: int):
        return self.db.query(Inventario).filter(Inventario.producto_id == producto_id).first()

    def actualizar_inventario(self, producto_id: int, cantidad: int):
        db_inventario = self.db.query(Inventario).filter(Inventario.producto_id == producto_id).first()
        if db_inventario:
            db_inventario.cantidad = cantidad
            self.db.commit()
            self.db.refresh(db_inventario)
            return db_inventario
        return None

    def eliminar_inventario(self, producto_id: int):
        db_inventario = self.db.query(Inventario).filter(Inventario.producto_id == producto_id).first()
        if db_inventario:
            self.db.delete(db_inventario)
            self.db.commit()
            return db_inventario
        return None