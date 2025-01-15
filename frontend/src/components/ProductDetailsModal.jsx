import React from 'react';

const ProductDetailsModal = ({ product, onClose }) => {
    if (!product) return null; // No mostrar si no hay producto seleccionado.

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog custom-modal-width">
                <div className="modal-content">
                    {/* Header del Modal */}
                    <div className="modal-header">
                        <h5 className="modal-title">Detalles del Producto</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    {/* Contenido del Modal */}
                    <div className="modal-body">
                        {/* Mostrar la imagen si existe */}
                        {product.id && (
                            <div className="text-center mb-4">
                                <img
                                    src={`http://147.93.47.106:8000/uploads/producto_${product.id}.jpeg`}
                                    alt={product.nombre}
                                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'cover' }}
                                />
                            </div>
                        )}

                        <h6>Información General</h6>
                        <p><strong>Código:</strong> {product.codigo}</p>
                        <p><strong>Nombre:</strong> {product.nombre}</p>
                        <p><strong>Formato:</strong> {product.formato || 'No especificado'}</p>
                        <p><strong>Unidad de Venta:</strong> {product.unidad_venta || 'No especificado'}</p>
                        <p><strong>Piezas por Caja:</strong> {product.piezas_caja || 'No especificado'}</p>
                        <p><strong>Peso por Pieza (kg):</strong> {product.peso_pieza_kg || 'No especificado'}</p>
                        <p><strong>Peso por Caja (kg):</strong> {product.peso_caja_kg || 'No especificado'}</p>
                        <p><strong>M2 por Caja:</strong> {product.m2_caja || 'No especificado'}</p>
                        <p><strong>Color:</strong> {product.color || 'No especificado'}</p>
                        <p><strong>Material:</strong> {product.material || 'No especificado'}</p>
                        <p><strong>¿Es Externo?:</strong> {product.es_externo ? 'Sí' : 'No'}</p>

                        <h6>Precios</h6>
                        <p><strong>Precio por Caja (con IVA):</strong> ${product.precio_caja_con_iva || 'No especificado'}</p>
                        <p><strong>Precio por Caja (sin IVA):</strong> ${product.precio_caja_sin_iva || 'No especificado'}</p>
                        <p><strong>Precio por Pieza (con IVA):</strong> ${product.precio_pieza_con_iva || 'No especificado'}</p>
                        <p><strong>Precio por Pieza (sin IVA):</strong> ${product.precio_pieza_sin_iva || 'No especificado'}</p>
                        <p><strong>Precio por M2 (con IVA):</strong> ${product.precio_m2_con_iva || 'No especificado'}</p>
                        <p><strong>Precio por M2 (sin IVA):</strong> ${product.precio_m2_sin_iva || 'No especificado'}</p>
                    </div>

                    {/* Footer del Modal */}
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsModal;
