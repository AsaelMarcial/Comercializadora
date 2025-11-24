import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import '../css/CotizacionDetailsModal.css';
import { getProductById } from '../data-access/productsDataAccess';

const CotizacionDetailsModal = ({
    cotizacion,
    isShowing,
    onClose,
    onCancelCotizacion,
    onDownloadCotizacion,
    onDownloadRemision,
    onEditCotizacion,
}) => {
    const [productosDetalles, setProductosDetalles] = useState([]);
    const closeButtonRef = useRef(null);
    const primaryActionRef = useRef(null);

    useEffect(() => {
        const fetchProductosDetalles = async () => {
            const productos = await Promise.all(
                cotizacion.detalles.map(async (detalle) => {
                    try {
                        const producto = await getProductById(detalle.producto_id);
                        return { ...detalle, nombre: producto.nombre };
                    } catch (error) {
                        console.error(
                            `Error al obtener el producto con ID ${detalle.producto_id}:`,
                            error
                        );
                        return { ...detalle, nombre: 'Nombre no disponible' };
                    }
                })
            );
            setProductosDetalles(productos);
        };

        if (cotizacion && cotizacion.detalles) {
            fetchProductosDetalles();
        }
    }, [cotizacion]);

    useEffect(() => {
        if (!isShowing) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        const focusTarget = closeButtonRef.current || primaryActionRef.current;
        if (focusTarget) {
            focusTarget.focus();
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isShowing, onClose]);

    if (!cotizacion || !isShowing) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const proyectoNombre =
        cotizacion.proyecto_nombre || cotizacion.proyecto?.nombre || cotizacion.proyectoNombre;
    const proyectoDireccion =
        cotizacion.proyecto_direccion ||
        cotizacion.proyecto?.direccion ||
        cotizacion.proyectoDireccion;
    const folio = cotizacion.folio || cotizacion.id;
    const fechaEmision = new Date(cotizacion.fecha).toLocaleDateString();

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div
                className="cotizacion-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cotizacion-modal-title"
                aria-describedby="cotizacion-modal-description"
            >
                <header className="modal-header">
                    <div className="header-title">
                        <p className="folio">Folio #{folio}</p>
                        <h3 id="cotizacion-modal-title">Detalles de cotización</h3>
                        <p id="cotizacion-modal-description" className="subtext">
                            {cotizacion.cliente}
                            {proyectoNombre ? ` · ${proyectoNombre}` : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        ref={closeButtonRef}
                        className="icon-button"
                        aria-label="Cerrar"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </header>

                <div className="modal-body">
                    <section className="summary-grid">
                        <article className="summary-card">
                            <p className="label">Cliente</p>
                            <p className="value">{cotizacion.cliente}</p>
                        </article>
                        <article className="summary-card">
                            <p className="label">Proyecto</p>
                            <p className="value">{proyectoNombre || 'No especificado'}</p>
                            {proyectoDireccion && <p className="muted">{proyectoDireccion}</p>}
                        </article>
                        <article className="summary-card">
                            <p className="label">Fecha de emisión</p>
                            <p className="value">{fechaEmision}</p>
                        </article>
                        <article className="summary-card highlight">
                            <p className="label">Total</p>
                            <p className="value">${parseFloat(cotizacion.total).toFixed(2)}</p>
                        </article>
                    </section>

                    <section className="table-card">
                        <div className="table-card__header">
                            <div>
                                <p className="label">Productos</p>
                                <h4>Resumen de artículos</h4>
                            </div>
                            <p className="muted">{productosDetalles.length} ítems</p>
                        </div>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Variante</th>
                                        <th>Cantidad</th>
                                        <th>Precio Unitario</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productosDetalles.map((detalle) => (
                                        <tr key={`${detalle.producto_id}-${detalle.tipo_variante}`}>
                                            <td>{detalle.nombre}</td>
                                            <td>{detalle.tipo_variante}</td>
                                            <td>{detalle.cantidad}</td>
                                            <td>${parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                                            <td>${parseFloat(detalle.total).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                <div className="modal-actions">
                    <div className="actions-group">
                        <button
                            type="button"
                            className="btn ghost"
                            onClick={onClose}
                        >
                            Cerrar
                        </button>
                    </div>
                    <div className="actions-group">
                        <button
                            type="button"
                            ref={primaryActionRef}
                            className="btn primary"
                            onClick={() => onEditCotizacion(cotizacion)}
                        >
                            Modificar
                        </button>
                        <button
                            type="button"
                            className="btn info"
                            onClick={() => onDownloadCotizacion(cotizacion.id)}
                        >
                            Descargar cotización
                        </button>
                        <button
                            type="button"
                            className="btn danger"
                            onClick={() => onCancelCotizacion(cotizacion.id)}
                        >
                            Cancelar Cotización
                        </button>
                        <button
                            type="button"
                            className="btn accent"
                            onClick={() => onDownloadRemision(cotizacion.id)}
                        >
                            Descargar nota de remisión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

CotizacionDetailsModal.propTypes = {
    cotizacion: PropTypes.shape({
        cliente: PropTypes.string.isRequired,
        fecha: PropTypes.string.isRequired,
        total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        proyecto_nombre: PropTypes.string,
        proyecto_direccion: PropTypes.string,
        proyecto: PropTypes.shape({
            nombre: PropTypes.string,
            direccion: PropTypes.string,
        }),
        detalles: PropTypes.arrayOf(
            PropTypes.shape({
                producto_id: PropTypes.number.isRequired,
                tipo_variante: PropTypes.string.isRequired,
                cantidad: PropTypes.number.isRequired,
                precio_unitario: PropTypes.oneOfType([
                    PropTypes.string,
                    PropTypes.number,
                ]).isRequired,
                total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            })
        ).isRequired,
        folio: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        proyectoNombre: PropTypes.string,
        proyectoDireccion: PropTypes.string,
    }).isRequired,
    isShowing: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCancelCotizacion: PropTypes.func.isRequired,
    onDownloadCotizacion: PropTypes.func.isRequired,
    onDownloadRemision: PropTypes.func.isRequired,
    onEditCotizacion: PropTypes.func.isRequired,
};

export default CotizacionDetailsModal;
