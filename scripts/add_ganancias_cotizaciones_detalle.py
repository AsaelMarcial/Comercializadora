"""Agrega columnas de ganancia a cotizaciones_detalle y permite backfill opcional.

Las columnas nuevas se crean permitiendo NULL para evitar interrumpir datos
existentes. El backfill utiliza el costo_base y los precios guardados para
estimar los márgenes cuando es posible, pero los valores pueden ser
aproximados y deben revisarse manualmente.
"""

from __future__ import annotations

import argparse
import logging
from decimal import Decimal
from pathlib import Path
import sys

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR / "backend"))

from app.database import SessionLocal, engine  # noqa: E402
from app.models import CotizacionDetalle  # noqa: E402


logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


NUEVAS_COLUMNAS = {
    "ganancia_porcentaje": "DECIMAL(5,2)",
    "ganancia_monto": "DECIMAL(20,2)",
    "costo_base": "DECIMAL(20,2)",
    "ganancia_estimada": "BOOLEAN",
}


def agregar_columnas() -> None:
    """Crea las columnas faltantes permitiendo valores NULL."""

    inspector = inspect(engine)
    existentes = {columna["name"] for columna in inspector.get_columns("cotizaciones_detalle")}

    with engine.begin() as connection:
        for nombre, tipo in NUEVAS_COLUMNAS.items():
            if nombre in existentes:
                logger.info("La columna %s ya existe; se omite su creación", nombre)
                continue
            logger.info("Agregando columna %s", nombre)
            connection.execute(
                text(
                    f"ALTER TABLE cotizaciones_detalle ADD COLUMN {nombre} {tipo} NULL"
                )
            )


def backfill_ganancias() -> None:
    """Calcula márgenes usando costo_base cuando no hay datos.

    Los resultados son estimaciones basadas en los importes almacenados y
    podrían diferir de los valores reales que tuvo la venta original.
    """

    session: Session = SessionLocal()
    try:
        detalles = (
            session.query(CotizacionDetalle)
            .filter(
                CotizacionDetalle.costo_base.isnot(None),
                CotizacionDetalle.ganancia_monto.is_(None),
            )
            .all()
        )

        if not detalles:
            logger.info("No hay filas pendientes de backfill.")
            return

        logger.info("Procesando %s filas para estimar márgenes", len(detalles))
        for detalle in detalles:
            try:
                costo_base = Decimal(detalle.costo_base)
                precio_unitario = Decimal(detalle.precio_unitario)
                cantidad = Decimal(detalle.cantidad)

                ganancia_unitaria = precio_unitario - costo_base
                detalle.ganancia_monto = ganancia_unitaria * cantidad

                if costo_base != 0:
                    detalle.ganancia_porcentaje = ganancia_unitaria / costo_base * Decimal("100")

                detalle.ganancia_estimada = True
            except Exception as exc:  # pragma: no cover - logging informativo
                logger.warning(
                    "No se pudo estimar la ganancia para el detalle %s: %s",
                    detalle.id,
                    exc,
                )

        session.commit()
        logger.info(
            "Backfill completado. Revisa las ganancias marcadas como estimadas; pueden ser inexactas."
        )
    finally:
        session.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Agrega columnas de ganancia a cotizaciones_detalle y ejecuta opcionalmente un backfill."
        )
    )
    parser.add_argument(
        "--backfill",
        action="store_true",
        help="Estima ganancia_porcentaje y ganancia_monto usando costo_base cuando sea posible.",
    )
    args = parser.parse_args()

    agregar_columnas()

    if args.backfill:
        backfill_ganancias()
    else:
        logger.info("Backfill omitido; ejecute con --backfill para estimar márgenes.")


if __name__ == "__main__":
    main()
