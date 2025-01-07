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
import ProductDetailsModal from '../components/ProductDetailsModal'; // Importa el nuevo componente

const Products = () => {
    const { data: products, isLoading } = useQuery({
        ...QUERY_OPTIONS,
        queryKey: 'products',
        queryFn: readAllProducts
    });
    const [isShowingModal, setIsShowingModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isShowingDetailsModal, setIsShowingDetailsModal] = useState(false); // Nuevo estado para modal de detalles
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
                        onClick={() => setIsShowingModal(true)}
                    >
                        <i className="fa-solid fa-plus"></i> Nuevo producto
                    </button>
                    <div className="contenedor-tabla">
                        <h3>Productos</h3>
                        <table ref={tableRef} className="table table-hover table-borderless">
                            <thead>
                                <tr>
                                    <th className="leading-row">Nombre</th>
                                    <th>Precio de Compra</th>
                                    <th>Precio de Venta</th>
                                    <th>Precio Preferencial</th>
                                    <th>Stock</th>
                                    <th>Tipo</th>
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
                                        <td className="leading-row">{product.nombre}</td>
                                        <td>${product.formato}</td>
                                        <td>${product.unidad_venta}</td>
                                        <td>${product.precioPreferencial}</td>
                                        <td>{product.stock}</td>
                                        <td>{product.tipo}</td>
                                        <td className="trailing-row">
                                            <button
                                                type="button"
                                                className="btn-opciones p-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedProduct(product);
                                                    setIsShowingModal(true); // Aquí es para editar el producto
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
                isShowing={isShowingModal}
                setIsShowing={setIsShowingModal}
                onClose={() => {
                    setSelectedProduct(null);
                    setIsShowingModal(false);
                }}
            >
                <ProductForm
                    cancelAction={() => {
                        setSelectedProduct(null);
                        setIsShowingModal(false);
                    }}
                    productUpdate={selectedProduct}
                />
            </Modal>
        </>
    );
};

export default Products;