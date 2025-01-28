from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi.openapi.utils import get_openapi
from sqlalchemy.exc import SQLAlchemyError
from app.database import engine, Base
from app.routers import productos, usuarios, inventario, cotizaciones, proveedores, clientes
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.models import Usuario as UsuarioModel
from sqlalchemy.orm import Session

# Crear las tablas en la base de datos si no existen
Base.metadata.create_all(bind=engine)

# Crear instancia de FastAPI
app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todas las solicitudes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Esquema de autenticación con OAuth2 para JWT
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Personalizar OpenAPI para aplicar seguridad globalmente
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="Comercializadora API",
        version="1.0.0",
        description="API para gestionar productos, usuarios e inventarios.",
        routes=app.routes,
    )

    # Declarar el esquema de autenticación con JWT
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }

    # Aplicar seguridad global a todos los endpoints
    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            operation = openapi_schema["paths"][path][method]
            # Añade "security" solo si falta
            operation.setdefault("security", [{"BearerAuth": []}])

    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Asignar la función personalizada de OpenAPI
app.openapi = custom_openapi

# Incluir los routers de productos, usuarios e inventarios
app.include_router(productos.router, tags=["Productos"])
app.include_router(usuarios.router, tags=["Usuarios"])
app.include_router(inventario.router, tags=["Inventario"])
app.include_router(cotizaciones.router, tags=["Cotizaciones"])
app.include_router(proveedores.router, tags=["Proveedores"])
app.include_router(clientes.router, tags=["Clientes"])

# Ruta principal de prueba
@app.get("/", summary="Ruta de prueba")
def root():
    """
    Esta es la ruta principal de la API. Devuelve un mensaje de bienvenida.
    """
    return {"message": "Bienvenido a la API de Comercializadora"}

# Middleware para manejo global de errores
@app.middleware("http")
async def custom_error_handler(request: Request, call_next):
    try:
        return await call_next(request)
    except HTTPException as ex:
        return JSONResponse(status_code=ex.status_code, content={"detail": ex.detail})
    except SQLAlchemyError as db_ex:
        return JSONResponse(
            status_code=500, content={"detail": "Error de base de datos."}
        )
    except Exception as ex:
        return JSONResponse(
            status_code=500, content={"detail": "Error inesperado. Contacta soporte."}
        )
