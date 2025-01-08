# backend/app/routers/productos.py

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ProductoCreate, Producto
from app.cruds.crud_productos import CRUDProducto  # Nuevo import desde cruds
from app.auth import oauth2_scheme, get_current_user  # Obtener usuario actual
from fastapi import FastAPI, File, UploadFile, HTTPException
import os
import aiofiles

router = APIRouter()
crud_producto = CRUDProducto(db=None)  # Inicializamos sin conexión

@router.post(
    "/productos",
    response_model=Producto,
    tags=["Productos"],
    summary="Crear un nuevo producto"
)
def create_producto(
        producto: ProductoCreate,
        db: Session = Depends(get_db)  # Declaración explícita del esquema por usuario actual
):
    crud_producto.db = db
    return crud_producto.crear_producto(producto)

@router.get("/productos/{producto_id}", response_model=Producto)
def read_producto(producto_id: int, db: Session = Depends(get_db)):
    crud_producto.db = db
    return crud_producto.obtener_producto(producto_id)

@router.get("/productos", response_model=list[Producto])
def read_productos(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    crud_producto.db = db
    return crud_producto.obtener_productos(skip=skip, limit=limit)

@router.put("/productos/{producto_id}", response_model=Producto)
def update_producto(producto_id: int, producto: ProductoCreate, db: Session = Depends(get_db),
                    current_user: dict = Depends(get_current_user)):
    if current_user['rol'] not in ["Admin", "Modificador"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")

    crud_producto.db = db
    return crud_producto.actualizar_producto(producto_id, producto)

@router.delete("/productos/{producto_id}", response_model=Producto)
def delete_producto(producto_id: int, db: Session = Depends(get_db),
                    current_user: dict = Depends(get_current_user)):
    if current_user['rol'] != "Admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")

    crud_producto.db = db
    return crud_producto.eliminar_producto(producto_id)

@router.post("/productos/{producto_id}/upload-imagen")
async def upload_producto_imagen(
        producto_id: int,
        imagen: UploadFile = File(...),
        db: Session = Depends(get_db),
):
    # 1. Validar permisos del usuario
    #if current_user['rol'] not in ["Admin", "Modificador"]:
    #    raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")

    # 2. Buscar el producto en la base de datos
    crud_producto.db = db
    producto = crud_producto.obtener_producto(producto_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")

    # 3. Validar el archivo recibido: extensión permitida
    ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
    file_extension = imagen.filename.split(".")[-1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Formato de archivo no permitido.")

    # 4. Crear la ruta única para guardar la imagen (en la carpeta uploads)
    UPLOAD_DIR = "uploads"
    file_name = f"producto_{producto_id}.{file_extension}"  # Nombre único basado en ID del producto
    file_path = os.path.join(UPLOAD_DIR, file_name)

    # 5. Guardar el archivo físicamente (asincrónicamente)
    async with aiofiles.open(file_path, "wb") as out_file:
        content = await imagen.read()  # Leer el contenido del archivo
        await out_file.write(content)  # Guardarlo en la carpeta uploads

    # 6. Crear la URL relativa para registrar en la base de datos
    imagen_url = f"/uploads/{file_name}"  # Esta será usada en el campo 'imagen_url'

    # 7. Actualizar la base de datos del producto con la nueva URL
    producto_actualizado = crud_producto.actualizar_imagen_producto(producto_id, imagen_url)

    # 8. Retornar la información actualizada del producto
    return {
        "producto_id": producto_id,
        "imagen_url": imagen_url,
        "message": "Imagen subida y actualizada correctamente.",
    }

