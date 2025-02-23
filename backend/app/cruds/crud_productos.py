from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from fastapi import HTTPException, status
from app.models import Producto, Proveedor
from app.schemas import ProductoCreate
import os

class CRUDProducto:
    def __init__(self, db: Session):
        self.db = db

    def crear_producto(self, producto_data: ProductoCreate) -> Producto:
        try:
            # Validar que el proveedor exista si se proporciona proveedor_id
            if producto_data.proveedor_id:
                proveedor = self.db.query(Proveedor).filter(Proveedor.id == producto_data.proveedor_id).first()
                if not proveedor:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="El proveedor especificado no existe."
                    )

            nuevo_producto = Producto(**producto_data.dict())
            self.db.add(nuevo_producto)
            self.db.commit()  # Confirma la transacción
            self.db.refresh(nuevo_producto)  # Actualiza el objeto con el ID generado
            print(f"Producto persistido: {nuevo_producto}")
            return nuevo_producto
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El producto ya existe o hay un error de integridad."
            )
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear el producto: {str(e)}"
            )
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error inesperado al crear el producto: {str(e)}"
            )

    def obtener_producto(self, producto_id: int) -> Producto:
        db_producto = (
            self.db.query(Producto, Proveedor.nombre.label("proveedor_nombre"))
            .join(Proveedor, Producto.proveedor_id == Proveedor.id, isouter=True)
            .filter(Producto.id == producto_id)
            .first()
        )
        if not db_producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado."
            )
        producto, proveedor_nombre = db_producto
        producto.proveedor_nombre = proveedor_nombre  # Añadir el nombre del proveedor
        return producto

    def obtener_productos(self):
        productos = (
            self.db.query(Producto, Proveedor.nombre.label("proveedor_nombre"))
            .join(Proveedor, Producto.proveedor_id == Proveedor.id, isouter=True)
            .all()
        )
        resultado = []
        for producto, proveedor_nombre in productos:
            producto_dict = producto.__dict__.copy()
            producto_dict["proveedor_nombre"] = proveedor_nombre
            resultado.append(producto_dict)
        return resultado

    def actualizar_producto(self, producto_id: int, producto_data: ProductoCreate, usuario_id: int) -> Producto:
        db_producto = self.db.query(Producto).filter(Producto.id == producto_id).first()
        if not db_producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado."
            )

        # Validar que el proveedor exista si se proporciona proveedor_id
        if producto_data.proveedor_id:
            proveedor = self.db.query(Proveedor).filter(Proveedor.id == producto_data.proveedor_id).first()
            if not proveedor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="El proveedor especificado no existe."
                )

        for key, value in producto_data.dict().items():
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
        if not db_producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado."
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

    def actualizar_imagen_producto(self, producto_id: int, imagen_url: str) -> Producto:
        producto = self.db.query(Producto).filter(Producto.id == producto_id).first()
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado."
            )
        try:
            producto.imagen_url = imagen_url  # Actualizar el campo imagen_url
            self.db.commit()  # Guardar los cambios
            self.db.refresh(producto)  # Refrescar la instancia activa
            return producto
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar la imagen del producto: {str(e)}"
            )
