from pydantic import BaseModel, EmailStr, PositiveInt, constr
from typing import Optional

# Esquema para Producto
class ProductoBase(BaseModel):
    codigo: constr(max_length=10)
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
                "es_externo": False
            }
        }

class ProductoCreate(ProductoBase):
    pass

class Producto(ProductoBase):
    id: int

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
    password: str  # Este es el valor en texto plano que se transformará en password_hash

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

# Esquema para Login
class LoginSchema(BaseModel):
    email: EmailStr
    password: str  # Este es el password que el usuario ingresa para autenticarse

    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "1234"
            }
        }
