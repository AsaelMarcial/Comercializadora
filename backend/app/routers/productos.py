from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ProductoCreate, Producto
from app.cruds.crud_productos import CRUDProducto
from app.auth import get_current_user
import os
from PIL import Image
import io

router = APIRouter()

@router.post(
    "/productos",
    response_model=Producto,
    tags=["Productos"],
    summary="Crear un nuevo producto"
)
def create_producto(
    producto: ProductoCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    crud_producto = CRUDProducto(db)
    try:
        nuevo_producto = crud_producto.crear_producto(producto)
        print(f"Producto creado con éxito: {nuevo_producto}")
        return nuevo_producto
    except Exception as e:
        print(f"Error en crear_producto: {e}")
        raise HTTPException(status_code=500, detail=f"Error al crear el producto: {str(e)}")

@router.get("/productos/{producto_id}", response_model=Producto)
def read_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    crud_producto = CRUDProducto(db)
    return crud_producto.obtener_producto(producto_id)

@router.get("/productos", response_model=list[Producto])
def read_productos(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    crud_producto = CRUDProducto(db)
    return crud_producto.obtener_productos()

@router.get("/productos-publicos", response_model=list[Producto])
def read_productos_publicos(
    db: Session = Depends(get_db),
):
    crud_producto = CRUDProducto(db)
    return crud_producto.obtener_productos()

@router.put("/productos/{producto_id}", response_model=Producto)
def update_producto(
    producto_id: int,
    producto: ProductoCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    crud_producto = CRUDProducto(db)
    usuario_id = current_user["id"]
    return crud_producto.actualizar_producto(producto_id, producto, usuario_id)

@router.delete("/productos/{producto_id}", response_model=Producto)
def delete_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    crud_producto = CRUDProducto(db)
    try:
        producto_eliminado = crud_producto.eliminar_producto(producto_id)
        return producto_eliminado
    except Exception as e:
        print(f"Error en delete_producto: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al eliminar el producto: {str(e)}"
        )

@router.post("/productos/{producto_id}/upload-imagen")
async def upload_producto_imagen(
    producto_id: int,
    imagen: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Validar archivo recibido
        ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
        file_extension = imagen.filename.split(".")[-1].lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Formato de archivo no permitido.")

        # Procesar la imagen y convertirla a JPEG
        UPLOAD_DIR = "uploads"
        file_name = f"producto_{producto_id}.jpeg"  # Forzamos la extensión JPEG
        file_path = os.path.join(UPLOAD_DIR, file_name)

        image = Image.open(io.BytesIO(await imagen.read()))
        image = image.convert("RGB")  # Convertir a RGB para garantizar compatibilidad con JPEG
        image.save(file_path, "JPEG", quality=85)

        # Actualizar URL de la imagen en la base de datos
        imagen_url = f"/uploads/{file_name}"
        crud_producto = CRUDProducto(db)
        producto_actualizado = crud_producto.actualizar_imagen_producto(producto_id, imagen_url)

        return {
            "producto_id": producto_id,
            "imagen_url": imagen_url,
            "message": "Imagen subida y actualizada correctamente.",
        }

    except Exception as e:
        print(f"Error al procesar la imagen: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar la imagen."
        )
