from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from fastapi import HTTPException, status
from app.models import Producto
from app.schemas import ProductoCreate
import os

class CRUDProducto:
    def __init__(self, db: Session):
        self.db = db

    def crear_producto(self, producto_data: ProductoCreate) -> Producto:
        try:
            nuevo_producto = Producto(**producto_data.dict())
            self.db.add(nuevo_producto)
            self.db.commit()  # Confirma la transacción
            self.db.refresh(nuevo_producto)  # Actualiza el objeto con el ID generado
            print(f"Producto persistido: {nuevo_producto}")
            return nuevo_producto
        except Exception as e:
            print(f"Error en crear_producto: {str(e)}")
            self.db.rollback()
            raise
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

    def obtener_productos(self):
        return self.db.query(Producto).all()

    def actualizar_producto(self, producto_id: int, producto: ProductoCreate, usuario_id: int):
        db_producto = self.db.query(Producto).filter(Producto.id == producto_id).first()
        if db_producto is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado"
            )

        for key, value in producto.dict().items():
            setattr(db_producto, key, value)

        # Registrar el ID del usuario que modificó el producto
        db_producto.ultimo_usuario_id = usuario_id

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
            # Eliminar imagen si existe
            image_path = f"./uploads/producto_{producto_id}.jpeg"
            if os.path.exists(image_path):
                os.remove(image_path)

            # Eliminar producto
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
