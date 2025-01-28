from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from app.models import Cliente, ClienteCotizacion
from app.schemas import ClienteCreate, ClienteCotizacionCreate
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

    def crear_cliente(self, cliente_data: ClienteCreate) -> Cliente:
        """
        Crear un nuevo cliente.
        """
        try:
            nuevo_cliente = Cliente(
                nombre=cliente_data.nombre,
                proyecto=cliente_data.proyecto,
                direccion=cliente_data.direccion,
                descuento=cliente_data.descuento
            )
            self.db.add(nuevo_cliente)
            self.db.commit()
            self.db.refresh(nuevo_cliente)
            logger.info(f"Cliente creado con ID {nuevo_cliente.id}")
            return nuevo_cliente
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error al crear cliente: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear cliente: {str(e)}"
            )

    def obtener_cliente(self, cliente_id: int) -> Cliente:
        """
        Obtener un cliente por ID.
        """
        try:
            cliente = self.db.query(Cliente).filter(Cliente.id == cliente_id).first()
            if not cliente:
                logger.warning(f"Cliente con ID {cliente_id} no encontrado")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Cliente no encontrado"
                )
            return cliente
        except SQLAlchemyError as e:
            logger.error(f"Error al obtener cliente con ID {cliente_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener cliente: {str(e)}"
            )

    def obtener_clientes(self):
        """
        Obtener todos los clientes.
        """
        try:
            clientes = self.db.query(Cliente).all()
            logger.info(f"Se obtuvieron {len(clientes)} clientes")
            return clientes
        except SQLAlchemyError as e:
            logger.error(f"Error al obtener clientes: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener clientes: {str(e)}"
            )

    def eliminar_cliente(self, cliente_id: int):
        """
        Elimina un cliente por su ID, incluyendo las relaciones asociadas.
        """
        cliente = self.db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        try:
            # Eliminar relaciones en clientes_cotizacion
            self.db.query(ClienteCotizacion).filter(ClienteCotizacion.cliente_id == cliente_id).delete()

            # Eliminar el cliente
            self.db.delete(cliente)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Error al eliminar el cliente: {str(e)}"
            )

    def actualizar_cliente(self, cliente_id: int, cliente_data: ClienteCreate) -> Cliente:
        cliente = self.db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        for key, value in cliente_data.dict().items():
            setattr(cliente, key, value)

        self.db.commit()
        self.db.refresh(cliente)
        return cliente

class CRUDClienteCotizacion:
    def __init__(self, db: Session):
        self.db = db

    def asociar_cotizacion_cliente(self, cliente_cotizacion_data: ClienteCotizacionCreate) -> ClienteCotizacion:
        """
        Asociar una cotización a un cliente.
        """
        try:
            nueva_asociacion = ClienteCotizacion(
                cliente_id=cliente_cotizacion_data.cliente_id,
                cotizacion_id=cliente_cotizacion_data.cotizacion_id,
                estado=cliente_cotizacion_data.estado
            )
            self.db.add(nueva_asociacion)
            self.db.commit()
            self.db.refresh(nueva_asociacion)
            logger.info(f"Cotización {nueva_asociacion.cotizacion_id} asociada al cliente {nueva_asociacion.cliente_id}")
            return nueva_asociacion
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error al asociar cotización a cliente: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al asociar cotización a cliente: {str(e)}"
            )

    def obtener_cotizaciones_cliente(self, cliente_id: int):
        """
        Obtener todas las cotizaciones asociadas a un cliente.
        """
        try:
            cotizaciones = self.db.query(ClienteCotizacion).filter(ClienteCotizacion.cliente_id == cliente_id).all()
            logger.info(f"Se obtuvieron {len(cotizaciones)} cotizaciones para el cliente {cliente_id}")
            return cotizaciones
        except SQLAlchemyError as e:
            logger.error(f"Error al obtener cotizaciones del cliente {cliente_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener cotizaciones del cliente: {str(e)}"
            )

    def eliminar_asociacion(self, cliente_cotizacion_id: int):
        """
        Eliminar una asociación entre cliente y cotización.
        """
        try:
            asociacion = self.db.query(ClienteCotizacion).filter(ClienteCotizacion.id == cliente_cotizacion_id).first()
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


