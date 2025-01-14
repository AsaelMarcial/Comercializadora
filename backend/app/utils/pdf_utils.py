from weasyprint import HTML
from jinja2 import Environment, FileSystemLoader
import os

# Ruta de la plantilla HTML
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "../templates")

def generate_pdf(cotizacion_data):
    """
    Genera un PDF basado en la plantilla HTML y los datos de la cotización.
    :param cotizacion_data: Diccionario con los datos de la cotización.
    :return: Archivo PDF generado.
    """
    # Configurar el entorno de plantillas
    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
    template = env.get_template("cotizacion_template.html")

    # Datos a renderizar en la plantilla
    rendered_html = template.render(
        cotizacion={
            "id": cotizacion_data["id"],
            "fecha": cotizacion_data["fecha"],
            "cliente": cotizacion_data["cliente"],
        },
        productos=cotizacion_data["productos"],  # Lista de productos
        subtotal=cotizacion_data["subtotal"],
        iva=cotizacion_data["iva"],
        total=cotizacion_data["total"],
    )

    # Crear el PDF a partir del HTML renderizado
    pdf_file = HTML(string=rendered_html).write_pdf()

    return pdf_file
