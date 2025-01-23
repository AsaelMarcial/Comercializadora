import React from 'react';
import PropTypes from 'prop-types';
import '../css/CotizacionDetailsModal.css';

const CotizacionDetailsModal = ({
    cotizacion,
    isShowing,
    onClose,
    onCancelCotizacion,
    onDownloadPDF,
}) => {
    if (!cotizacion || !isShowing) return null;

    const handleBackdropClick = (e) => {
        if (e.target.className.includes('modal-backdrop')) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="cotizacion-modal">
                <h3>Detalles de Cotización</h3>
                <div className="modal-body">
                    <p><strong>Cliente:</strong> {cotizacion.cliente}</p>
                    <p><strong>Fecha:</strong> {new Date(cotizacion.fecha).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> ${parseFloat(cotizacion.total).toFixed(2)}</p>

                    <h4>Productos:</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Variante</th> {/* Nueva columna */}
                                <th>Cantidad</th>
                                <th>Precio Unitario</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cotizacion.detalles.map((detalle) => (
                                <tr key={detalle.producto_id}>
                                    <td>{detalle.producto_id}</td>
                                    <td>{detalle.tipo_variante}</td> {/* Mostrar la variante */}
                                    <td>{detalle.cantidad}</td>
                                    <td>${parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                                    <td>${parseFloat(detalle.total).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="modal-footer">
                    <button
                        className="btn btn-danger"
                        onClick={() => onCancelCotizacion(cotizacion.id)}
                    >
                        Cancelar Cotización
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => onDownloadPDF(cotizacion.id)}
                    >
                        Descargar PDF
                    </button>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cerrar
                    </button>
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
        detalles: PropTypes.arrayOf(
            PropTypes.shape({
                producto_id: PropTypes.number.isRequired,
                tipo_variante: PropTypes.string.isRequired, // Nueva validación
                cantidad: PropTypes.number.isRequired,
                precio_unitario: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
                total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            })
        ).isRequired,
    }).isRequired,
    isShowing: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCancelCotizacion: PropTypes.func.isRequired,
    onDownloadPDF: PropTypes.func.isRequired,
};

export default CotizacionDetailsModal;
