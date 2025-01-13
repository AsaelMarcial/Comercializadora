from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UsuarioCreate, Usuario, UsuarioResponse, LoginSchema
from app.auth import create_access_token, verify_password, get_current_user, Role
from app.models import Usuario as UsuarioModel
from app.cruds.crud_usuarios import CRUDUsuario  # Importación del CRUD
from app.auth import get_password_hash
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Inicializamos CRUD sin conexión, la sesión se asignará en los endpoints
crud_usuario = CRUDUsuario(db=None)

@router.post("/public/usuarios", response_model=Usuario, summary="Crear un usuario públicamente")
def public_create_user(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    """
    Endpoint público para crear un usuario sin autenticación.
    """
    crud_usuario.db = db  # Asignar la sesión

    # Verificar si el usuario ya existe
    usuario_existente = db.query(UsuarioModel).filter(UsuarioModel.email == usuario.email).first()
    if usuario_existente:
        raise HTTPException(status_code=400, detail="El usuario ya existe")

    # Crear el usuario con la contraseña hasheada
    nuevo_usuario = UsuarioModel(
        nombre=usuario.nombre,
        email=usuario.email,
        password_hash=get_password_hash(usuario.password),  # Hashea la contraseña correctamente
        rol=usuario.rol
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return nuevo_usuario

### LOGIN ###
@router.post("/login", summary="Iniciar sesión y obtener un token")
def login(credentials: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(UsuarioModel).filter(UsuarioModel.email == credentials.email).first()

    if not user:
        logger.error("Usuario no encontrado")
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    logger.info(f"Usuario encontrado: {user.email}")

    if not verify_password(credentials.password, user.password_hash):
        logger.error("Credenciales inválidas")
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    access_token = create_access_token(data={"sub": user.email, "rol": user.rol, "id": user.id})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": {
            "id": user.id,
            "email": user.email,
            "nombre": user.nombre,
            "rol": user.rol
        }
    }

### ENDPOINTS PARA USUARIOS ###
@router.post("/usuarios", response_model=Usuario, tags=["Usuarios"], summary="Crear un nuevo usuario")
def create_user(usuario: UsuarioCreate, db: Session = Depends(get_db),
                current_user: Usuario = Depends(get_current_user)):
    crud_usuario.db = db

    if current_user.rol != Role.ADMIN:
        raise HTTPException(status_code=403, detail="No tienes permiso para realizar esta acción")

    return crud_usuario.crear_usuario(usuario)


@router.get("/usuarios", response_model=list[Usuario], tags=["Usuarios"], summary="Obtener todos los usuarios")
def read_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db),
               current_user: Usuario = Depends(get_current_user)):
    crud_usuario.db = db

    if current_user.rol != Role.ADMIN:
        raise HTTPException(status_code=403, detail="No tienes permiso para realizar esta acción")

    return crud_usuario.obtener_usuarios(skip=skip, limit=limit)


@router.get("/public/usuarios", response_model=list[UsuarioResponse], summary="Obtener usuarios públicos")
def read_public_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    crud_usuario.db = db
    return crud_usuario.obtener_usuarios(skip=skip, limit=limit)


@router.get("/usuarios/{usuario_id}", response_model=Usuario, tags=["Usuarios"], summary="Obtener un usuario por ID")
def read_user(usuario_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    crud_usuario.db = db
    return crud_usuario.obtener_usuario(usuario_id)


@router.put("/usuarios/{usuario_id}", response_model=Usuario, tags=["Usuarios"], summary="Actualizar un usuario")
def update_user(usuario_id: int, usuario: UsuarioCreate, db: Session = Depends(get_db),
                current_user: Usuario = Depends(get_current_user)):
    crud_usuario.db = db

    if current_user.rol != Role.ADMIN:
        raise HTTPException(status_code=403, detail="No tienes permiso para realizar esta acción")

    return crud_usuario.actualizar_usuario(usuario_id, usuario)


@router.delete("/usuarios/{usuario_id}", response_model=Usuario, tags=["Usuarios"], summary="Eliminar un usuario")
def delete_user(usuario_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    crud_usuario.db = db

    if current_user.rol != Role.ADMIN:
        raise HTTPException(status_code=403, detail="No tienes permiso para realizar esta acción")

    return crud_usuario.eliminar_usuario(usuario_id)
