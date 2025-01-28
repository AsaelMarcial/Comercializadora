import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import { readAllClientes } from '../data-access/clientesDataAccess';
import '../css/ganancias.css';

const GananciasPorProducto = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const carrito = location.state?.order || []; // Evita undefined para hooks

    const { data: clientes, isLoading: isLoadingClientes } = useQuery('clientes', readAllClientes);
    const [selectedCliente, setSelectedCliente] = useState(null);

    const [productosConGanancia, setProductosConGanancia] = useState(
        carrito.map((producto) => {
            const tipoPrecioInicial = producto.precio_pieza_sin_iva
                ? 'pieza'
                : producto.precio_caja_sin_iva
                ? 'caja'
                : producto.precio_m2_sin_iva
                ? 'm2'
                : null;

            const precioInicial =
                tipoPrecioInicial === 'pieza'
                    ? producto.precio_pieza_sin_iva
                    : tipoPrecioInicial === 'caja'
                    ? producto.precio_caja_sin_iva
                    : producto.precio_m2_sin_iva || 0;

            return {
                ...producto,
                producto: producto.producto || producto,
                ganancia: 0, // Porcentaje inicial de ganancia
                precioSeleccionado: precioInicial,
                tipoPrecio: tipoPrecioInicial, // Tipo de precio inicial
            };
        })
    );

    useEffect(() => {
        if (selectedCliente) {
            setProductosConGanancia((prevProductos) =>
                prevProductos.map((producto) => ({
                    ...producto,
                    ganancia: selectedCliente.descuento || 0, // Aplicar descuento del cliente
                }))
            );
        }
    }, [selectedCliente]);

    const formatPrice = (price) => (price ? `$${parseFloat(price).toFixed(2)}` : 'No disponible');

    const costoTotalBase = useMemo(() => {
        return productosConGanancia.reduce((total, producto) => {
            if (!producto.precioSeleccionado || isNaN(producto.precioSeleccionado)) return total;
            return total + producto.precioSeleccionado * producto.cantidad;
        }, 0);
    }, [productosConGanancia]);

    const totalGanancia = useMemo(() => {
        return productosConGanancia.reduce((total, producto) => {
            const gananciaUnitaria = (producto.precioSeleccionado * producto.ganancia) / 100;
            return total + gananciaUnitaria * producto.cantidad;
        }, 0);
    }, [productosConGanancia]);

    const granTotal = useMemo(() => {
        return costoTotalBase + totalGanancia;
    }, [costoTotalBase, totalGanancia]);

    const actualizarGanancia = (id, nuevoValor) => {
        setProductosConGanancia((prev) =>
            prev.map((producto) =>
                producto.producto?.id === id
                    ? { ...producto, ganancia: parseFloat(nuevoValor) || 0 }
                    : producto
            )
        );
    };

    const actualizarPrecioSeleccionado = (id, nuevoTipoPrecio) => {
        setProductosConGanancia((prev) =>
            prev.map((producto) => {
                if (producto.producto?.id === id) {
                    let nuevoPrecio = 0;
                    switch (nuevoTipoPrecio) {
                        case 'caja':
                            nuevoPrecio = producto.producto?.precio_caja_sin_iva || 0;
                            break;
                        case 'pieza':
                            nuevoPrecio = producto.producto?.precio_pieza_sin_iva || 0;
                            break;
                        case 'm2':
                            nuevoPrecio = producto.producto?.precio_m2_sin_iva || 0;
                            break;
                        default:
                            nuevoPrecio = producto.producto?.precio_pieza_sin_iva || 0;
                    }
                    return {
                        ...producto,
                        precioSeleccionado: nuevoPrecio,
                        tipoPrecio: nuevoTipoPrecio,
                    };
                }
                return producto;
            })
        );
    };

    const continuarConCotizacion = () => {
        if (!selectedCliente) {
            alert('Debes seleccionar un cliente para continuar.');
            return;
        }

        const productosConTipoValido = productosConGanancia.every(
            (producto) => producto.tipoPrecio !== null
        );

        if (!productosConTipoValido) {
            alert(
                'Uno o más productos no tienen un tipo de precio válido seleccionado. Verifica y selecciona un precio.'
            );
            return;
        }

        navigate('/app/ventas/confirmacion', {
            state: {
                productos: productosConGanancia,
                granTotal: granTotal,
                cliente: selectedCliente, // Asegúrate de pasar esta información
            },
        });
    };

    return (
        <div className="contenedor-ganancias">
            <NavigationTitle menu="Ventas" submenu="Definir Ganancias por Producto" />

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="cliente-select" style={{ fontWeight: 'bold' }}>
                    Seleccionar Cliente:
                </label>
                {isLoadingClientes ? (
                    <p>Cargando clientes...</p>
                ) : (
                    <select
                        id="cliente-select"
                        value={selectedCliente?.id || ''}
                        onChange={(e) =>
                            setSelectedCliente(
                                clientes.find((cliente) => cliente.id === parseInt(e.target.value))
                            )
                        }
                        className="form-select"
                    >
                        <option value="" disabled>
                            -- Seleccione un cliente --
                        </option>
                        {clientes.map((cliente) => (
                            <option key={cliente.id} value={cliente.id}>
                                {cliente.nombre} - {cliente.proyecto} - {cliente.direccion}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {selectedCliente && (
                <div style={{ marginBottom: '1rem', fontStyle: 'italic' }}>
                    <strong>Cliente Seleccionado:</strong> {selectedCliente.nombre} -{' '}
                    {selectedCliente.direccion}
                </div>
            )}

            <div className="tabla-ganancias">
                <h3>Productos Seleccionados</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Imagen</th>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Base</th>
                            <th>Tipo de Precio</th>
                            <th>Ganancia (%)</th>
                            <th>Precio Final</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosConGanancia.map((producto, index) => {
                            const precioFinal =
                                producto.precioSeleccionado * (1 + producto.ganancia / 100);

                            return (
                                <tr key={producto.producto?.id || `producto-${index}`}>
                                    <td>
                                        <img
                                            src={`http://147.93.47.106:8000/uploads/producto_${producto.producto?.id}.jpeg`}
                                            alt={producto.producto?.nombre || 'Sin nombre'}
                                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.src = '';
                                                e.target.alt = 'Sin imagen';
                                            }}
                                        />
                                    </td>
                                    <td>{producto.producto?.nombre || 'Sin nombre'}</td>
                                    <td>{producto.cantidad}</td>
                                    <td>{formatPrice(producto.precioSeleccionado)}</td>
                                    <td>
                                        <select
                                            value={producto.tipoPrecio}
                                            onChange={(e) =>
                                                actualizarPrecioSeleccionado(
                                                    producto.producto?.id,
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                !producto.producto?.precio_pieza_sin_iva &&
                                                !producto.producto?.precio_caja_sin_iva &&
                                                !producto.producto?.precio_m2_sin_iva
                                            }
                                        >
                                            {producto.producto?.precio_pieza_sin_iva && (
                                                <option value="pieza">Por Pieza</option>
                                            )}
                                            {producto.producto?.precio_caja_sin_iva && (
                                                <option value="caja">Por Caja</option>
                                            )}
                                            {producto.producto?.precio_m2_sin_iva && (
                                                <option value="m2">Por M2</option>
                                            )}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            value={producto.ganancia}
                                            onChange={(e) =>
                                                actualizarGanancia(producto.producto?.id, e.target.value)
                                            }
                                            style={{ width: '60px' }}
                                        />
                                    </td>
                                    <td>{formatPrice(precioFinal * producto.cantidad)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="resumen-ganancias">
                <h4>Costo Total Base: {formatPrice(costoTotalBase)}</h4>
                <h4>Total Ganancia: {formatPrice(totalGanancia)}</h4>
                <h4>Gran Total: {formatPrice(granTotal)}</h4>
                <div className="botones-acciones">
                    <button className="btn btn-danger" onClick={() => navigate('/app/ventas')}>
                        Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={continuarConCotizacion}>
                        Continuar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GananciasPorProducto;
