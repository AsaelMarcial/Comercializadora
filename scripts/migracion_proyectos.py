"""Script de migración para mover datos de clientes.proyecto a la nueva tabla proyectos."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR / "backend"))

from app.database import SessionLocal, engine  # noqa: E402
from app.models import Cliente, Proyecto  # noqa: E402


def migrar_proyectos(drop_column: bool = True) -> None:
    """Migrar los proyectos existentes a la tabla proyectos y opcionalmente eliminar la columna antigua."""
    Proyecto.__table__.create(bind=engine, checkfirst=True)

    session: Session = SessionLocal()
    try:
        clientes = session.query(Cliente).all()
        for cliente in clientes:
            nombre_proyecto = getattr(cliente, "proyecto", None)
            if not nombre_proyecto:
                continue

            existe = (
                session.query(Proyecto)
                .filter(Proyecto.cliente_id == cliente.id, Proyecto.nombre == nombre_proyecto)
                .first()
            )
            if existe:
                continue

            session.add(
                Proyecto(
                    nombre=nombre_proyecto,
                    descripcion=None,
                    cliente_id=cliente.id,
                )
            )
        session.commit()
    finally:
        session.close()

    if drop_column:
        inspector = inspect(engine)
        columnas = [columna["name"] for columna in inspector.get_columns("clientes")]
        if "proyecto" in columnas:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE clientes DROP COLUMN proyecto"))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Migra los proyectos existentes a la nueva tabla y elimina la columna antigua si se requiere."
    )
    parser.add_argument(
        "--skip-drop",
        action="store_true",
        help="No elimina la columna 'proyecto' después de migrar los datos.",
    )
    args = parser.parse_args()
    migrar_proyectos(drop_column=not args.skip_drop)


if __name__ == "__main__":
    main()
