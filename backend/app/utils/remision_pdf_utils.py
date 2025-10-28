import os
import logging
import logging.handlers
from pathlib import Path
from weasyprint import HTML
from jinja2 import Environment, FileSystemLoader, TemplateNotFound
from babel.numbers import format_decimal



def _configure_logger(name: str) -> logging.Logger:
    """Return a logger configured to write directly into app.log."""

    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    log_directory = Path(
        os.getenv("LOG_DIR", Path(__file__).resolve().parents[1] / "logs")
    )
    log_directory.mkdir(parents=True, exist_ok=True)
    log_file = log_directory / "app.log"

    has_rotating_handler = any(
        isinstance(handler, logging.handlers.RotatingFileHandler)
        and Path(getattr(handler, "baseFilename", "")) == log_file
        for handler in logger.handlers
    )

    if not has_rotating_handler:
        rotating_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=5 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8",
        )
        rotating_handler.setFormatter(
            logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
        )
        logger.addHandler(rotating_handler)

    logger.propagate = False
    return logger


logger = _configure_logger("app.pdf.remision")

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "../templates")
IMAGE_BASE_URL = "http://147.93.47.106:8000/uploads"


def format_number(value):
    try:
        return format_decimal(value, format="#,##0.##", locale="en_US")
    except Exception as exc:
        logger.exception("Error al formatear número en nota de remisión: %s", exc)
        return f"{float(value):.2f}" if value is not None else "0"


env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
env.filters['format_number'] = format_number


def generate_nota_remision_pdf(remision_data):
    """Genera un PDF con la información para la nota de remisión."""
    logger.info(
        "Iniciando generación de nota de remisión para la cotización %s",
        remision_data.get("id"),
    )
    logger.debug("Datos recibidos para nota de remisión: %s", remision_data)

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
        logger.error(
            "Faltan campos requeridos para la nota de remisión: %s", ", ".join(missing)
        )
        raise ValueError(f"Faltan los campos requeridos: {', '.join(missing)}")

    logger.info(
        "Preparando %s productos para la nota de remisión %s",
        len(remision_data["productos"]),
        remision_data["id"],
    )

    for producto in remision_data["productos"]:
        producto_id = producto.get("producto_id")
        if producto_id:
            producto["imagen_url"] = f"{IMAGE_BASE_URL}/producto_{producto_id}.jpeg"
        else:
            producto["imagen_url"] = f"{IMAGE_BASE_URL}/default-image.jpeg"

    try:
        template = env.get_template("nota_remision_template.html")
        logger.info(
            "Plantilla 'nota_remision_template.html' cargada correctamente desde %s",
            TEMPLATE_DIR,
        )
    except TemplateNotFound as exc:
        logger.exception("Plantilla de nota de remisión no encontrada: %s", exc)
        raise FileNotFoundError(f"Plantilla no encontrada: {exc}") from exc
    except Exception as exc:  # noqa: BLE001 - logging detallado
        logger.exception("Error al cargar la plantilla de nota de remisión: %s", exc)
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
        logger.info(
            "HTML de nota de remisión renderizado correctamente para ID %s",
            remision_data["id"],
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Error al renderizar la nota de remisión: %s", exc)
        raise ValueError(f"Error al renderizar la plantilla: {exc}") from exc

    try:
        pdf_file = HTML(string=rendered_html).write_pdf()
        logger.info("PDF de nota de remisión generado exitosamente para ID %s", remision_data["id"])
        return pdf_file
    except Exception as exc:  # noqa: BLE001
        logger.exception("Error al generar el PDF de la nota de remisión: %s", exc)
        raise RuntimeError(f"Error al generar el PDF: {exc}") from exc
