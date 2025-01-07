import React, { useState } from 'react';
import { Tab, Tabs } from 'react-bootstrap'; // Si usas Bootstrap para tabs, instala la dependencia: `npm install react-bootstrap bootstrap`

const ProductDetailsModal = ({ product, onClose }) => {
    const [selectedTab, setSelectedTab] = useState('details');

    if (!product) return null; // No mostrar si no hay producto seleccionado.

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog custom-modal-width">
                <div className="modal-content">
                    {/* Header del Modal */}
                    <div className="modal-header">
                        <h5 className="modal-title">Detalles del Producto - {product.nombre}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    {/* Tabs y contenido del Modal */}
                    <div className="modal-body">
                        <Tabs
                            activeKey={selectedTab}
                            onSelect={(k) => setSelectedTab(k)}
                            className="mb-3"
                        >
                            {/* Tab 1: Detalles generales */}
                            <Tab eventKey="details" title="Detalles Generales">
                                <h6>Información General</h6>
                                <p><strong>Nombre:</strong> {product.nombre}</p>
                                <p><strong>Tipo:</strong> {product.tipo}</p>
                                <p><strong>Descripción:</strong> {product.descripcion || 'No disponible'}</p>
                            </Tab>
                            {/* Tab 2: Precios */}
                            <Tab eventKey="prices" title="Precios">
                                <h6>Precios</h6>
                                <p><strong>Precio de Compra:</strong> ${product.formato}</p>
                                <p><strong>Precio de Venta:</strong> ${product.unidad_venta}</p>
                                <p><strong>Precio Preferencial:</strong> ${product.precioPreferencial}</p>
                            </Tab>
                            {/* Tab 3: Inventario */}
                            <Tab eventKey="inventory" title="Inventario">
                                <h6>Inventario</h6>
                                <p><strong>Stock Disponible:</strong> {product.stock}</p>
                                <p><strong>Estado:</strong> {product.stock > 0 ? 'Disponible' : 'Agotado'}</p>
                            </Tab>
                        </Tabs>
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