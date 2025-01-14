import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavigationTitle from '../components/NavigationTitle';
import '../css/ganancias.css';

const GananciasPorProducto = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const carrito = location.state?.order || []; // Evita undefined para hooks

    // Hooks deben estar fuera de condiciones
    const [productosConGanancia, setProductosConGanancia] = useState(
        carrito.map((producto) => ({
            ...producto,
            ganancia: 0, // Porcentaje inicial de ganancia
        }))
    );

    const costoTotalBase = useMemo(() => {
        return productosConGanancia.reduce((total, producto) => {
            return total + producto.producto.precio_pieza_con_iva * producto.cantidad;
        }, 0);
    }, [productosConGanancia]);

    const totalGanancia = useMemo(() => {
        return productosConGanancia.reduce((total, producto) => {
            const gananciaUnitaria = (producto.producto.precio_pieza_con_iva * producto.ganancia) / 100;
            return total + gananciaUnitaria * producto.cantidad;
        }, 0);
    }, [productosConGanancia]);

    const granTotal = useMemo(() => {
        return costoTotalBase + totalGanancia;
    }, [costoTotalBase, totalGanancia]);

    const actualizarGanancia = (id, nuevoValor) => {
        setProductosConGanancia((prev) =>
            prev.map((producto) =>
                producto.producto.id === id
                    ? { ...producto, ganancia: parseFloat(nuevoValor) || 0 }
                    : producto
            )
        );
    };

    const continuarConCotizacion = () => {
        console.log('Productos finales:', productosConGanancia);
        navigate('/app/ventas/confirmacion', { state: { productos: productosConGanancia, granTotal } });
    };

    // Manejo del caso cuando no hay productos en el carrito
    if (carrito.length === 0) {
        navigate('/app/ventas');
        return null; // Evita el renderizado en caso de redirección
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
                            <th>Ganancia (%)</th>
                            <th>Precio Final</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosConGanancia.map((producto) => {
                            const precioFinal =
                                producto.producto.precio_m2_sin_iva * (1 + producto.ganancia / 100);

                            return (
                                <tr key={producto.producto.id}>
                                    <td>
                                        <img
                                            src={`http://localhost:8000/uploads/producto_${producto.producto.id}.jpeg`}
                                            alt={producto.producto.nombre}
                                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                        />
                                    </td>
                                    <td>{producto.producto.nombre}</td>
                                    <td>{producto.cantidad}</td>
                                    <td>${producto.producto.precio_m2_sin_iva.toFixed(2)}</td>
                                    <td>
                                        <input
                                            type="number"
                                            value={producto.ganancia}
                                            onChange={(e) =>
                                                actualizarGanancia(
                                                    producto.producto.id,
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
