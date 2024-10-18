from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# Cambia las credenciales según tu configuración local
DATABASE_URL = "mysql+mysqlconnector://root:Hvzrrs04@host.docker.internal:3306/comercializadora"

# Crear el motor de la base de datos
engine = create_engine(DATABASE_URL)

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
