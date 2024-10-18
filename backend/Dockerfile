# Dockerfile para Backend

FROM python:3.9-slim

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los requerimientos desde la carpeta backend al contenedor
COPY requirements.txt /app/requirements.txt

# Instalar las dependencias
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copiar el código fuente del backend
COPY app /app/app

# Comando para ejecutar la aplicación con Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
