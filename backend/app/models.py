from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, DECIMAL, TIMESTAMP, Text, func
)
from sqlalchemy.orm import relationship
from .database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    rol = Column(String(50), nullable=False)  # Ej: 'Admin', 'Vendedor', 'Almacén'
    password_hash = Column(String(255))  # Ahora con longitud definida
    productos = relationship("Producto", back_populates="usuario")

# Modelo de Proveedores
class Proveedor(Base):
    __tablename__ = "proveedores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    direccion = Column(String(255))
    telefono = Column(String(20))
    email = Column(String(100))
    contacto = Column(String(100))

# Modelo de Productos
class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=True)  # Permitir NULL si es necesario
    nombre = Column(String(255), nullable=False)  # Campo obligatorio
    formato = Column(String(50), nullable=True)  # Campo opcional
    unidad_venta = Column(String(20), nullable=True)
    piezas_caja = Column(Integer, nullable=True)
    peso_pieza_kg = Column(DECIMAL(10, 2), nullable=True)
    peso_caja_kg = Column(DECIMAL(10, 2), nullable=True)
    m2_caja = Column(DECIMAL(10, 2), nullable=True)
    precio_caja_con_iva = Column(DECIMAL(10, 2), nullable=True)
    precio_caja_sin_iva = Column(DECIMAL(10, 2), nullable=True)
    precio_pieza_con_iva = Column(DECIMAL(10, 2), nullable=True)
    precio_pieza_sin_iva = Column(DECIMAL(10, 2), nullable=True)
    precio_m2_con_iva = Column(DECIMAL(10, 2), nullable=True)
    precio_m2_sin_iva = Column(DECIMAL(10, 2), nullable=True)
    es_externo = Column(Boolean, default=False)
    ultimo_usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id", ondelete="SET NULL"), nullable=True)  # Relación con Proveedor
    fecha_modificacion = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    color = Column(String(50), nullable=True)
    material = Column(String(50), nullable=True)

    # Relaciones
    usuario = relationship("Usuario", back_populates="productos")
    inventario = relationship("Inventario", uselist=False, back_populates="producto")
    proveedor = relationship("Proveedor", lazy="joined")  # Relación con el modelo Proveedor

# Modelo de Inventario
class Inventario(Base):
    __tablename__ = "inventario"

    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="CASCADE"))
    cantidad = Column(Integer, nullable=False)
    ubicacion = Column(String(255))

    producto = relationship("Producto", back_populates="inventario")

# Modelo de Movimientos de Inventario
class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"

    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="CASCADE"))
    tipo_movimiento = Column(String(50), nullable=False)  # 'entrada', 'salida', 'ajuste'
    cantidad = Column(Integer, nullable=False)
    fecha = Column(TIMESTAMP, server_default=func.now())
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    comentario = Column(Text)

    producto = relationship("Producto")
    usuario = relationship("Usuario")

# Modelo de Órdenes de Venta
class OrdenVenta(Base):
    __tablename__ = "ordenes_venta"

    id = Column(Integer, primary_key=True, index=True)
    cliente = Column(String(255), nullable=False)
    fecha = Column(TIMESTAMP, server_default=func.now())
    total = Column(DECIMAL(10, 2))
    estado = Column(String(50), default="pendiente")  # Estado de la orden
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))

    usuario = relationship("Usuario")
    detalles = relationship("OrdenVentaDetalle", back_populates="orden", lazy="joined")

# Modelo de Detalle de Órdenes de Venta
class OrdenVentaDetalle(Base):
    __tablename__ = "ordenes_venta_detalle"

    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes_venta.id", ondelete="CASCADE"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10, 2))

    orden = relationship("OrdenVenta", back_populates="detalles")
    producto = relationship("Producto")

# Modelo de Órdenes de Compra
class OrdenCompra(Base):
    __tablename__ = "ordenes_compra"

    id = Column(Integer, primary_key=True, index=True)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"))
    fecha = Column(TIMESTAMP, server_default=func.now())
    total = Column(DECIMAL(10, 2))
    estado = Column(String(50), default="pendiente")  # Estado de la orden
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    orden_venta_id = Column(Integer, ForeignKey("ordenes_venta.id"))  # Relación con orden de venta

    proveedor = relationship("Proveedor")
    usuario = relationship("Usuario")
    detalles = relationship("OrdenCompraDetalle", back_populates="orden", lazy="joined")

# Modelo de Detalle de Órdenes de Compra
class OrdenCompraDetalle(Base):
    __tablename__ = "ordenes_compra_detalle"

    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes_compra.id", ondelete="CASCADE"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10, 2))

    orden = relationship("OrdenCompra", back_populates="detalles")
    producto = relationship("Producto")

# Modelo de Cotización
class Cotizacion(Base):
    __tablename__ = "cotizaciones"

    id = Column(Integer, primary_key=True, index=True)
    cliente = Column(String(255), nullable=False)
    fecha = Column(TIMESTAMP, default=func.now())
    total = Column(DECIMAL(20, 2), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    usuario = relationship("Usuario")
    detalles = relationship("CotizacionDetalle", back_populates="cotizacion")

# Modelo de Detalle de Cotización
class CotizacionDetalle(Base):
    __tablename__ = "cotizaciones_detalle"

    id = Column(Integer, primary_key=True, index=True)
    cotizacion_id = Column(Integer, ForeignKey("cotizaciones.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(DECIMAL(10, 2), nullable=False)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)
    total = Column(DECIMAL(20, 2), nullable=False)

    cotizacion = relationship("Cotizacion", back_populates="detalles")
    producto = relationship("Producto")