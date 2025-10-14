import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import { readAllProducts } from '../data-access/productsDataAccess';
import { deleteProductMutation, DELETE_MUTATION_OPTIONS } from '../utils/mutations';
import { QUERY_OPTIONS } from '../utils/useQuery';
import Modal from '../components/Modal';
import ProductForm from '../forms/ProductForm';
import ProductDetailsModal from '../components/ProductDetailsModal';
import UploadImageModal from '../components/UploadImageModal';
import '../css/products.css';

const Products = () => {
    const { data: products, isLoading } = useQuery({
        ...QUERY_OPTIONS,
        queryKey: 'products',
        queryFn: readAllProducts,
        refetchOnWindowFocus: false,
    });
    const [isShowingFormModal, setIsShowingFormModal] = useState(false); // Modal del formulario
    const [isShowingImageModal, setIsShowingImageModal] = useState(false); // Modal de carga de imagen
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedProductId, setSelectedProductId] = useState(null); // ID del producto para la imagen
    const [isShowingDetailsModal, setIsShowingDetailsModal] = useState(false); // Modal de detalles del producto
    const [searchTerm, setSearchTerm] = useState('');
    const [formatFilter, setFormatFilter] = useState('todos');
    const queryClient = useQueryClient();

    const deleteMutation = useMutation(deleteProductMutation, DELETE_MUTATION_OPTIONS);

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

    const totalProducts = useMemo(() => sortedProducts.length, [sortedProducts]);
    const productsWithSupplier = useMemo(
        () => sortedProducts.filter((product) => Boolean(product.proveedor?.nombre)).length,
        [sortedProducts]
    );
    const averagePrice = useMemo(() => {
        if (!sortedProducts.length) return 0;

        const total = sortedProducts.reduce((acc, product) => acc + (product.precio_m2_sin_iva || 0), 0);
        return total / sortedProducts.length;
    }, [sortedProducts]);

    async function onDeleteButtonClicked(id) {
        const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este producto?');
        if (!confirmDelete) return; // Si el usuario cancela, no se realiza ninguna acción

        try {
            await deleteMutation.mutateAsync(id);
            queryClient.resetQueries(); // Actualiza la lista de productos
            alert('Producto eliminado con éxito.'); // Mensaje de éxito
        } catch (error) {
            console.error('Error al eliminar el producto:', error);
            alert('Hubo un error al eliminar el producto.');
        }
    }

    const openImageModal = (productId) => {
        setSelectedProductId(productId); // Establecer el ID del producto
        setIsShowingImageModal(true); // Abrir el modal de imagen
    };

    const closeImageModal = () => {
        setSelectedProductId(null); // Limpiar el ID del producto
        setIsShowingImageModal(false); // Cerrar el modal de imagen
    };

    return (
        <>
            <NavigationTitle menu="Inventario" submenu="Productos" />
            <div className="products">
                <section className="products__hero">
                    <div className="products__hero-copy">
                        <p className="products__hero-eyebrow">Catálogo actualizado</p>
                        <h1 className="products__hero-title">Gestiona tu inventario con una vista más humana</h1>
                        <p className="products__hero-subtitle">
                            Encuentra rápidamente cualquier referencia, controla tus precios por metro cuadrado y
                            mantiene informados a tus clientes con fichas modernas y fáciles de leer.
                        </p>
                        <div className="products__hero-actions">
                            <button
                                type="button"
                                className="products__primary-action"
                                onClick={() => setIsShowingFormModal(true)}
                            >
                                <i className="fa-solid fa-plus"></i> Nuevo producto
                            </button>
                            <button
                                type="button"
                                className="products__ghost-action"
                                onClick={() => queryClient.invalidateQueries('products')}
                            >
                                <i className="fa-solid fa-rotate"></i> Actualizar lista
                            </button>
                        </div>
                    </div>
                    <div className="products__hero-stats" aria-label="Resumen de inventario">
                        <article className="products__stat" role="status">
                            <span className="products__stat-label">Total de productos</span>
                            <strong className="products__stat-value">{totalProducts}</strong>
                        </article>
                        <article className="products__stat">
                            <span className="products__stat-label">Con proveedor asignado</span>
                            <strong className="products__stat-value">
                                {productsWithSupplier}
                                <span className="products__stat-extra">
                                    {totalProducts ? `${Math.round((productsWithSupplier / totalProducts) * 100)}%` : '0%'}
                                </span>
                            </strong>
                        </article>
                        <article className="products__stat">
                            <span className="products__stat-label">Precio promedio m²</span>
                            <strong className="products__stat-value">
                                ${averagePrice.toFixed(2)}
                            </strong>
                        </article>
                    </div>
                </section>

                <section className="products__toolbar" aria-label="Herramientas de búsqueda">
                    <div className="products__search">
                        <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                        <input
                            type="search"
                            placeholder="Buscar por código, nombre o proveedor"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <div className="products__filters">
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
                </section>

                <section className="products__grid" aria-live="polite">
                    {isLoading ? (
                        <p className="products__empty">Cargando productos...</p>
                    ) : filteredProducts.length ? (
                        filteredProducts.map((product) => {
                            const supplierName = product.proveedor?.nombre || 'Sin proveedor asignado';
                            const price = product.precio_m2_sin_iva ? product.precio_m2_sin_iva.toFixed(2) : '0.00';

                            return (
                                <article
                                    key={product.id}
                                    className="product-card"
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
                                    <header className="product-card__header">
                                        <span className="product-card__code">{product.codigo}</span>
                                        <div className="product-card__actions">
                                            <button
                                                type="button"
                                                className="product-card__icon-button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setSelectedProduct(product);
                                                    setIsShowingFormModal(true);
                                                }}
                                                aria-label={`Editar ${product.nombre}`}
                                            >
                                                <i className="fa-solid fa-pen-to-square"></i>
                                            </button>
                                            <button
                                                type="button"
                                                className="product-card__icon-button product-card__icon-button--danger"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onDeleteButtonClicked(product.id);
                                                }}
                                                aria-label={`Eliminar ${product.nombre}`}
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </header>

                                    <div className="product-card__body">
                                        <h2>{product.nombre}</h2>
                                        <p className="product-card__description">
                                            {product.descripcion || 'Sin descripción registrada'}
                                        </p>
                                        <dl className="product-card__details">
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
                                                <dd>{supplierName}</dd>
                                            </div>
                                            <div>
                                                <dt>Precio por m²</dt>
                                                <dd>${price}</dd>
                                            </div>
                                        </dl>
                                    </div>

                                    <figure className="product-card__media">
                                        {product.id ? (
                                            <img
                                                src={`http://147.93.47.106:8000/uploads/producto_${product.id}.jpeg`}
                                                alt={product.nombre}
                                                onError={(event) => {
                                                    event.currentTarget.onerror = null;
                                                    event.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="product-card__placeholder" aria-hidden="true">
                                                <i className="fa-solid fa-image"></i>
                                            </div>
                                        )}
                                    </figure>
                                </article>
                            );
                        })
                    ) : (
                        <div className="products__empty">
                            <i className="fa-regular fa-face-smile"></i>
                            <p>
                                {searchTerm || formatFilter !== 'todos'
                                    ? 'No encontramos productos que coincidan con tu búsqueda. Ajusta los filtros para ver otras opciones.'
                                    : 'Aún no hay productos registrados. Crea tu primer producto para comenzar a gestionar tu inventario.'}
                            </p>
                        </div>
                    )}
                </section>
            </div>
            {/* Modal para detalles del producto */}
            {isShowingDetailsModal && (
                <ProductDetailsModal
                    product={selectedProduct}
                    onClose={() => {
                        setSelectedProduct(null);
                        setIsShowingDetailsModal(false);
                    }}
                />
            )}
            {/* Modal para formulario */}
            <Modal
                isShowing={isShowingFormModal}
                setIsShowing={setIsShowingFormModal}
                onClose={() => {
                    setSelectedProduct(null);
                    setIsShowingFormModal(false);
                }}
            >
                <ProductForm
                    cancelAction={() => {
                        setSelectedProduct(null);
                        setIsShowingFormModal(false);
                    }}
                    productUpdate={selectedProduct}
                    openImageModal={openImageModal} // Pasa la función para abrir el modal de imagen
                />
            </Modal>
            {/* Modal para carga de imagen */}
            {isShowingImageModal && (
                <UploadImageModal
                    productId={selectedProductId}
                    closeModal={closeImageModal} // Cierra el modal de imagen
                />
            )}
        </>
    );
};

export default Products;
