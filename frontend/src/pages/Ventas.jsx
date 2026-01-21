import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import NavigationTitle from '../components/NavigationTitle';
import { readAllProducts } from '../data-access/productsDataAccess';
import { QUERY_OPTIONS } from '../utils/useQuery';
import ProductDetailsModal from '../components/ProductDetailsModal';
import '../css/ventas.css';
import { UPLOADS_BASE_URL } from '../data-access/dataAccessUtils';
import { loadOrder, saveOrder } from '../utils/orderStorage';

const IMAGE_BASE_URL = UPLOADS_BASE_URL;

const Ventas = () => {
    const navigate = useNavigate();
    const { data: products, isLoading } = useQuery({
        ...QUERY_OPTIONS,
        queryKey: 'products',
        queryFn: readAllProducts,
        refetchOnWindowFocus: false,
    });

    const [order, setOrder] = useState(() => loadOrder());
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formatFilter, setFormatFilter] = useState('todos');

    const sortedProducts = useMemo(() => {
        if (!products) return [];
        return [...products].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [products]);

    const availableFormats = useMemo(() => {
        if (!sortedProducts.length) return [];
        const formats = new Set(sortedProducts.map((product) => product.formato).filter(Boolean));
        return Array.from(formats).sort((a, b) => a.localeCompare(b));
    }, [sortedProducts]);

    const filteredProducts = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return sortedProducts.filter((product) => {
            const productName = (product.nombre || '').toLowerCase();
            const productCode = (product.codigo || '').toLowerCase();
            const supplierName = (product.proveedor?.nombre || '').toLowerCase();
            const productFormat = (product.formato || '').toLowerCase();

            const matchesSearch =
                !normalizedSearch ||
                productName.includes(normalizedSearch) ||
                productCode.includes(normalizedSearch) ||
                supplierName.includes(normalizedSearch);

            const matchesFormat = formatFilter === 'todos' || productFormat === formatFilter.toLowerCase();

            return matchesSearch && matchesFormat;
        });
    }, [sortedProducts, searchTerm, formatFilter]);

    const totalInventory = useMemo(() => sortedProducts.length, [sortedProducts]);

    const totalOrderItems = useMemo(
        () =>
            order.reduce((accumulator, current) => {
                const quantity = parseFloat(current.cantidad) || 0;
                return accumulator + quantity;
            }, 0),
        [order]
    );

    const estimatedOrderValue = useMemo(
        () =>
            order.reduce((accumulator, current) => {
                const quantity = parseFloat(current.cantidad) || 0;
                const price = parseFloat(current.precio_m2_sin_iva) || 0;
                return accumulator + quantity * price;
            }, 0),
        [order]
    );

    useEffect(() => {
        saveOrder(order);
    }, [order]);

    const addToOrder = (product) => {
        setOrder((previousOrder) => {
            const existing = previousOrder.find((item) => item.id === product.id);
            if (existing) {
                return previousOrder.map((item) =>
                    item.id === product.id
                        ? { ...item, cantidad: (parseFloat(item.cantidad) + 1).toString() }
                        : item
                );
            }
            return [...previousOrder, { ...product, cantidad: '1' }];
        });
    };

    const removeFromOrder = (productId) => {
        setOrder((previousOrder) => previousOrder.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId, value) => {
        const decimalRegex = /^(\d+\.?\d*|\d*\.?\d+)$/;
        if (value === '' || decimalRegex.test(value)) {
            setOrder((previousOrder) =>
                previousOrder.map((item) => (item.id === productId ? { ...item, cantidad: value } : item))
            );
        }
    };

    const handleBlur = (productId, value) => {
        const parsed = parseFloat(value);
        const product = order.find((item) => item.id === productId);
        const boxSize = parseFloat(product?.m2_caja);

        if (Number.isNaN(parsed) || parsed <= 0) {
            updateQuantity(productId, '1');
            return;
        }

        if (!Number.isNaN(boxSize) && boxSize > 0 && parsed < boxSize) {
            alert(
                `La cantidad ingresada (${value}) es menor al tamaño de caja del producto (${boxSize}). ` +
                    'Por favor verifica antes de continuar.'
            );
            updateQuantity(productId, value);
            return;
        }

        updateQuantity(productId, parsed.toFixed(2));
    };

    const handleContinue = () => {
        if (!order.length) {
            alert('El carrito está vacío. Agrega productos para continuar.');
            return;
        }
        navigate('/app/ventas/ganancias', { state: { order } });
    };

    const handleClearCart = () => {
        if (!order.length) return;
        const shouldClear = window.confirm('¿Deseas vaciar el carrito por completo?');
        if (shouldClear) {
            setOrder([]);
        }
    };

    const handleShowDetails = (product) => {
        setSelectedProduct(product);
    };

    const handleImageError = (event) => {
        event.currentTarget.style.opacity = '0';
    };

    return (
        <>
            <NavigationTitle menu="Ventas" submenu="Registrar" />
            <div className="sales">
                <section className="sales__hero">
                    <div className="sales__hero-copy">
                        <p className="sales__hero-eyebrow">Panel de ventas</p>
                        <h1 className="sales__hero-title">Arma tu pedido con una experiencia más ágil</h1>
                        <p className="sales__hero-subtitle">
                            Explora el inventario con tarjetas visuales, agrega productos al carrito y llega al cálculo de
                            ganancias en menos pasos.
                        </p>
                        <div className="sales__hero-actions">
                            <div className="sales__hero-stat">
                                <span className="sales__hero-label">Productos disponibles</span>
                                <strong>{totalInventory}</strong>
                            </div>
                            <div className="sales__hero-stat">
                                <span className="sales__hero-label">Unidades en el carrito</span>
                                <strong>{totalOrderItems.toFixed(2)}</strong>
                            </div>
                            <div className="sales__hero-stat">
                                <span className="sales__hero-label">Valor estimado</span>
                                <strong>${estimatedOrderValue.toFixed(2)}</strong>
                            </div>
                        </div>
                    </div>
                    <div className="sales__hero-figure" aria-hidden="true">
                        <div className="sales__hero-badge">
                            <i className="fa-solid fa-receipt"></i>
                            <span>Nuevo flujo de venta</span>
                        </div>
                        <div className="sales__hero-illustration">
                            <i className="fa-solid fa-cart-plus"></i>
                        </div>
                    </div>
                </section>

                <section className="sales__workspace">
                    <div className="sales__products-panel">
                        <header className="sales__toolbar" aria-label="Herramientas de búsqueda">
                            <div className="sales__search">
                                <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                                <input
                                    type="search"
                                    placeholder="Buscar por código, nombre o proveedor"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                />
                            </div>
                            <div className="sales__filters">
                                <label htmlFor="format-filter">Formato</label>
                                <select
                                    id="format-filter"
                                    value={formatFilter}
                                    onChange={(event) => setFormatFilter(event.target.value)}
                                >
                                    <option value="todos">Todos</option>
                                    {availableFormats.map((format) => (
                                        <option value={format} key={format}>
                                            {format}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </header>

                        <div className="sales__grid" aria-live="polite">
                            {isLoading ? (
                                <p className="sales__empty">Cargando catálogo...</p>
                            ) : filteredProducts.length ? (
                                filteredProducts.map((product) => {
                                    const supplierName = product.proveedor?.nombre || 'Sin proveedor asignado';
                                    const price = product.precio_m2_sin_iva
                                        ? `$${parseFloat(product.precio_m2_sin_iva).toFixed(2)}/m²`
                                        : 'Precio no disponible';
                                    const imageSrc = `${IMAGE_BASE_URL}/producto_${product.id}.jpeg`;

                                    return (
                                        <article
                                            key={product.id}
                                            className="sales-card"
                                            role="group"
                                            aria-label={`Producto ${product.nombre}`}
                                        >
                                            <button
                                                type="button"
                                                className="sales-card__focus"
                                                onClick={() => handleShowDetails(product)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                        event.preventDefault();
                                                        handleShowDetails(product);
                                                    }
                                                }}
                                            >
                                                <div className="sales-card__media">
                                                    <img
                                                        src={imageSrc}
                                                        alt={`Imagen de ${product.nombre}`}
                                                        onError={handleImageError}
                                                    />
                                                </div>
                                                <div className="sales-card__body">
                                                    <h3>{product.nombre}</h3>
                                                    <p className="sales-card__code">Código: {product.codigo || 'Sin código'}</p>
                                                    <ul className="sales-card__meta">
                                                        <li>
                                                            <i className="fa-solid fa-box"></i>
                                                            {product.formato || 'Formato sin definir'}
                                                        </li>
                                                        <li>
                                                            <i className="fa-solid fa-palette"></i>
                                                            {product.color || 'Color no especificado'}
                                                        </li>
                                                        <li>
                                                            <i className="fa-solid fa-user-tie"></i>
                                                            {supplierName}
                                                        </li>
                                                    </ul>
                                                </div>
                                            </button>
                                            <footer className="sales-card__footer">
                                                <span className="sales-card__price">{price}</span>
                                                <button
                                                    type="button"
                                                    className="sales-card__add"
                                                    onClick={() => addToOrder(product)}
                                                >
                                                    <i className="fa-solid fa-cart-plus"></i> Agregar
                                                </button>
                                            </footer>
                                        </article>
                                    );
                                })
                            ) : (
                                <p className="sales__empty">
                                    No encontramos productos con esos filtros. Intenta ajustar la búsqueda o restablecer los
                                    filtros.
                                </p>
                            )}
                        </div>
                    </div>

                    <aside className="sales__cart" aria-live="polite">
                        <header className="sales__cart-header">
                            <h2>Carrito de venta</h2>
                            <p>Organiza las cantidades antes de continuar al cálculo de ganancias.</p>
                        </header>

                        {order.length ? (
                            <ul className="sales__cart-list">
                                {order.map((item) => (
                                    <li className="sales__cart-item" key={item.id}>
                                        <div className="sales__cart-info">
                                            <h3>{item.nombre}</h3>
                                            <span className="sales__cart-code">{item.codigo || 'Sin código'}</span>
                                        </div>
                                        <div className="sales__cart-actions">
                                            <label htmlFor={`quantity-${item.id}`}>Cantidad</label>
                                            <input
                                                id={`quantity-${item.id}`}
                                                type="text"
                                                inputMode="decimal"
                                                value={item.cantidad}
                                                onChange={(event) => updateQuantity(item.id, event.target.value)}
                                                onBlur={(event) => handleBlur(item.id, event.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="sales__cart-remove"
                                                onClick={() => removeFromOrder(item.id)}
                                                aria-label={`Eliminar ${item.nombre} del carrito`}
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="sales__cart-empty">
                                Aún no has agregado productos. Selecciona artículos del catálogo para comenzar una venta.
                            </p>
                        )}

                        <div className="sales__cart-summary">
                            <div>
                                <span>Total de unidades</span>
                                <strong>{totalOrderItems.toFixed(2)}</strong>
                            </div>
                            <div>
                                <span>Valor estimado</span>
                                <strong>${estimatedOrderValue.toFixed(2)}</strong>
                            </div>
                        </div>

                        <div className="sales__cart-cta">
                            <button type="button" className="sales__ghost-button" onClick={handleClearCart}>
                                <i className="fa-solid fa-eraser"></i> Vaciar carrito
                            </button>
                            <button type="button" className="sales__primary-button" onClick={handleContinue}>
                                Continuar a ganancias <i className="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </aside>
                </section>
            </div>

            {selectedProduct && (
                <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
            )}
        </>
    );
};

export default Ventas;
