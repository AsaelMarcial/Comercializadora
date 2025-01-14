import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import NavigationTitle from '../components/NavigationTitle';
import { readAllProducts } from '../data-access/productsDataAccess';
import { QUERY_OPTIONS } from '../utils/useQuery';
import Modal from '../components/Modal';
import '../css/menu.css';
import '../utils/formatting';

const Ventas = () => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [order, setOrder] = useState([]);
    const { data: products, isLoading } = useQuery({
        ...QUERY_OPTIONS,
        queryKey: 'products',
        queryFn: readAllProducts,
    });
    const navigate = useNavigate();

    const total = useMemo(() => {
        return order.reduce(
            (total, actual) => total + actual.cantidad * actual.producto.precio_pieza_con_iva,
            0
        );
    }, [order]);

    const addToOrder = (producto) => {
        let found = order.find((orderItem) => orderItem.producto.id === producto.id);
        if (!found) {
            setOrder((prevOrder) => [
                ...prevOrder,
                {
                    producto,
                    cantidad: 1,
                },
            ]);
            return;
        }
        setOrder((prevOrder) => {
            let newOrder = prevOrder.filter((orderItem) => orderItem !== found);
            newOrder.push({
                ...found,
                cantidad: found.cantidad + 1,
            });
            return newOrder;
        });
    };

    const removeFromOrder = (producto) => {
        let found = order.find((orderItem) => orderItem.producto.id === producto.id);
        if (!found) return;
        setOrder((prevOrder) => {
            let newOrder = prevOrder.filter((orderItem) => orderItem !== found);
            if (found.cantidad > 1) {
                newOrder.push({
                    ...found,
                    cantidad: found.cantidad - 1,
                });
            }
            return newOrder;
        });
    };

    const handleContinue = () => {
        if (order.length === 0) {
            alert('No hay productos en el carrito. Agrega al menos uno para continuar.');
            return;
        }
        navigate('/app/ventas/ganancias', { state: { order } });
    };

    return (
        <div className="ventas-container">
            <NavigationTitle menu="Inicio" submenu="Ventas" />
            <div className="ventas-main">
                {/* Contenedor de productos */}
                <div className="products-list">
                    {isLoading ? (
                        'Loading...'
                    ) : (
                        products.map((product) => (
                            <div
                                key={product.id}
                                className="menu-item"
                                onClick={() => setSelectedProduct(product)}
                            >
                                <img
                                    className="menu-item-image"
                                    src={`http://localhost:8000/uploads/producto_${product.id}.jpeg`}
                                    alt={product.nombre}
                                    onError={(e) => {
                                        e.target.src = '';
                                        e.target.alt = 'Sin imagen';
                                    }}
                                />
                                <div className="menu-item-content">
                                    <p className="menu-item-nombre">{product.nombre}</p>
                                    <p className="menu-item-precio">
                                        ${product.precio_caja_sin_iva.toFixed(2)}
                                    </p>
                                </div>
                                <div className="stepper-container">
                                    <i
                                        className="fa-solid fa-minus stepper-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromOrder(product);
                                        }}
                                    ></i>
                                    <div className="stepper-count">
                                        {
                                            order.find((orderItem) => orderItem.producto.id === product.id)?.cantidad ||
                                            0
                                        }
                                    </div>
                                    <i
                                        className="fa-solid fa-plus stepper-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToOrder(product);
                                        }}
                                    ></i>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Carrito */}
                <div className="order-summary">
                    <h4>Carrito</h4>
                    <div className="table-productos">
                        {order.length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <td>Cantidad</td>
                                        <td>Producto</td>
                                        <td>Subtotal</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.map((orderItem) => (
                                        <tr key={orderItem.producto.id}>
                                            <td>{orderItem.cantidad}</td>
                                            <td>{orderItem.producto.nombre}</td>
                                            <td>
                                                ${(
                                                    orderItem.producto.precio_pieza_con_iva *
                                                    orderItem.cantidad
                                                ).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td></td>
                                        <td>Total</td>
                                        <td>${total.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        ) : (
                            <p>No hay productos en el carrito.</p>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => setOrder([])}
                        >
                            Vaciar Carrito
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleContinue}
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal para mostrar detalles del producto */}
            {selectedProduct && (
                <Modal
                    title={`Detalles del Producto - ${selectedProduct.nombre}`}
                    isShowing={!!selectedProduct}
                    setIsShowing={() => setSelectedProduct(null)}
                >
                    <div className="product-details">
                        <img
                            src={`http://localhost:8000/uploads/producto_${selectedProduct.id}.jpeg`}
                            alt={selectedProduct.nombre}
                            onError={(e) => {
                                e.target.src = '';
                                e.target.alt = 'Sin imagen';
                            }}
                            style={{ width: '100%', height: 'auto', marginBottom: '1rem' }}
                        />
                        <p><strong>Código:</strong> {selectedProduct.codigo}</p>
                        <p><strong>Nombre:</strong> {selectedProduct.nombre}</p>
                        <p><strong>Precio Caja (IVA):</strong> ${selectedProduct.precio_caja_con_iva}</p>
                        <p><strong>Precio Pieza (IVA):</strong> ${selectedProduct.precio_pieza_con_iva}</p>
                        <p><strong>Precio M2 (IVA):</strong> ${selectedProduct.precio_m2_con_iva}</p>
                        <p><strong>Color:</strong> {selectedProduct.color}</p>
                        <p><strong>Material:</strong> {selectedProduct.material}</p>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Ventas;
