from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from fastapi import HTTPException, status
from app.models import Proveedor
from app.schemas import ProveedorCreate

class CRUDProveedor:
    def __init__(self, db: Session):
        self.db = db

    def crear_proveedor(self, proveedor_data: ProveedorCreate) -> Proveedor:
        try:
            nuevo_proveedor = Proveedor(**proveedor_data.dict())
            self.db.add(nuevo_proveedor)
            self.db.commit()  # Confirma la transacción
            self.db.refresh(nuevo_proveedor)  # Actualiza el objeto con el ID generado
            print(f"Proveedor creado: {nuevo_proveedor}")
            return nuevo_proveedor
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El proveedor ya existe o hay un error de integridad."
            )
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear el proveedor: {str(e)}"
            )

    def obtener_proveedor(self, proveedor_id: int) -> Proveedor:
        db_proveedor = self.db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
        if not db_proveedor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proveedor no encontrado."
            )
        return db_proveedor

    def obtener_proveedores(self) -> list[Proveedor]:
        return self.db.query(Proveedor).all()

    def actualizar_proveedor(self, proveedor_id: int, proveedor_data: ProveedorCreate) -> Proveedor:
        db_proveedor = self.db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
        if not db_proveedor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proveedor no encontrado."
            )

        for key, value in proveedor_data.dict().items():
            setattr(db_proveedor, key, value)

        try:
            self.db.commit()
            self.db.refresh(db_proveedor)
            return db_proveedor
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar el proveedor: {str(e)}"
            )

    def eliminar_proveedor(self, proveedor_id: int):
        db_proveedor = self.db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
        if not db_proveedor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proveedor no encontrado."
            )
        try:
            self.db.delete(db_proveedor)
            self.db.commit()
            return db_proveedor
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar el proveedor: {str(e)}"
            )
