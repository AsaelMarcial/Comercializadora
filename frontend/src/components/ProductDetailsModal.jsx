import React, { useState } from 'react';
import '../css/productDetailsModal.css';

const ProductDetailsModal = ({ product, onClose }) => {
    if (!product) return null; // No mostrar si no hay producto seleccionado.

    const [isImageOpen, setIsImageOpen] = useState(false);

    const generalDetails = [
        { label: 'Código', value: product.codigo || 'No especificado' },
        { label: 'Proveedor', value: product.proveedor?.nombre || 'Sin proveedor' },
        { label: 'Formato', value: product.formato || 'No especificado' },
        { label: 'Unidad de Venta', value: product.unidad_venta || 'No especificado' },
        { label: 'Piezas por Caja', value: product.piezas_caja || 'No especificado' },
        { label: 'Peso por Pieza (kg)', value: product.peso_pieza_kg || 'No especificado' },
        { label: 'Peso por Caja (kg)', value: product.peso_caja_kg || 'No especificado' },
        { label: 'M2 por Caja', value: product.m2_caja || 'No especificado' },
        { label: 'Color', value: product.color || 'No especificado' },
        { label: 'Material', value: product.material || 'No especificado' },
    ];

    const pricingDetails = [
        { label: 'Precio por Caja (con IVA)', value: product.precio_caja_con_iva },
        { label: 'Precio por Caja (sin IVA)', value: product.precio_caja_sin_iva },
        { label: 'Precio por Pieza (con IVA)', value: product.precio_pieza_con_iva },
        { label: 'Precio por Pieza (sin IVA)', value: product.precio_pieza_sin_iva },
        { label: 'Precio por M2 (con IVA)', value: product.precio_m2_con_iva },
        { label: 'Precio por M2 (sin IVA)', value: product.precio_m2_sin_iva },
    ];

    const imageUrl = product.id
        ? `http://147.93.47.106:8000/uploads/producto_${product.id}.jpeg`
        : '';

    const imageFrameProps = imageUrl
        ? {
              role: 'button',
              tabIndex: 0,
              onClick: openImageModal,
              onKeyPress: (event) => (event.key === 'Enter' || event.key === ' ') && openImageModal(),
          }
        : {};

    const formatCurrency = (value) => {
        if (value === null || value === undefined || value === '') return 'No especificado';
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
        }).format(Number(value));
    };

    const openImageModal = () => {
        if (imageUrl) {
            setIsImageOpen(true);
        }
    };

    const closeImageModal = () => setIsImageOpen(false);

    return (
        <div className="product-modal-backdrop" role="dialog" aria-modal="true">
            <div className="product-modal__dialog">
                <div className="product-modal__header">
                    <div>
                        <p className="product-modal__eyebrow">Producto</p>
                        <h3 className="product-modal__title">Detalles del producto</h3>
                        <p className="product-modal__subtitle">Información general, ficha técnica y precios actualizados.</p>
                    </div>
                    <button type="button" className="product-modal__close" onClick={onClose} aria-label="Cerrar">
                        ×
                    </button>
                </div>

                <div className="product-modal__body">
                    <div className="product-modal__layout">
                        <div className="product-modal__media">
                            <div className={`product-modal__image-frame ${imageUrl ? 'product-modal__image-frame--interactive' : ''}`} {...imageFrameProps}>
                                {imageUrl ? (
                                    <img src={imageUrl} alt={product.nombre} className="product-modal__image" />
                                ) : (
                                    <div className="product-modal__image-placeholder">Imagen no disponible</div>
                                )}
                                {imageUrl && <span className="product-modal__zoom-hint">Haz clic para ampliar</span>}
                                <span className="product-modal__chip">ID: {product.id || 'N/D'}</span>
                            </div>
                            <div className="product-modal__summary">
                                <h4 className="product-modal__product-name">{product.nombre || 'Producto sin nombre'}</h4>
                                <p className="product-modal__product-code">Código {product.codigo || 'N/D'} • {product.formato || 'Formato no especificado'}</p>
                            </div>
                        </div>

                        <div className="product-modal__details">
                            <div className="product-modal__section">
                                <div className="product-modal__section-header">
                                    <div>
                                        <p className="product-modal__eyebrow">Ficha técnica</p>
                                        <h5 className="product-modal__section-title">Información general</h5>
                                    </div>
                                </div>
                                <div className="product-modal__info-grid">
                                    {generalDetails.map((item) => (
                                        <div key={item.label} className="product-modal__card">
                                            <p className="product-modal__card-label">{item.label}</p>
                                            <p className="product-modal__card-value">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="product-modal__section">
                                <div className="product-modal__section-header">
                                    <div>
                                        <p className="product-modal__eyebrow">Comercial</p>
                                        <h5 className="product-modal__section-title">Precios</h5>
                                    </div>
                                    <span className="product-modal__badge">MXN</span>
                                </div>
                                <div className="product-modal__info-grid product-modal__info-grid--prices">
                                    {pricingDetails.map((item) => (
                                        <div key={item.label} className="product-modal__card product-modal__card--highlight">
                                            <p className="product-modal__card-label">{item.label}</p>
                                            <p className="product-modal__card-value">{formatCurrency(item.value)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="product-modal__footer">
                    <button type="button" className="product-modal__ghost-button" onClick={onClose}>
                        Volver al listado
                    </button>
                    <button type="button" className="product-modal__primary-button" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>

            {isImageOpen && (
                <div className="product-modal__image-overlay" role="dialog" aria-modal="true" onClick={closeImageModal}>
                    <div className="product-modal__image-lightbox" onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="product-modal__lightbox-close" onClick={closeImageModal} aria-label="Cerrar imagen ampliada">
                            ×
                        </button>
                        <img
                            src={imageUrl}
                            alt={`Vista ampliada de ${product.nombre || 'producto'}`}
                            className="product-modal__image-full"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetailsModal;
