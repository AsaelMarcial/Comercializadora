# backend/app/__init__.py

from fastapi import FastAPI
from .routers import productos, usuarios, inventario
from app.database import engine, Base

# Crear las tablas en la base de datos si no existen
Base.metadata.create_all(bind=engine)

# Crear una instancia de FastAPI
app = FastAPI(title="API Comercializadora", version="1.0.0")

# Registrar los routers (endpoints)
app.include_router(productos.router)
app.include_router(usuarios.router)
app.include_router(inventario.router)

# Ruta principal de prueba
@app.get("/")
def root():
    return {"message": "Bienvenido a la API de Comercializadora"}
