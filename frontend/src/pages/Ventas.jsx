import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import NavigationTitle from '../components/NavigationTitle';
import { readAllProducts } from '../data-access/productsDataAccess';
import { QUERY_OPTIONS } from '../utils/useQuery';
import $ from 'jquery';
import '../css/ventas.css';
import ProductDetailsModal from '../components/ProductDetailsModal';

const Ventas = () => {
    const [order, setOrder] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const { data: products, isLoading } = useQuery({
        ...QUERY_OPTIONS,
        queryKey: 'products',
        queryFn: readAllProducts,
    });
    const tableRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (products) {
            const table = $(tableRef.current).DataTable({
                destroy: true, // Limpia la tabla existente
                data: products,
                columns: [
                    { data: 'codigo', title: 'Código' },
                    { data: 'nombre', title: 'Nombre' },
                    { data: 'formato', title: 'Formato' },
                    { data: 'color', title: 'Color' },
                    { data: 'proveedor_nombre', title: 'Proveedor' },
                    {
                        data: 'id',
                        title: 'Imagen',
                        render: (data, type, row) =>
                            `<img src="http://localhost:8000/uploads/producto_${data}.jpeg" alt="${row.nombre}" style="width: 50px; height: 50px; object-fit: cover;" onerror="this.src='';" />`,
                    },
                    {
                        data: null,
                        title: 'Acciones',
                        render: () =>
                            `<button class="btn btn-primary agregar-carrito">Agregar</button>`,
                    },
                ],
            });

            // Manejo de clics en botones de agregar al carrito
            $(tableRef.current).on('click', '.agregar-carrito', function () {
                const rowData = table.row($(this).parents('tr')).data();
                addToOrder(rowData);
            });

            // Manejo de clics en las filas para abrir modal de detalles
            $(tableRef.current).on('click', 'tbody tr', function (e) {
                if (!$(e.target).hasClass('agregar-carrito')) {
                    const rowData = table.row(this).data();
                    setSelectedProduct(rowData);
                }
            });

            return () => {
                table.destroy(); // Limpia la tabla al desmontar el componente
            };
        }
    }, [products]);

    const addToOrder = (producto) => {
        setOrder((prevOrder) => {
            const found = prevOrder.find((item) => item.id === producto.id);
            if (found) {
                return prevOrder.map((item) =>
                    item.id === producto.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }
            return [...prevOrder, { ...producto, cantidad: 1 }];
        });
    };

    const removeFromOrder = (producto) => {
        setOrder((prevOrder) =>
            prevOrder.filter((item) => item.id !== producto.id)
        );
    };

    const updateQuantity = (producto, cantidad) => {
        setOrder((prevOrder) =>
            prevOrder.map((item) =>
                item.id === producto.id ? { ...item, cantidad: parseInt(cantidad) } : item
            )
        );
    };

    const handleContinue = () => {
        if (order.length === 0) {
            alert('El carrito está vacío. Agrega productos para continuar.');
            return;
        }
        console.log('Estado del carrito antes de navegar:', order);
        navigate('/app/ventas/ganancias', { state: { order } });
    };

    return (
        <div className="ventas-container">
            <NavigationTitle menu="Inicio" submenu="Ventas" />

            <div className="ventas-main">
                {/* Contenedor de productos */}
                <div className="products-list-container">
                    <h3>Productos</h3>
                    <table ref={tableRef} className="products-table"></table>
                </div>

                {/* Carrito */}
                <div className="cart-container">
                    <h4>Carrito</h4>
                    {order.length > 0 ? (
                        <table className="cart-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.nombre}</td>
                                        <td>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.cantidad}
                                                onChange={(e) =>
                                                    updateQuantity(item, e.target.value)
                                                }
                                            />
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => removeFromOrder(item)}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No hay productos en el carrito.</p>
                    )}

                    <div className="cart-actions">
                        <button
                            className="btn btn-danger"
                            onClick={() => setOrder([])}
                        >
                            Vaciar Carrito
                        </button>
                        <button
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
                <ProductDetailsModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
        </div>
    );
};

export default Ventas;
