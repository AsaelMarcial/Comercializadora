"""Application-wide logging configuration utilities."""
from __future__ import annotations

import logging
import logging.config
import logging.handlers
import os
from pathlib import Path


def setup_logging() -> None:
    """Configure logging to output to stdout and a rotating file.

    The configuration respects ``LOG_LEVEL`` and ``LOG_DIR`` environment
    variables, defaulting to ``INFO`` and ``app/logs`` respectively. The
    setup is idempotent, so calling it multiple times keeps the existing
    configuration.
    """
    if getattr(setup_logging, "_is_configured", False):  # type: ignore[attr-defined]
        return

    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    log_directory = Path(
        os.getenv("LOG_DIR", Path(__file__).resolve().parent / "logs")
    )
    log_directory.mkdir(parents=True, exist_ok=True)
    log_file = log_directory / "app.log"

    logging.captureWarnings(True)

    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": log_level,
                "formatter": "standard",
                "stream": "ext://sys.stdout",
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": log_level,
                "formatter": "standard",
                "filename": str(log_file),
                "maxBytes": 5 * 1024 * 1024,
                "backupCount": 5,
                "encoding": "utf-8",
            },
        },
        "loggers": {
            "app": {
                "level": log_level,
                "handlers": ["console", "file"],
                "propagate": False,
            },
            "uvicorn": {
                "level": log_level,
                "handlers": ["console", "file"],
                "propagate": False,
            },
            "uvicorn.error": {
                "level": log_level,
                "handlers": ["console", "file"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": log_level,
                "handlers": ["console", "file"],
                "propagate": False,
            },
        },
        "root": {
            "level": log_level,
            "handlers": ["console", "file"],
        },
    }

    logging.config.dictConfig(logging_config)
    setup_logging._is_configured = True  # type: ignore[attr-defined]
