from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Cambia la ruta al archivo SQLite según tu preferencia.
# Si no existe el archivo, SQLite lo creará automáticamente.
DATABASE_URL = "sqlite:///./comercializadora.db"

# Crear el motor de la base de datos
# `connect_args` se usa para configurar SQLite en modo de solo archivos.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Crear una sesión para las operaciones con la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para definir los modelos
Base = declarative_base()

# Dependencia para obtener la sesión de la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
