import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import { readAllProducts } from '../data-access/productsDataAccess';
import { datatableOptions } from '../utils/datatables';
import $ from 'jquery';
import { deleteProductMutation, DELETE_MUTATION_OPTIONS } from '../utils/mutations';
import { QUERY_OPTIONS } from '../utils/useQuery';
import Modal from '../components/Modal';
import ProductForm from '../forms/ProductForm';
import ProductDetailsModal from '../components/ProductDetailsModal'; // Modal para detalles del producto
import UploadImageModal from '../components/UploadImageModal'; // Modal para carga de imagen

const Products = () => {
    const { data: products, isLoading } = useQuery({
        ...QUERY_OPTIONS,
        queryKey: 'products',
        queryFn: readAllProducts
    });
    const [isShowingFormModal, setIsShowingFormModal] = useState(false); // Modal del formulario
    const [isShowingImageModal, setIsShowingImageModal] = useState(false); // Modal de carga de imagen
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedProductId, setSelectedProductId] = useState(null); // ID del producto para la imagen
    const [isShowingDetailsModal, setIsShowingDetailsModal] = useState(false); // Modal de detalles del producto
    const queryClient = useQueryClient();
    const tableRef = useRef();

    const deleteMutation = useMutation(deleteProductMutation, DELETE_MUTATION_OPTIONS);

    useEffect(() => {
        document.title = 'Orza - Productos';
        const table = $(tableRef.current).DataTable(datatableOptions);
        table.draw();
    }, [products]);

    async function onDeleteButtonClicked(id) {
        await deleteMutation.mutateAsync(id);
        queryClient.resetQueries();
    }

    const openImageModal = (productId) => {
        console.log('Abriendo modal de imagen para el producto con ID:', productId); // Debug
        setSelectedProductId(productId); // Establecer el ID del producto
        setIsShowingImageModal(true); // Abrir el modal de imagen
    };

    const closeImageModal = () => {
        console.log('Cerrando modal de imagen'); // Debug
        setSelectedProductId(null); // Limpiar el ID del producto
        setIsShowingImageModal(false); // Cerrar el modal de imagen
    };

    return (
        <>
            <NavigationTitle menu="Inicio" submenu="Productos" />
            {isLoading ? (
                'Loading...'
            ) : (
                <>
                    <button
                        type="button"
                        className="btn-registrar"
                        onClick={() => setIsShowingFormModal(true)}
                    >
                        <i className="fa-solid fa-plus"></i> Nuevo producto
                    </button>
                    <div className="contenedor-tabla">
                        <h3>Productos</h3>
                        <table ref={tableRef} className="table table-hover table-borderless">
                            <thead>
                                <tr>
                                    <th className="leading-row">Código</th>
                                    <th>Nombre</th>
                                    <th>Formato</th>
                                    <th>Precio de Venta</th>
                                    <th>Stock</th>
                                    <th>Estado</th>
                                    <th>Imagen</th>
                                    <th className="trailing-row">Opciones</th>
                                </tr>
                            </thead>
                            <tbody className="table-group-divider">
                                {products.map((product) => (
                                    <tr
                                        key={product.id}
                                        onClick={() => {
                                            setSelectedProduct(product);
                                            setIsShowingDetailsModal(true); // Mostrar el modal de detalles
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td className="leading-row">{product.codigo}</td>
                                        <td>{product.nombre}</td>
                                        <td>{product.formato}</td>
                                        <td>${product.precio_pieza_con_iva}</td>
                                        <td>{product.stock}</td>
                                        <td>{product.stock > 0 ? 'Disponible' : 'Agotado'}</td>
                                        <td>
                                            {product.id ? (
                                                <img
                                                    src={`http://localhost:8000/uploads/producto_${product.id}.png`}
                                                    alt={product.nombre}
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                'Sin imagen'
                                            )}
                                        </td>
                                        <td className="trailing-row">
                                            <button
                                                type="button"
                                                className="btn-opciones p-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedProduct(product);
                                                    setIsShowingFormModal(true); // Aquí es para editar el producto
                                                }}
                                            >
                                                <i className="fa-solid fa-pen-to-square"></i>
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-opciones p-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteButtonClicked(product.id);
                                                }}
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
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
