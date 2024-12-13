# backend/app/auth.py
import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from typing import Optional
from enum import Enum  # Importar Enum
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario as UsuarioModel

# Cargar variables de entorno
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "supersecreto")  # Asegúrate de tener SECRET_KEY en tu archivo .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

# Contexto de encriptación
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Roles de usuario
class Role(str, Enum):  # Definir la clase Role
    ADMIN = "ADMIN"
    VENDEDOR = "VENDEDOR"
    MODIFICADOR = "MODIFICADOR"


# Configuración de OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def verify_password(plain_password, hashed_password):
    """Verifica que la contraseña en texto plano coincida con la contraseña hasheada."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """Genera un hash para la contraseña dada."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un token de acceso codificado en JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    # Crear el token JWT con los datos necesarios (nombre, email, rol)
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verifica el token JWT y devuelve el payload."""
    credentials_exception = HTTPException(
        status_code=401,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        rol: str = payload.get("rol")
        if email is None or rol is None:
            raise credentials_exception
        return {"email": email, "rol": rol}
    except JWTError:
        raise credentials_exception


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Obtiene el usuario actual a partir del token JWT."""
    payload = verify_token(token)
    user_email = payload.get("sub")  # Extrae el email del payload
    if user_email is None:
        raise HTTPException(status_code=401, detail="No se pudo validar las credenciales")

    # Busca al usuario en la base de datos
    user = db.query(UsuarioModel).filter(UsuarioModel.email == user_email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return user  # Devuelve el usuario actual
