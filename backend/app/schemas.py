# backend/app/schemas.py

from pydantic import BaseModel, EmailStr
from typing import Optional

# Esquema base para Producto
class ProductoBase(BaseModel):
    codigo: str
    nombre: str
    formato: Optional[str] = None
    unidad_venta: Optional[str] = None
    piezas_caja: Optional[int] = None
    peso_pieza_kg: Optional[float] = None
    peso_caja_kg: Optional[float] = None
    m2_caja: Optional[float] = None
    precio_caja: Optional[float] = None
    precio_caja_con_iva: Optional[float] = None
    precio_caja_sin_iva: Optional[float] = None
    precio_pieza: Optional[float] = None
    precio_pieza_con_iva: Optional[float] = None
    precio_pieza_sin_iva: Optional[float] = None
    precio_m2: Optional[float] = None
    precio_m2_con_iva: Optional[float] = None
    precio_m2_sin_iva: Optional[float] = None
    imagen_url: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    es_externo: Optional[bool] = False

# Esquema para crear un nuevo Producto
class ProductoCreate(ProductoBase):
    pass  # Puedes añadir validaciones o campos específicos si lo necesitas

# Esquema para retornar un Producto
class Producto(ProductoBase):
    id: int

    class Config:
        orm_mode = True  # Permite que Pydantic use ORM para mapear la respuesta

# Esquema base para Usuario
class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr  # Email con validación
    rol: str  # Ejemplo de rol, puedes ajustarlo según tu modelo

# Esquema para crear un nuevo Usuario
class UsuarioCreate(UsuarioBase):
    password: str  # Añade el campo de contraseña si es necesario

# Esquema para retornar un Usuario
class Usuario(UsuarioBase):
    id: int

    class Config:
        orm_mode = True  # Permite que Pydantic use ORM para mapear la respuesta


class InventarioBase(BaseModel):
    producto_id: int
    cantidad: int
    ubicacion: Optional[str] = None

class InventarioCreate(InventarioBase):
    pass  # Puedes agregar validaciones adicionales si es necesario

class Inventario(InventarioBase):
    id: int

    class Config:
        orm_mode = True  # Permite que Pydantic use ORM para mapear la respuesta