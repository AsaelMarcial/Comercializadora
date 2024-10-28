from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.models import Usuario as UsuarioModel
from app.schemas import UsuarioCreate
from fastapi import HTTPException, status

class CRUDUsuario:
    def __init__(self, db: Session):
        self.db = db

    def crear_usuario(self, usuario: UsuarioCreate):
        try:
            db_usuario = UsuarioModel(**usuario.dict())
            self.db.add(db_usuario)
            self.db.commit()
            self.db.refresh(db_usuario)
            return db_usuario
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario ya existe o hay un error de integridad"
            )
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear el usuario: {str(e)}"
            )

    def obtener_usuario(self, usuario_id: int):
        db_usuario = self.db.query(UsuarioModel).filter(UsuarioModel.id == usuario_id).first()
        if db_usuario is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        return db_usuario

    def obtener_usuarios(self, skip: int = 0, limit: int = 10):
        return self.db.query(UsuarioModel).offset(skip).limit(limit).all()

    def actualizar_usuario(self, usuario_id: int, usuario: UsuarioCreate):
        db_usuario = self.db.query(UsuarioModel).filter(UsuarioModel.id == usuario_id).first()
        if db_usuario is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        for key, value in usuario.dict().items():
            setattr(db_usuario, key, value)

        try:
            self.db.commit()
            self.db.refresh(db_usuario)
            return db_usuario
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar el usuario: {str(e)}"
            )

    def eliminar_usuario(self, usuario_id: int):
        db_usuario = self.db.query(UsuarioModel).filter(UsuarioModel.id == usuario_id).first()
        if db_usuario is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        try:
            self.db.delete(db_usuario)
            self.db.commit()
            return db_usuario
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar el usuario: {str(e)}"
            )
