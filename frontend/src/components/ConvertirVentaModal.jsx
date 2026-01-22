import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import '../css/CotizacionDetailsModal.css';
import '../css/convertirVentaModal.css';

const ConvertirVentaModal = ({ isShowing, cotizacion, onClose, onConfirm }) => {
    const [estado, setEstado] = useState('surtiendo');
    const [comentarios, setComentarios] = useState('');
    const closeButtonRef = useRef(null);

    useEffect(() => {
        if (!isShowing) return;
        setEstado('surtiendo');
        setComentarios('');
    }, [isShowing]);

    useEffect(() => {
        if (!isShowing) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        closeButtonRef.current?.focus();
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isShowing, onClose]);

    if (!isShowing || !cotizacion) return null;

    const handleSubmit = (event) => {
        event.preventDefault();
        onConfirm({ estado, comentarios });
    };

    return (
        <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
            <div className="convertir-venta-modal" role="dialog" aria-modal="true">
                <header className="convertir-venta-modal__header">
                    <div>
                        <p className="convertir-venta-modal__eyebrow">Cotización #{cotizacion.id}</p>
                        <h3>Generar pedido</h3>
                        <p className="convertir-venta-modal__subtitle">
                            Define el estado inicial y registra comentarios internos.
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

                <form className="convertir-venta-modal__body" onSubmit={handleSubmit}>
                    <label htmlFor="pedido-estado">Estado inicial</label>
                    <select id="pedido-estado" value={estado} onChange={(event) => setEstado(event.target.value)}>
                        <option value="surtiendo">Surtiendo</option>
                        <option value="en_almacen">En almacén</option>
                        <option value="en_entrega">En entrega</option>
                        <option value="completada">Completada</option>
                    </select>

                    <label htmlFor="pedido-comentarios">Comentarios</label>
                    <textarea
                        id="pedido-comentarios"
                        rows="4"
                        placeholder="Notas internas para el pedido"
                        value={comentarios}
                        onChange={(event) => setComentarios(event.target.value)}
                    />

                    <div className="convertir-venta-modal__actions">
                        <button type="button" className="btn ghost" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn primary">
                            Confirmar pedido
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

ConvertirVentaModal.propTypes = {
    isShowing: PropTypes.bool.isRequired,
    cotizacion: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }),
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
};

export default ConvertirVentaModal;
