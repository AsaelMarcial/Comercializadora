from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, DECIMAL, TIMESTAMP, Text, func
)
from sqlalchemy.orm import relationship
from .database import Base

# Modelo de Usuarios
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    rol = Column(String(50), nullable=False)  # Ej: 'Admin', 'Vendedor', 'Almacén'
    password_hash = Column(String)
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
    codigo = Column(String(50), unique=True, nullable=False)
    nombre = Column(String(255), nullable=False)
    formato = Column(String(50))
    unidad_venta = Column(String(20))
    piezas_caja = Column(Integer)
    peso_pieza_kg = Column(DECIMAL(10, 2))
    peso_caja_kg = Column(DECIMAL(10, 2))
    m2_caja = Column(DECIMAL(10, 2))
    precio_caja_con_iva = Column(DECIMAL(10, 2))
    precio_caja_sin_iva = Column(DECIMAL(10, 2))
    precio_pieza_con_iva = Column(DECIMAL(10, 2))
    precio_pieza_sin_iva = Column(DECIMAL(10, 2))
    precio_m2_con_iva = Column(DECIMAL(10, 2))
    precio_m2_sin_iva = Column(DECIMAL(10, 2))
    es_externo = Column(Boolean, default=False)
    ultimo_usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    fecha_modificacion = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    color = Column(String(50))
    material = Column(String(50))

    usuario = relationship("Usuario", back_populates="productos")
    inventario = relationship("Inventario", uselist=False, back_populates="producto")

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
    fecha = Column(TIMESTAMP, default="CURRENT_TIMESTAMP")
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    comentario = Column(Text)

    producto = relationship("Producto")
    usuario = relationship("Usuario")

# Modelo de Órdenes de Venta
class OrdenVenta(Base):
    __tablename__ = "ordenes_venta"

    id = Column(Integer, primary_key=True, index=True)
    cliente = Column(String(255), nullable=False)
    fecha = Column(TIMESTAMP, default="CURRENT_TIMESTAMP")
    total = Column(DECIMAL(10, 2))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))

    usuario = relationship("Usuario")
    detalles = relationship("OrdenVentaDetalle", back_populates="orden")

# Detalle de Órdenes de Venta
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
    fecha = Column(TIMESTAMP, default="CURRENT_TIMESTAMP")
    total = Column(DECIMAL(10, 2))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))

    proveedor = relationship("Proveedor")
    usuario = relationship("Usuario")
    detalles = relationship("OrdenCompraDetalle", back_populates="orden")

# Detalle de Órdenes de Compra
class OrdenCompraDetalle(Base):
    __tablename__ = "ordenes_compra_detalle"

    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes_compra.id", ondelete="CASCADE"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10, 2))

    orden = relationship("OrdenCompra", back_populates="detalles")
    producto = relationship("Producto")
