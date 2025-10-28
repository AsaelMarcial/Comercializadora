import os
import logging
from weasyprint import HTML
from jinja2 import Environment, FileSystemLoader, TemplateNotFound
from babel.numbers import format_decimal

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "../templates")
IMAGE_BASE_URL = "http://147.93.47.106:8000/uploads"


def format_number(value):
    try:
        return format_decimal(value, format="#,##0.##", locale="en_US")
    except Exception as exc:
        logger.error(f"Error al formatear número en nota de remisión: {exc}")
        return f"{float(value):.2f}" if value is not None else "0"


env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
env.filters['format_number'] = format_number


def generate_nota_remision_pdf(remision_data):
    """Genera un PDF con la información para la nota de remisión."""
    logger.info("Generando nota de remisión con datos: %s", remision_data)

    required_keys = [
        "id",
        "fecha",
        "cliente_nombre",
        "cliente_proyecto",
        "cliente_direccion",
        "productos",
    ]
    missing = [key for key in required_keys if key not in remision_data]
    if missing:
        logger.error("Faltan campos requeridos para la nota de remisión: %s", ", ".join(missing))
        raise ValueError(f"Faltan los campos requeridos: {', '.join(missing)}")

    for producto in remision_data["productos"]:
        producto_id = producto.get("producto_id")
        if producto_id:
            producto["imagen_url"] = f"{IMAGE_BASE_URL}/producto_{producto_id}.jpeg"
        else:
            producto["imagen_url"] = f"{IMAGE_BASE_URL}/default-image.jpeg"

    try:
        template = env.get_template("nota_remision_template.html")
        logger.info("Plantilla de nota de remisión cargada correctamente.")
    except TemplateNotFound as exc:
        logger.error("Plantilla de nota de remisión no encontrada: %s", exc)
        raise FileNotFoundError(f"Plantilla no encontrada: {exc}") from exc
    except Exception as exc:  # noqa: BLE001 - logging detallado
        logger.error("Error al cargar la plantilla de nota de remisión: %s", exc)
        raise RuntimeError(f"Error al cargar la plantilla: {exc}") from exc

    try:
        rendered_html = template.render(
            remision={
                "id": remision_data["id"],
                "fecha": remision_data["fecha"],
            },
            nombre=remision_data.get("cliente_nombre", "N/A"),
            proyecto=remision_data.get("cliente_proyecto", "N/A"),
            direccion=remision_data.get("cliente_direccion", "N/A"),
            productos=remision_data["productos"],
        )
        logger.info("HTML de nota de remisión renderizado correctamente para ID %s", remision_data["id"])
    except Exception as exc:  # noqa: BLE001
        logger.error("Error al renderizar la nota de remisión: %s", exc)
        raise ValueError(f"Error al renderizar la plantilla: {exc}") from exc

    try:
        pdf_file = HTML(string=rendered_html).write_pdf()
        logger.info("PDF de nota de remisión generado exitosamente para ID %s", remision_data["id"])
        return pdf_file
    except Exception as exc:  # noqa: BLE001
        logger.error("Error al generar el PDF de la nota de remisión: %s", exc)
        raise RuntimeError(f"Error al generar el PDF: {exc}") from exc
