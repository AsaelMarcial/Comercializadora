from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from fastapi import HTTPException

# Cambia las credenciales según tu configuración local
DATABASE_URL = "mysql+mysqlconnector://root:Hvzrrs04@host.docker.internal:3306/comercializadora"

# Crear el motor de la base de datos con configuración avanzada
engine = create_engine(
    DATABASE_URL,
    pool_size=10,  # Tamaño del pool de conexiones
    max_overflow=20,  # Conexiones adicionales permitidas
    pool_pre_ping=True,  # Verifica conexiones antes de usarlas
    pool_recycle=1800,  # Recicla conexiones inactivas después de 30 minutos
    echo=False,  # Cambiar a True para depuración
)

# Crear una sesión para las operaciones con la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para definir los modelos
Base = declarative_base()

def get_db():
    """
    Generador para obtener una sesión de la base de datos.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()  # Deshacer los cambios si ocurre un error
        raise HTTPException(status_code=500, detail=f"Error en la sesion: {str(e)}")
    finally:
        db.close()  # Siempre cerrar la sesión
