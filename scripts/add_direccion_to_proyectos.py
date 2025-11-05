"""Agregar la columna direccion a la tabla proyectos y sincronizar datos existentes."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR / "backend"))

from app.database import SessionLocal, engine  # noqa: E402
from app.models import Cotizacion, Proyecto  # noqa: E402


def ensure_direccion_column() -> None:
    inspector = inspect(engine)
    columnas = {columna["name"] for columna in inspector.get_columns("proyectos")}
    if "direccion" in columnas:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE proyectos ADD COLUMN direccion VARCHAR(255)"))


def sync_direccion_data() -> None:
    session: Session = SessionLocal()
    try:
        proyectos = session.query(Proyecto).all()
        for proyecto in proyectos:
            if proyecto.direccion:
                continue

            cotizacion = (
                session.query(Cotizacion)
                .filter(Cotizacion.proyecto_id == proyecto.id)
                .filter(Cotizacion.proyecto_direccion.isnot(None))
                .filter(Cotizacion.proyecto_direccion != "")
                .order_by(Cotizacion.fecha.desc())
                .first()
            )
            if cotizacion:
                proyecto.direccion = cotizacion.proyecto_direccion
        session.commit()
    finally:
        session.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Asegura que la columna direccion exista en proyectos y sincroniza sus datos."
    )
    parser.parse_args()

    ensure_direccion_column()
    sync_direccion_data()


if __name__ == "__main__":
    main()
