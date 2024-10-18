# backend/app/routers/usuarios.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UsuarioCreate, Usuario
from app.auth import create_access_token, verify_password
from app.models import Usuario as UsuarioModel

router = APIRouter()

@router.post("/login")
def login(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    user = db.query(UsuarioModel).filter(UsuarioModel.email == usuario.email).first()
    if not user or not verify_password(usuario.password, user.password):  # Asumiendo que tienes un campo de contraseña
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/usuarios", response_model=Usuario)
def create_user(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    # Verificar si el usuario ya existe
    existing_user = db.query(UsuarioModel).filter(UsuarioModel.email == usuario.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")

    # Hash de la contraseña
    usuario.password = get_password_hash(usuario.password)

    # Crear el usuario
    db_usuario = UsuarioModel(**usuario.dict())
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario