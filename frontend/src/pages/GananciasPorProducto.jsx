import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavigationTitle from '../components/NavigationTitle';
import '../css/ganancias.css';

const GananciasPorProducto = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const carrito = location.state?.order || []; // Evita undefined para hooks

    // Si el carrito está vacío, se maneja al final del render.
    const [productosConGanancia, setProductosConGanancia] = useState(
        carrito.map((producto) => ({
            ...producto,
            producto: producto.producto || producto, // Asegura que siempre hay un objeto `producto`
            ganancia: 0, // Porcentaje inicial de ganancia
            precioSeleccionado: producto.precio_pieza_sin_iva || 0, // Manejo de valor predeterminado
            tipoPrecio: 'pieza', // Tipo de precio seleccionado (pieza, caja, m2)
        }))
    );

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
                    let nuevoPrecio;
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
                    return { ...producto, precioSeleccionado: nuevoPrecio, tipoPrecio: nuevoTipoPrecio };
                }
                return producto;
            })
        );
    };

    const continuarConCotizacion = () => {
        console.log('Productos finales:', productosConGanancia);
        navigate('/app/ventas/confirmacion', { state: { productos: productosConGanancia, granTotal } });
    };

    // Renderiza un mensaje si el carrito está vacío, pero no condiciona los hooks.
    if (!carrito.length) {
        return (
            <div className="contenedor-ganancias">
                <NavigationTitle menu="Ventas" submenu="Definir Ganancias por Producto" />
                <p>El carrito está vacío. Redirigiendo a ventas...</p>
            </div>
        );
    }

    return (
        <div className="contenedor-ganancias">
            <NavigationTitle menu="Ventas" submenu="Definir Ganancias por Producto" />

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
                                            src={`http://localhost:8000/uploads/producto_${producto.producto?.id}.jpeg`}
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
                                    <td>${producto.precioSeleccionado?.toFixed(2) || 'No disponible'}</td>
                                    <td>
                                        <select
                                            value={producto.tipoPrecio}
                                            onChange={(e) =>
                                                actualizarPrecioSeleccionado(
                                                    producto.producto?.id,
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="pieza">Por Pieza</option>
                                            <option value="caja">Por Caja</option>
                                            <option value="m2">Por M2</option>
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            value={producto.ganancia}
                                            onChange={(e) =>
                                                actualizarGanancia(
                                                    producto.producto?.id,
                                                    e.target.value
                                                )
                                            }
                                            style={{ width: '60px' }}
                                        />
                                    </td>
                                    <td>${(precioFinal * producto.cantidad).toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="resumen-ganancias">
                <h4>Costo Total Base: ${costoTotalBase.toFixed(2)}</h4>
                <h4>Total Ganancia: ${totalGanancia.toFixed(2)}</h4>
                <h4>Gran Total: ${granTotal.toFixed(2)}</h4>
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
