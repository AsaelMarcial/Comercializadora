from fastapi import FastAPI
from .routers import productos, usuarios, inventario, proveedores, clientes, proyectos
from app.database import engine, Base
from fastapi.middleware.cors import CORSMiddleware

# Crear una instancia de FastAPI
app = FastAPI(title="API Comercializadora", version="1.0.0")

origins = [
    "http://localhost:3000",
    "https://localhost:3000",
    "http://172.18.0.2:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Permitir el acceso desde estos orígenes
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos
    allow_headers=["*"],  # Permitir todos los encabezados
)

# Registrar los routers (endpoints)
app.include_router(productos.router)
app.include_router(usuarios.router)
app.include_router(inventario.router)
app.include_router(proveedores.router)
app.include_router(clientes.router)
app.include_router(proyectos.router)


# Ruta principal de prueba
@app.get("/")
def root():
    return {"message": "Bienvenido a la API de Comercializadora"}