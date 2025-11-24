from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import Sucursal
from app.schemas import SucursalCreate, SucursalUpdate


class CRUDSucursal:
    def __init__(self, db: Session):
        self.db = db

    def crear_sucursal(self, sucursal_data: SucursalCreate) -> Sucursal:
        try:
            nueva_sucursal = Sucursal(**sucursal_data.dict())
            self.db.add(nueva_sucursal)
            self.db.commit()
            self.db.refresh(nueva_sucursal)
            return nueva_sucursal
        except SQLAlchemyError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear la sucursal: {str(exc)}",
            )

    def obtener_sucursal(self, sucursal_id: int) -> Sucursal:
        sucursal = self.db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
        if not sucursal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sucursal no encontrada.",
            )
        return sucursal

    def obtener_sucursales(self) -> list[Sucursal]:
        return self.db.query(Sucursal).all()

    def actualizar_sucursal(self, sucursal_id: int, sucursal_data: SucursalUpdate) -> Sucursal:
        sucursal = self.db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
        if not sucursal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sucursal no encontrada.",
            )

        for key, value in sucursal_data.dict(exclude_unset=True).items():
            setattr(sucursal, key, value)

        try:
            self.db.commit()
            self.db.refresh(sucursal)
            return sucursal
        except SQLAlchemyError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar la sucursal: {str(exc)}",
            )

    def eliminar_sucursal(self, sucursal_id: int) -> Sucursal:
        sucursal = self.db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
        if not sucursal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sucursal no encontrada.",
            )

        try:
            self.db.delete(sucursal)
            self.db.commit()
            return sucursal
        except SQLAlchemyError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar la sucursal: {str(exc)}",
            )
