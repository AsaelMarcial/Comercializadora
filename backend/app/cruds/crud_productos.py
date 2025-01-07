from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from fastapi import HTTPException, status
from app.models import Producto
from app.schemas import ProductoCreate

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
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El producto ya existe o hay un error de integridad"
            )
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear el producto: {str(e)}"
            )

    def obtener_producto(self, producto_id: int):
        db_producto = self.db.query(Producto).filter(Producto.id == producto_id).first()
        if db_producto is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado"
            )
        return db_producto

    def obtener_productos(self, skip: int = 0, limit: int = 10):
        return self.db.query(Producto).offset(skip).limit(limit).all()

    def actualizar_producto(self, producto_id: int, producto: ProductoCreate):
        db_producto = self.db.query(Producto).filter(Producto.id == producto_id).first()
        if db_producto is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado"
            )

        for key, value in producto.dict().items():
            setattr(db_producto, key, value)

        try:
            self.db.commit()
            self.db.refresh(db_producto)
            return db_producto
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar el producto: {str(e)}"
            )

    def eliminar_producto(self, producto_id: int):
        db_producto = self.db.query(Producto).filter(Producto.id == producto_id).first()
        if db_producto is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado"
            )

        try:
            self.db.delete(db_producto)
            self.db.commit()
            return db_producto
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar el producto: {str(e)}"
            )

    def actualizar_imagen_producto(self, producto_id: int, imagen_url: str):
        # Buscar el producto en la base de datos
        producto = self.db.query(Producto).filter(Producto.id == producto_id).first()
        if producto:
            producto.imagen_url = imagen_url  # Actualizar el campo imagen_url
            self.db.commit()  # Guardar los cambios
            self.db.refresh(producto)  # Refrescar la instancia activa
            return producto  # Retornar el producto actualizado
        raise HTTPException(status_code=404, detail="Producto no encontrado")  # Si no se encuentra
