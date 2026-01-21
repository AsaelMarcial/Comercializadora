import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import ProductDetailsModal from '../components/ProductDetailsModal';
import { readPublicProducts } from '../data-access/productsDataAccess';
import { UPLOADS_BASE_URL } from '../data-access/dataAccessUtils';
import '../css/publicCatalog.css';

const COMPANY_ADDRESS = 'Dirección: Pendiente de actualizar';

const PublicCatalog = () => {
    const navigate = useNavigate();
    const { data: products, isLoading } = useQuery({
        queryKey: 'public-products',
        queryFn: readPublicProducts,
        refetchOnWindowFocus: false,
    });

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isShowingDetailsModal, setIsShowingDetailsModal] = useState(false);
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

    return (
        <div className="public-catalog">
            <header className="public-catalog__header">
                <div className="public-catalog__brand">
                    <img
                        src="/Logo COMERCIALIZADORA Orza FONDO AZUL.png"
                        alt="Comercializadora Orza"
                        className="public-catalog__logo"
                    />
                    <div>
                        <p className="public-catalog__tagline">Catálogo público</p>
                        <h1>Productos disponibles</h1>
                        <p className="public-catalog__address">{COMPANY_ADDRESS}</p>
                    </div>
                </div>
                <button
                    type="button"
                    className="public-catalog__login"
                    onClick={() => navigate('/login')}
                >
                    Iniciar sesión
                </button>
            </header>

            <section className="public-catalog__search" aria-label="Buscar productos">
                <div className="public-catalog__search-input">
                    <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                    <input
                        type="search"
                        placeholder="Buscar por código, nombre o proveedor"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </div>
                <div className="public-catalog__filter">
                    <label htmlFor="public-format-filter">Formato</label>
                    <select
                        id="public-format-filter"
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
            </section>

            <section className="public-catalog__grid" aria-live="polite">
                {isLoading ? (
                    <p className="public-catalog__empty">Cargando catálogo...</p>
                ) : filteredProducts.length ? (
                    filteredProducts.map((product) => (
                        <article
                            key={product.id}
                            className="public-product-card"
                            onClick={() => {
                                setSelectedProduct(product);
                                setIsShowingDetailsModal(true);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    setSelectedProduct(product);
                                    setIsShowingDetailsModal(true);
                                }
                            }}
                        >
                            <header className="public-product-card__header">
                                <span className="public-product-card__code">{product.codigo || 'Sin código'}</span>
                                <span className="public-product-card__badge">Ficha técnica</span>
                            </header>

                            <div className="public-product-card__body">
                                <h2>{product.nombre || 'Producto sin nombre'}</h2>
                                <p className="public-product-card__description">
                                    {product.descripcion || 'Sin descripción registrada'}
                                </p>
                                <dl className="public-product-card__details">
                                    <div>
                                        <dt>Formato</dt>
                                        <dd>{product.formato || 'No especificado'}</dd>
                                    </div>
                                    <div>
                                        <dt>Color</dt>
                                        <dd>{product.color || 'No definido'}</dd>
                                    </div>
                                    <div>
                                        <dt>Proveedor</dt>
                                        <dd>{product.proveedor?.nombre || 'Sin proveedor'}</dd>
                                    </div>
                                    <div>
                                        <dt>Material</dt>
                                        <dd>{product.material || 'No especificado'}</dd>
                                    </div>
                                </dl>
                            </div>

                            <figure className="public-product-card__media">
                                {product.id ? (
                                    <img
                                        src={`${UPLOADS_BASE_URL}/producto_${product.id}.jpeg`}
                                        alt={product.nombre}
                                        onError={(event) => {
                                            event.currentTarget.onerror = null;
                                            event.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="public-product-card__placeholder" aria-hidden="true">
                                        <i className="fa-solid fa-image"></i>
                                    </div>
                                )}
                            </figure>
                        </article>
                    ))
                ) : (
                    <div className="public-catalog__empty">
                        <i className="fa-regular fa-face-smile"></i>
                        <p>
                            {searchTerm || formatFilter !== 'todos'
                                ? 'No encontramos productos que coincidan con tu búsqueda.'
                                : 'Aún no hay productos publicados en el catálogo.'}
                        </p>
                    </div>
                )}
            </section>

            {isShowingDetailsModal && (
                <ProductDetailsModal
                    product={selectedProduct}
                    onClose={() => {
                        setSelectedProduct(null);
                        setIsShowingDetailsModal(false);
                    }}
                    showPricing={false}
                />
            )}
        </div>
    );
};

export default PublicCatalog;
