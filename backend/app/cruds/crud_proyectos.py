from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from app.models import Cliente, Proyecto
from app.schemas import ProyectoCreate, ProyectoUpdate
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CRUDProyecto:
    def __init__(self, db: Session):
        self.db = db

    def listar_por_cliente(self, cliente_id: int):
        try:
            return (
                self.db.query(Proyecto)
                .options(joinedload(Proyecto.cliente))
                .filter(Proyecto.cliente_id == cliente_id)
                .all()
            )
        except SQLAlchemyError as e:
            logger.error(f"Error al listar proyectos del cliente {cliente_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener proyectos: {str(e)}",
            )

    def listar_todos(self):
        try:
            return self.db.query(Proyecto).options(joinedload(Proyecto.cliente)).all()
        except SQLAlchemyError as e:
            logger.error(f"Error al obtener todos los proyectos: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener proyectos: {str(e)}",
            )

    def obtener_por_id(self, proyecto_id: int) -> Proyecto:
        try:
            proyecto = (
                self.db.query(Proyecto)
                .options(joinedload(Proyecto.cliente))
                .filter(Proyecto.id == proyecto_id)
                .first()
            )
        except SQLAlchemyError as e:
            logger.error(f"Error al obtener proyecto {proyecto_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener proyecto: {str(e)}",
            )

        if not proyecto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto no encontrado",
            )

        return proyecto

    def crear_proyecto(self, proyecto_data: ProyectoCreate) -> Proyecto:
        if not proyecto_data.cliente_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El cliente asociado es obligatorio",
            )

        try:
            cliente = self.db.query(Cliente).filter(
                Cliente.id == proyecto_data.cliente_id
            ).first()
            if not cliente:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Cliente no encontrado",
                )

            nuevo_proyecto = Proyecto(
                nombre=proyecto_data.nombre,
                descripcion=getattr(proyecto_data, "descripcion", None),
                direccion=getattr(proyecto_data, "direccion", None),
                cliente=cliente,
            )
            self.db.add(nuevo_proyecto)
            self.db.commit()
            self.db.refresh(nuevo_proyecto)
            return nuevo_proyecto
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error al crear proyecto: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear proyecto: {str(e)}",
            )

    def actualizar_proyecto(self, proyecto_id: int, proyecto_data: ProyectoUpdate) -> Proyecto:
        proyecto = self.db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
        if not proyecto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto no encontrado",
            )

        datos = proyecto_data.dict(exclude_unset=True)

        if "cliente_id" in datos and datos["cliente_id"] is not None:
            cliente = self.db.query(Cliente).filter(
                Cliente.id == datos["cliente_id"]
            ).first()
            if not cliente:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Cliente no encontrado",
                )
            proyecto.cliente = cliente

        for campo in ("nombre", "descripcion"):
            if campo in datos and datos[campo] is not None:
                setattr(proyecto, campo, datos[campo])

        if "direccion" in datos:
            setattr(proyecto, "direccion", datos["direccion"])

        try:
            self.db.commit()
            self.db.refresh(proyecto)
            return proyecto
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error al actualizar proyecto {proyecto_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar proyecto: {str(e)}",
            )

    def reasignar_proyecto(self, proyecto_id: int, nuevo_cliente_id: int) -> Proyecto:
        proyecto = self.db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
        if not proyecto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto no encontrado",
            )

        cliente = self.db.query(Cliente).filter(Cliente.id == nuevo_cliente_id).first()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente no encontrado",
            )

        try:
            proyecto.cliente = cliente
            self.db.commit()
            self.db.refresh(proyecto)
            return proyecto
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error al reasignar proyecto {proyecto_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al reasignar proyecto: {str(e)}",
            )

    def eliminar_proyecto(self, proyecto_id: int) -> None:
        proyecto = self.db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
        if not proyecto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto no encontrado",
            )

        try:
            self.db.delete(proyecto)
            self.db.commit()
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error al eliminar proyecto {proyecto_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar proyecto: {str(e)}",
            )
