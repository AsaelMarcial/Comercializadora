import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from 'react-query';
import { createCotizacion } from '../data-access/cotizacionesDataAccess';
import NavigationTitle from '../components/NavigationTitle';
import { toast } from 'react-toastify';
import '../css/confirmacionCotizacion.css';

const ConfirmacionCotizacion = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { productos, granTotal: totalSinIva } = location.state || {};
    const [costoEnvio, setCostoEnvio] = useState(0);

    const mutation = useMutation(createCotizacion, {
        onSuccess: () => {
            toast.success('Cotización guardada con éxito');
            navigate(`/app/ventas/cotizaciones`);
        },
        onError: (error) => {
            console.error('Error al guardar la cotización:', error);
            toast.error('Hubo un error al guardar la cotización.');
        },
    });

    if (!productos || !totalSinIva) {
        return <p>Datos incompletos. Por favor, vuelve a intentarlo.</p>;
    }

    const totalConEnvio = parseFloat(totalSinIva) + parseFloat(costoEnvio || 0);
    const iva = totalConEnvio * 0.16;
    const granTotalConIva = totalConEnvio + iva;

    const handleGuardarCotizacion = () => {
        const cotizacion = {
            cliente: 'Nombre del Cliente',
            detalles: productos.map((producto) => ({
                producto_id: producto.producto.id,
                cantidad: producto.cantidad,
                precio_unitario: parseFloat(
                    (producto.precioSeleccionado * (1 + producto.ganancia / 100)).toFixed(2)
                ),
                tipo_variante: producto.tipoPrecio,
            })),
            total: parseFloat(granTotalConIva.toFixed(2)),
        };

        mutation.mutate(cotizacion);
    };

    return (
        <div className="confirmacion-cotizacion">
            <NavigationTitle menu="Ventas" submenu="Confirmación de Cotización" />
            <div className="detalle-cotizacion">
                <h3>Detalle de la Cotización</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Variante</th>
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map((producto) => {
                            const precioUnitario =
                                producto.precioSeleccionado * (1 + producto.ganancia / 100);
                            const totalProducto = precioUnitario * producto.cantidad;

                            return (
                                <tr key={producto.producto.id}>
                                    <td>{producto.producto.nombre}</td>
                                    <td>{producto.tipoPrecio || 'No especificado'}</td>
                                    <td>{producto.cantidad}</td>
                                    <td>${precioUnitario.toFixed(2)}</td>
                                    <td>${totalProducto.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                        <tr>
                            <td colSpan="4"><strong>Costo de Envío:</strong></td>
                            <td>
                                <input
                                    type="number"
                                    value={costoEnvio}
                                    onChange={(e) => setCostoEnvio(e.target.value)}
                                    style={{ width: '100px' }}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="4"><strong>Subtotal (con envío):</strong></td>
                            <td>${totalConEnvio.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colSpan="4"><strong>IVA (16%):</strong></td>
                            <td>${iva.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colSpan="4"><strong>Gran Total:</strong></td>
                            <td>${granTotalConIva.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="acciones-cotizacion">
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/app/ventas/ganancias')}
                >
                    Volver
                </button>
                <button className="btn btn-primary" onClick={handleGuardarCotizacion}>
                    Guardar Cotización
                </button>
            </div>
        </div>
    );
};

export default ConfirmacionCotizacion;
