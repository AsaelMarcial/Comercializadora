import os
import logging
from weasyprint import HTML
from jinja2 import Environment, FileSystemLoader, TemplateNotFound
from babel.numbers import format_decimal  # Importar Babel para el formato de números

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Ruta de la plantilla HTML
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "../templates")
IMAGE_BASE_URL = "http://147.93.47.106:8000/uploads"  # Base URL para las imágenes


def format_number(value):
    try:
        return format_decimal(value, format="#,##0.00", locale="en_US")  # Siempre 2 decimales
    except Exception as e:
        logger.error(f"Error al formatear número: {e}")
        return f"{value:.2f}"  # Fallback a 2 decimales en caso de error



# Configurar el entorno de plantillas
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
env.filters['format_number'] = format_number  # Registrar el filtro personalizado


def generate_pdf(cotizacion_data):
    """
    Genera un PDF basado en la plantilla HTML y los datos de la cotización.
    :param cotizacion_data: Diccionario con los datos de la cotización.
    :return: Archivo PDF generado.
    """
    # Validar datos requeridos
    logger.info(f"Datos recibidos en generate_pdf: {cotizacion_data}")

    required_keys = ["id", "fecha", "cliente_nombre", "cliente_proyecto", "cliente_direccion", "productos", "total"]
    missing_keys = [key for key in required_keys if key not in cotizacion_data]
    if missing_keys:
        logger.error(f"Faltan los campos requeridos: {', '.join(missing_keys)}")
        raise ValueError(f"Faltan los campos requeridos: {', '.join(missing_keys)}")

    # Generar URLs para las imágenes de los productos
    for producto in cotizacion_data["productos"]:
        producto_id = producto.get("producto_id")
        if producto_id:
            producto["imagen_url"] = f"{IMAGE_BASE_URL}/producto_{producto_id}.jpeg"
        else:
            # Asigna una imagen predeterminada si no hay producto_id
            producto["imagen_url"] = f"{IMAGE_BASE_URL}/default-image.jpeg"

    try:
        # Cargar la plantilla
        template = env.get_template("cotizacion_template.html")
        logger.info("Plantilla cargada correctamente.")
    except TemplateNotFound as e:
        logger.error(f"Plantilla no encontrada: {e}")
        raise FileNotFoundError(f"Plantilla no encontrada: {e}")
    except Exception as e:
        logger.error(f"Error al cargar la plantilla: {e}")
        raise RuntimeError(f"Error al cargar la plantilla: {e}")

    try:
        # Asegurar que los datos del cliente están completos
        cliente_render = {
            "nombre": cotizacion_data.get("cliente_nombre", "N/A"),
            "proyecto": cotizacion_data.get("cliente_proyecto", "N/A"),
            "direccion": cotizacion_data.get("cliente_direccion", "N/A")
        }

        logger.info(f"Datos que se renderizan en el PDF: {cliente_render}")
        # Renderizar el HTML con los datos
        rendered_html = template.render(
            cotizacion={
                "id": cotizacion_data["id"],
                "fecha": cotizacion_data["fecha"],
            },
            nombre=cotizacion_data.get("cliente_nombre", "N/A"),
            proyecto=cotizacion_data.get("cliente_proyecto", "N/A"),
            direccion=cotizacion_data.get("cliente_direccion", "N/A"),
            productos=cotizacion_data["productos"],  # Lista de productos
            total=cotizacion_data["total"],
            costo_envio=float(cotizacion_data.get("costo_envio", 0)),  # Asegura que costo_envio sea un número
            variante_envio=cotizacion_data.get("variante_envio", "N/A"),
        )
        logger.info(f"Plantilla renderizada correctamente para la cotización ID {cotizacion_data['id']}.")
    except Exception as e:
        logger.error(f"Error al renderizar la plantilla: {e}")
        raise ValueError(f"Error al renderizar la plantilla: {e}")

    try:
        # Crear el PDF a partir del HTML renderizado
        pdf_file = HTML(string=rendered_html).write_pdf()
        logger.info(f"PDF generado exitosamente para la cotización ID {cotizacion_data['id']}.")
        return pdf_file
    except Exception as e:
        logger.error(f"Error al generar el PDF: {e}")
        raise RuntimeError(f"Error al generar el PDF: {e}")
