from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field, PositiveInt, constr, condecimal, root_validator
from datetime import datetime

class ProveedorBase(BaseModel):
    nombre: constr(max_length=255)
    direccion: Optional[constr(max_length=255)] = None
    telefono: Optional[constr(max_length=20)] = None
    email: Optional[EmailStr] = None
    contacto: Optional[constr(max_length=100)] = None

    class Config:
        schema_extra = {
            "example": {
                "nombre": "Proveedor ABC",
                "direccion": "Calle 123, Ciudad, País",
                "telefono": "1234567890",
                "email": "proveedor@abc.com",
                "contacto": "Juan Pérez"
            }
        }

class ProveedorCreate(ProveedorBase):
    pass

class Proveedor(ProveedorBase):
    id: int

    class Config:
        orm_mode = True


class SucursalBase(BaseModel):
    nombre: constr(max_length=255)
    direccion: Optional[constr(max_length=255)] = None
    telefono: Optional[constr(max_length=20)] = None
    contacto: Optional[constr(max_length=100)] = None
    horario: Optional[constr(max_length=255)] = None

    class Config:
        schema_extra = {
            "example": {
                "nombre": "Sucursal Centro",
                "direccion": "Av. Principal 123, Ciudad",
                "telefono": "555-1234",
                "contacto": "María López",
                "horario": "Lunes a viernes de 9:00 a 18:00"
            }
        }


class SucursalCreate(SucursalBase):
    pass


class SucursalUpdate(BaseModel):
    nombre: Optional[constr(max_length=255)] = None
    direccion: Optional[constr(max_length=255)] = None
    telefono: Optional[constr(max_length=20)] = None
    contacto: Optional[constr(max_length=100)] = None
    horario: Optional[constr(max_length=255)] = None


class Sucursal(SucursalBase):
    id: int

    class Config:
        orm_mode = True

# Esquema para Producto
class ProductoBase(BaseModel):
    codigo: constr(max_length=30)
    nombre: constr(max_length=100)
    formato: Optional[str] = None
    unidad_venta: Optional[str] = None
    piezas_caja: Optional[PositiveInt] = None
    peso_pieza_kg: Optional[float] = None
    peso_caja_kg: Optional[float] = None
    m2_caja: Optional[float] = None
    precio_caja_con_iva: Optional[float] = None
    precio_caja_sin_iva: Optional[float] = None
    precio_pieza_con_iva: Optional[float] = None
    precio_pieza_sin_iva: Optional[float] = None
    precio_m2_con_iva: Optional[float] = None
    precio_m2_sin_iva: Optional[float] = None
    color: Optional[str] = None
    material: Optional[str] = None
    es_externo: Optional[bool] = False
    proveedor_id: Optional[int] = None

    class Config:
        schema_extra = {
            "example": {
                "codigo": "P123",
                "nombre": "Losa Cerámica",
                "formato": "30x30",
                "unidad_venta": "caja",
                "piezas_caja": 12,
                "peso_pieza_kg": 1.2,
                "peso_caja_kg": 14.4,
                "m2_caja": 1.08,
                "precio_caja_con_iva": 580.0,
                "precio_caja_sin_iva": 500.0,
                "precio_pieza_con_iva": 48.33,
                "precio_pieza_sin_iva": 41.67,
                "precio_m2_con_iva": 537.83,
                "precio_m2_sin_iva": 462.96,
                "color": "Blanco",
                "material": "Cerámica",
                "es_externo": False,
                "proveedor_id": 1  # ID del proveedor asociado
            }
        }

class ProductoCreate(ProductoBase):
    pass

class Producto(ProductoBase):
    id: int
    proveedor: Optional[Proveedor]  # Relación con el proveedor

    class Config:
        orm_mode = True

# Esquema para Usuario
class UsuarioBase(BaseModel):
    nombre: constr(max_length=50)
    email: EmailStr
    rol: constr(max_length=20)

    class Config:
        schema_extra = {
            "example": {
                "nombre": "Juan Pérez",
                "email": "juan.perez@email.com",
                "rol": "Admin"
            }
        }

class UsuarioCreate(UsuarioBase):
    password: str

class Usuario(UsuarioBase):
    id: int

    class Config:
        orm_mode = True

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    rol: str

    class Config:
        orm_mode = True

# Esquema para Inventario
class InventarioBase(BaseModel):
    producto_id: int
    cantidad: PositiveInt
    ubicacion: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "producto_id": 1,
                "cantidad": 100,
                "ubicacion": "Almacén 1"
            }
        }

class InventarioCreate(InventarioBase):
    pass

class Inventario(InventarioBase):
    id: int

    class Config:
        orm_mode = True

# Esquema para Órdenes de Venta y Detalle
class OrdenVentaDetalleBase(BaseModel):
    producto_id: int
    cantidad: condecimal(max_digits=10, decimal_places=2)
    precio_unitario: condecimal(max_digits=10, decimal_places=2)

class OrdenVentaDetalleCreate(OrdenVentaDetalleBase):
    pass

class OrdenVentaDetalle(OrdenVentaDetalleBase):
    id: int

    class Config:
        orm_mode = True

class OrdenVentaBase(BaseModel):
    cliente: str
    total: condecimal(max_digits=10, decimal_places=2)
    estado: Optional[constr(max_length=50)] = "surtiendo"
    comentarios: Optional[str] = None
    cotizacion_id: Optional[int] = None
    cliente_id: Optional[int] = None
    proyecto_id: Optional[int] = None
    usuario_id: Optional[int] = None

class OrdenVentaCreate(OrdenVentaBase):
    detalles: List[OrdenVentaDetalleCreate]

class OrdenVenta(OrdenVentaBase):
    id: int
    fecha: datetime
    detalles: List[OrdenVentaDetalle]

    class Config:
        orm_mode = True

# Esquema para Órdenes de Compra y Detalle
class OrdenCompraDetalleBase(BaseModel):
    producto_id: int
    cantidad: condecimal(max_digits=10, decimal_places=2)
    precio_unitario: condecimal(max_digits=10, decimal_places=2)

class OrdenCompraDetalleCreate(OrdenCompraDetalleBase):
    pass

class OrdenCompraDetalle(OrdenCompraDetalleBase):
    id: int

    class Config:
        orm_mode = True

class OrdenCompraBase(BaseModel):
    proveedor_id: int
    total: condecimal(max_digits=10, decimal_places=2)

class OrdenCompraCreate(OrdenCompraBase):
    detalles: List[OrdenCompraDetalleCreate]

class OrdenCompra(OrdenCompraBase):
    id: int
    detalles: List[OrdenCompraDetalle]

    class Config:
        orm_mode = True

# Esquema para Login
class LoginSchema(BaseModel):
    email: EmailStr
    password: str

    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "1234"
            }
        }

# Esquema para los detalles de la cotización
class ClienteInfo(BaseModel):
    nombre: constr(max_length=255)
    proyecto: Optional[str] = None
    direccion: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "nombre": "Cliente ABC",
                "proyecto": "Proyecto XYZ",
                "direccion": "Calle 123, Ciudad, País"
            }
        }

class CotizacionDetalleBase(BaseModel):
    producto_id: PositiveInt
    cantidad: condecimal(max_digits=20, decimal_places=2)
    precio_unitario: condecimal(max_digits=20, decimal_places=2)
    costo_base: Optional[condecimal(max_digits=20, decimal_places=2)] = None
    tipo_variante: Optional[str] = None  # Nuevo campo agregado
    ganancia_porcentaje: Optional[
        condecimal(max_digits=7, decimal_places=2, ge=0)
    ] = Field(
        default=None,
        description=(
            "Porcentaje de utilidad aplicado al costo base del producto (se admite 0). "
            "Se utiliza para calcular la ganancia total del detalle cuando el monto no "
            "se envía explícitamente."
        ),
    )
    ganancia_monto: Optional[
        condecimal(max_digits=20, decimal_places=2, ge=0)
    ] = Field(
        default=None,
        description=(
            "Monto total de utilidad del detalle considerando la cantidad solicitada "
            "(se admite 0). Debe ser consistente con el porcentaje y el precio "
            "unitario enviado."
        ),
    )

    class Config:
        schema_extra = {
            "example": {
                "producto_id": 1,
                "cantidad": 10.5,
                "precio_unitario": 50.00,
                "costo_base": 45.00,
                "tipo_variante": "Caja",  # Ejemplo del nuevo campo
                "ganancia_porcentaje": 15.5,
                "ganancia_monto": 81.38,
            }
        }

    @root_validator(skip_on_failure=True)
    def validar_ganancias(cls, values):
        precio_unitario = values.get("precio_unitario")
        cantidad = values.get("cantidad")
        ganancia_porcentaje = values.get("ganancia_porcentaje")
        ganancia_monto = values.get("ganancia_monto")
        costo_base = values.get("costo_base")

        if ganancia_porcentaje is not None and Decimal(ganancia_porcentaje) < 0:
            raise ValueError("ganancia_porcentaje no puede ser negativo")
        if ganancia_monto is not None and Decimal(ganancia_monto) < 0:
            raise ValueError("ganancia_monto no puede ser negativo")

        if (
            precio_unitario is not None
            and cantidad is not None
            and cantidad != 0
            and ganancia_monto is not None
        ):
            cantidad_decimal = Decimal(cantidad)
            precio_unitario_decimal = Decimal(precio_unitario)
            monto_decimal = Decimal(ganancia_monto)
            tolerancia = Decimal("0.01")

            if ganancia_porcentaje is not None:
                if costo_base is not None:
                    costo_base_decimal = Decimal(costo_base)
                    monto_esperado = costo_base_decimal * cantidad_decimal * (Decimal(ganancia_porcentaje) / Decimal("100"))
                else:
                    factor = Decimal("1") + Decimal(ganancia_porcentaje) / Decimal("100")
                    if factor != 0:
                        costo_unitario_est = precio_unitario_decimal / factor
                        monto_esperado = (precio_unitario_decimal - costo_unitario_est) * cantidad_decimal
                    else:
                        monto_esperado = monto_decimal

                if abs(monto_esperado - monto_decimal) > tolerancia:
                    raise ValueError(
                        "ganancia_monto no es consistente con ganancia_porcentaje y precio_unitario"
                    )

        return values

class CotizacionDetalleCreate(CotizacionDetalleBase):
    pass

class CotizacionDetalle(CotizacionDetalleBase):
    id: int

    class Config:
        orm_mode = True

# Esquema para la cotización completa
class CotizacionBase(BaseModel):
    cliente: constr(max_length=255)
    total: condecimal(max_digits=10, decimal_places=2)
    fecha: Optional[datetime] = None
    detalles: List[CotizacionDetalleCreate]

    class Config:
        schema_extra = {
            "example": {
                "cliente": "Juan Pérez",
                "total": 500.00,
                "fecha": "2025-01-13T15:30:00",
                "detalles": [
                    {
                        "producto_id": 1,
                        "cantidad": 10.5,
                        "precio_unitario": 50.00,
                        "tipo_variante": "Caja"
                    },
                    {
                        "producto_id": 2,
                        "cantidad": 5,
                        "precio_unitario": 60.00,
                        "tipo_variante": "m2"
                    }
                ]
            }
        }

class CotizacionCreate(BaseModel):
    cliente: str
    total: condecimal(max_digits=10, decimal_places=2)
    detalles: list[CotizacionDetalleCreate]
    costo_envio: Optional[condecimal(max_digits=10, decimal_places=2)] = 0.00
    cliente_id: int
    variante_envio: str
    proyecto_id: Optional[int] = None

    class Config:
        schema_extra = {
            "example": {
                "cliente": "Cliente ABC",
                "total": 1050.50,
                "detalles": [
                    {"producto_id": 1, "cantidad": 5.5, "precio_unitario": 210.10, "tipo_variante": "Caja"},
                    {"producto_id": 2, "cantidad": 2, "precio_unitario": 315.15, "tipo_variante": "m2"}
                ],
                "costo_envio": 50.00,
                "cliente_id" : 1,
                "proyecto_id": 3
            }
        }


class CotizacionDetalleUpdate(BaseModel):
    producto_id: Optional[PositiveInt] = None
    cantidad: Optional[condecimal(max_digits=20, decimal_places=2)] = None
    precio_unitario: Optional[condecimal(max_digits=20, decimal_places=2)] = None
    costo_base: Optional[condecimal(max_digits=20, decimal_places=2)] = None
    tipo_variante: Optional[str] = None
    ganancia_porcentaje: Optional[condecimal(max_digits=7, decimal_places=2)] = None
    ganancia_monto: Optional[condecimal(max_digits=20, decimal_places=2)] = None


class CotizacionUpdate(BaseModel):
    cliente_id: Optional[int] = None
    proyecto_id: Optional[int] = None
    total: Optional[condecimal(max_digits=10, decimal_places=2)] = None
    detalles: Optional[list[CotizacionDetalleCreate]] = None
    costo_envio: Optional[condecimal(max_digits=10, decimal_places=2)] = None
    variante_envio: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "cliente_id": 2,
                "proyecto_id": 4,
                "total": 1500.75,
                "detalles": [
                    {"producto_id": 3, "cantidad": 2, "precio_unitario": 250.00, "tipo_variante": "Caja"}
                ],
                "costo_envio": 30.00,
                "variante_envio": "express"
            }
        }



class Cotizacion(CotizacionBase):
    id: int

    class Config:
        orm_mode = True


class CotizacionDetalleResponse(BaseModel):
    producto_id: int
    cantidad: condecimal(max_digits=10, decimal_places=2)
    precio_unitario: condecimal(max_digits=10, decimal_places=2)
    total: condecimal(max_digits=10, decimal_places=2)
    tipo_variante: Optional[str] = None  # Nuevo campo incluido
    ganancia_porcentaje: Optional[condecimal(max_digits=7, decimal_places=2)] = None
    ganancia_monto: Optional[condecimal(max_digits=20, decimal_places=2)] = None  # Total de utilidad por línea

    class Config:
        orm_mode = True


class CotizacionConvertirVentaRequest(BaseModel):
    estado: Optional[constr(max_length=50)] = "surtiendo"
    comentarios: Optional[str] = None

# Esquema para Proyecto
class ProyectoBase(BaseModel):
    nombre: constr(max_length=255)
    descripcion: Optional[constr(max_length=500)] = None
    direccion: Optional[constr(max_length=255)] = None


class ProyectoCreate(ProyectoBase):
    cliente_id: Optional[int] = None


class ProyectoUpdate(BaseModel):
    nombre: Optional[constr(max_length=255)] = None
    descripcion: Optional[constr(max_length=500)] = None
    direccion: Optional[constr(max_length=255)] = None
    cliente_id: Optional[int] = None


class ProyectoResponse(ProyectoBase):
    id: int
    cliente_id: Optional[int] = None

    class Config:
        orm_mode = True

# Esquema para la respuesta de cotización
class CotizacionResponse(BaseModel):
    id: int
    cliente: str
    fecha: datetime
    total: condecimal(max_digits=10, decimal_places=2)
    usuario_id: int
    proyecto_id: Optional[int] = None
    proyecto: Optional[ProyectoResponse] = None
    detalles: List[CotizacionDetalleResponse]

    class Config:
        orm_mode = True


class ClienteBase(BaseModel):
    nombre: constr(max_length=255)
    proyecto: Optional[constr(max_length=255)] = ""
    direccion: Optional[constr(max_length=255)] = None
    descuento: Optional[condecimal(max_digits=5, decimal_places=2)] = None

    class Config:
        schema_extra = {
            "example": {
                "nombre": "Cliente ABC",
                "proyecto": "1",  # ID del proyecto principal en formato de texto
                "direccion": "Calle 123, Ciudad, País",
                "descuento": "10.50",
            }
        }


class ClienteCreate(ClienteBase):
    proyectos: Optional[List[ProyectoCreate]] = None


class ClienteUpdate(BaseModel):
    nombre: Optional[constr(max_length=255)] = None
    proyecto: Optional[constr(max_length=255)] = None
    direccion: Optional[constr(max_length=255)] = None
    descuento: Optional[condecimal(max_digits=5, decimal_places=2)] = None
    proyectos: Optional[List[ProyectoCreate]] = None


class ClienteResponse(ClienteBase):
    id: int
    proyectos: List[ProyectoResponse] = []

    class Config:
        orm_mode = True


class ClienteCotizacionBase(BaseModel):
    cotizacion_id: PositiveInt
    cliente_id: PositiveInt
    estado: Optional[str] = "pendiente"  # Estados posibles: pendiente, en proceso, completada, cancelada

    class Config:
        schema_extra = {
            "example": {
                "cotizacion_id": 1,
                "cliente_id": 2,
                "estado": "pendiente"
            }
        }


class ClienteCotizacionCreate(ClienteCotizacionBase):
    pass


class ClienteCotizacionResponse(ClienteCotizacionBase):
    id: int
    cliente: Optional[ClienteResponse]  # Relación opcional con el cliente
    cotizacion: Optional[dict]  # Relación opcional con la cotización (puedes ajustar según sea necesario)

    class Config:
        orm_mode = True
