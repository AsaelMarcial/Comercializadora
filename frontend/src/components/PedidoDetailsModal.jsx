import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import '../css/CotizacionDetailsModal.css';
import '../css/pedidoDetailsModal.css';
import { getProductById } from '../data-access/productsDataAccess';

const PedidoDetailsModal = ({ pedido, isShowing, onClose, onSave, onDownloadPDF }) => {
    const [detalles, setDetalles] = useState([]);
    const [estado, setEstado] = useState('surtiendo');
    const [comentarios, setComentarios] = useState('');
    const closeButtonRef = useRef(null);

    useEffect(() => {
        if (!pedido) return;
        setEstado(pedido.estado || 'surtiendo');
        setComentarios(pedido.comentarios || '');
    }, [pedido]);

    useEffect(() => {
        if (!pedido?.detalles?.length) return;
        const fetchDetalles = async () => {
            const productos = await Promise.all(
                pedido.detalles.map(async (detalle) => {
                    try {
                        const producto = await getProductById(detalle.producto_id);
                        return { ...detalle, nombre: producto.nombre };
                    } catch (error) {
                        console.error(`Error al obtener el producto ${detalle.producto_id}:`, error);
                        return { ...detalle, nombre: 'Nombre no disponible' };
                    }
                })
            );
            setDetalles(productos);
        };
        fetchDetalles();
    }, [pedido]);

    useEffect(() => {
        if (!isShowing) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        closeButtonRef.current?.focus();
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isShowing, onClose]);

    if (!isShowing || !pedido) return null;

    const handleSubmit = () => {
        onSave({ estado, comentarios });
    };

    return (
        <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
            <div className="pedido-modal" role="dialog" aria-modal="true">
                <header className="modal-header">
                    <div className="header-title">
                        <p className="folio">Pedido #{pedido.id}</p>
                        <h3>Detalles del pedido</h3>
                        <p className="subtext">{pedido.cliente}</p>
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
                            <p className="value">{pedido.cliente}</p>
                        </article>
                        <article className="summary-card">
                            <p className="label">Estado</p>
                            <p className="value">{pedido.estado}</p>
                        </article>
                        <article className="summary-card">
                            <p className="label">Fecha</p>
                            <p className="value">{new Date(pedido.fecha).toLocaleDateString()}</p>
                        </article>
                        <article className="summary-card highlight">
                            <p className="label">Total</p>
                            <p className="value">${parseFloat(pedido.total).toFixed(2)}</p>
                        </article>
                    </section>

                    <section className="table-card">
                        <div className="table-card__header">
                            <div>
                                <p className="label">Productos</p>
                                <h4>Resumen de artículos</h4>
                            </div>
                            <p className="muted">{detalles.length} ítems</p>
                        </div>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Precio Unitario</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detalles.map((detalle) => (
                                        <tr key={`${detalle.producto_id}-${detalle.id}`}>
                                            <td>{detalle.nombre}</td>
                                            <td>{detalle.cantidad}</td>
                                            <td>${parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="pedido-modal__update">
                        <label htmlFor="pedido-estado">Estado</label>
                        <select id="pedido-estado" value={estado} onChange={(event) => setEstado(event.target.value)}>
                            <option value="surtiendo">Surtiendo</option>
                            <option value="en_almacen">En almacén</option>
                            <option value="en_entrega">En entrega</option>
                            <option value="completada">Completada</option>
                        </select>

                        <label htmlFor="pedido-comentarios">Comentarios</label>
                        <textarea
                            id="pedido-comentarios"
                            rows="3"
                            value={comentarios}
                            onChange={(event) => setComentarios(event.target.value)}
                        />
                    </section>
                </div>

                <div className="modal-actions">
                    <div className="actions-group">
                        <button type="button" className="btn ghost" onClick={onClose}>
                            Cerrar
                        </button>
                    </div>
                    <div className="actions-group">
                        {onDownloadPDF && (
                            <button type="button" className="btn accent" onClick={onDownloadPDF}>
                                Descargar PDF
                            </button>
                        )}
                        <button type="button" className="btn primary" onClick={handleSubmit}>
                            Guardar cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

PedidoDetailsModal.propTypes = {
    pedido: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        cliente: PropTypes.string.isRequired,
        fecha: PropTypes.string.isRequired,
        total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        estado: PropTypes.string,
        comentarios: PropTypes.string,
        detalles: PropTypes.arrayOf(
            PropTypes.shape({
                producto_id: PropTypes.number.isRequired,
                cantidad: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
                precio_unitario: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            })
        ),
    }),
    isShowing: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onDownloadPDF: PropTypes.func,
};

export default PedidoDetailsModal;
