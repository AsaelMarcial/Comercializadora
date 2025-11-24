from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from app.models import Cliente, ClienteCotizacion, Proyecto
from app.schemas import (
    ClienteCreate,
    ClienteUpdate,
    ClienteCotizacionCreate,
)
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CRUDCliente:
    def __init__(self, db: Session):
        self.db = db

    def _obtener_proyecto_principal_id(self, cliente: Cliente):
        if not cliente.proyectos:
            return None
        proyectos_ordenados = sorted(
            cliente.proyectos, key=lambda proyecto: proyecto.id or 0
        )
        return proyectos_ordenados[0].id

    def crear_cliente(self, cliente_data: ClienteCreate) -> Cliente:
        """Crear un nuevo cliente, incluyendo sus proyectos asociados."""
        try:
            nuevo_cliente = Cliente(
                nombre=cliente_data.nombre,
                proyecto=cliente_data.proyecto or "",
                direccion=cliente_data.direccion,
                descuento=cliente_data.descuento if cliente_data.descuento is not None else 0,
            )

            if cliente_data.proyectos:
                for proyecto_data in cliente_data.proyectos:
                    nuevo_cliente.proyectos.append(
                        Proyecto(
                            nombre=proyecto_data.nombre,
                            descripcion=proyecto_data.descripcion,
                            direccion=getattr(proyecto_data, "direccion", None),
                        )
                    )

            self.db.add(nuevo_cliente)
            self.db.flush()

            proyecto_principal_id = self._obtener_proyecto_principal_id(nuevo_cliente)
            if proyecto_principal_id is not None:
                nuevo_cliente.proyecto = str(proyecto_principal_id)
            elif nuevo_cliente.proyecto is None:
                nuevo_cliente.proyecto = ""

            self.db.commit()
            logger.info(f"Cliente creado con ID {nuevo_cliente.id}")
            return self.obtener_cliente(nuevo_cliente.id)
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error al crear cliente: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear cliente: {str(e)}"
            )

    def obtener_cliente(self, cliente_id: int) -> Cliente:
        """Obtener un cliente por ID, cargando sus proyectos asociados."""
        try:
            cliente = (
                self.db.query(Cliente)
                .options(joinedload(Cliente.proyectos))
                .filter(Cliente.id == cliente_id)
                .first()
            )
            if not cliente:
                logger.warning(f"Cliente con ID {cliente_id} no encontrado")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Cliente no encontrado",
                )
            return cliente
        except SQLAlchemyError as e:
            logger.error(f"Error al obtener cliente con ID {cliente_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener cliente: {str(e)}"
            )

    def obtener_clientes(self):
        """Obtener todos los clientes con sus proyectos relacionados."""
        try:
            clientes = (
                self.db.query(Cliente)
                .options(joinedload(Cliente.proyectos))
                .all()
            )
            logger.info(f"Se obtuvieron {len(clientes)} clientes")
            return clientes
        except SQLAlchemyError as e:
            logger.error(f"Error al obtener clientes: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener clientes: {str(e)}"
            )

    def eliminar_cliente(self, cliente_id: int):
        """Elimina un cliente por su ID, incluyendo las relaciones asociadas."""
        cliente = (
            self.db.query(Cliente)
            .options(joinedload(Cliente.proyectos))
            .filter(Cliente.id == cliente_id)
            .first()
        )
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        try:
            self.db.query(ClienteCotizacion).filter(
                ClienteCotizacion.cliente_id == cliente_id
            ).delete(synchronize_session=False)

            self.db.delete(cliente)
            self.db.commit()
        except SQLAlchemyError as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar el cliente: {str(e)}"
            )

    def actualizar_cliente(self, cliente_id: int, cliente_data: ClienteUpdate) -> Cliente:
        cliente = (
            self.db.query(Cliente)
            .options(joinedload(Cliente.proyectos))
            .filter(Cliente.id == cliente_id)
            .first()
        )
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        datos_actualizados = cliente_data.dict(exclude_unset=True)
        proyectos_nuevos = datos_actualizados.pop("proyectos", None)

        for key, value in datos_actualizados.items():
            if key == "descuento":
                if value is not None:
                    setattr(cliente, key, value)
            elif key == "proyecto":
                setattr(cliente, key, value or cliente.proyecto)
            elif value is not None:
                setattr(cliente, key, value)

        if proyectos_nuevos:
            for proyecto_data in proyectos_nuevos:
                cliente.proyectos.append(
                    Proyecto(
                        nombre=proyecto_data.nombre,
                        descripcion=proyecto_data.descripcion,
                        direccion=getattr(proyecto_data, "direccion", None),
                    )
                )

        self.db.flush()

        proyecto_principal_id = self._obtener_proyecto_principal_id(cliente)
        if proyecto_principal_id is not None:
            cliente.proyecto = str(proyecto_principal_id)
        elif cliente.proyecto is None:
            cliente.proyecto = ""

        self.db.commit()
        return self.obtener_cliente(cliente_id)


class CRUDClienteCotizacion:
    def __init__(self, db: Session):
        self.db = db

    def asociar_cotizacion_cliente(self, cliente_cotizacion_data: ClienteCotizacionCreate) -> ClienteCotizacion:
        """Asociar una cotización a un cliente."""
        try:
            nueva_asociacion = ClienteCotizacion(
                cliente_id=cliente_cotizacion_data.cliente_id,
                cotizacion_id=cliente_cotizacion_data.cotizacion_id,
                estado=cliente_cotizacion_data.estado
            )
            self.db.add(nueva_asociacion)
            self.db.commit()
            self.db.refresh(nueva_asociacion)
            logger.info(
                f"Cotización {nueva_asociacion.cotizacion_id} asociada al cliente {nueva_asociacion.cliente_id}"
            )
            return nueva_asociacion
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error al asociar cotización a cliente: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al asociar cotización a cliente: {str(e)}"
            )

    def obtener_cotizaciones_cliente(self, cliente_id: int):
        """Obtener todas las cotizaciones asociadas a un cliente."""
        try:
            cotizaciones = self.db.query(ClienteCotizacion).filter(
                ClienteCotizacion.cliente_id == cliente_id
            ).all()
            logger.info(
                f"Se obtuvieron {len(cotizaciones)} cotizaciones para el cliente {cliente_id}"
            )
            return cotizaciones
        except SQLAlchemyError as e:
            logger.error(f"Error al obtener cotizaciones del cliente {cliente_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener cotizaciones del cliente: {str(e)}"
            )

    def eliminar_asociacion(self, cliente_cotizacion_id: int):
        """Eliminar una asociación entre cliente y cotización."""
        try:
            asociacion = self.db.query(ClienteCotizacion).filter(
                ClienteCotizacion.id == cliente_cotizacion_id
            ).first()
            if not asociacion:
                logger.warning(f"Asociación con ID {cliente_cotizacion_id} no encontrada")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Asociación no encontrada"
                )

            self.db.delete(asociacion)
            self.db.commit()
            logger.info(f"Asociación con ID {cliente_cotizacion_id} eliminada")
            return asociacion
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error al eliminar asociación con ID {cliente_cotizacion_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar asociación: {str(e)}"
            )


