import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from 'react-query';
import { createCotizacion } from '../data-access/cotizacionesDataAccess';
import NavigationTitle from '../components/NavigationTitle';
import '../css/confirmacionCotizacion.css';

const ConfirmacionCotizacion = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { productos, granTotal } = location.state || {};

    // Mutación para guardar la cotización
    const mutation = useMutation(createCotizacion, {
        onSuccess: () => {
            alert('Cotización guardada con éxito');
            navigate('/app/ventas/cotizaciones'); // Redirige al listado de cotizaciones
        },
        onError: (error) => {
            console.error('Error al guardar la cotización:', error);
            alert('Hubo un error al guardar la cotización.');
        },
    });

    // Manejar el guardado de la cotización
    const handleGuardarCotizacion = () => {
        const cotizacion = {
            cliente: 'Nombre del Cliente', // Reemplazar con el cliente real si está disponible
            detalles: productos.map((producto) => ({
                producto_id: producto.producto.id,
                cantidad: producto.cantidad,
                precio_unitario: parseFloat(
                    (producto.producto.precio_pieza_con_iva * (1 + producto.ganancia / 100)).toFixed(2)
                ),
            })),
            total: parseFloat(granTotal.toFixed(2)), // Redondear el total a dos decimales
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
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map((producto) => {
                            const precioUnitario = parseFloat(
                                (producto.producto.precio_pieza_con_iva * (1 + producto.ganancia / 100)).toFixed(2)
                            );
                            const totalProducto = parseFloat((precioUnitario * producto.cantidad).toFixed(2));

                            return (
                                <tr key={producto.producto.id}>
                                    <td>{producto.producto.nombre}</td>
                                    <td>{producto.cantidad}</td>
                                    <td>${precioUnitario}</td>
                                    <td>${totalProducto}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <h4>Total: ${granTotal.toFixed(2)}</h4>
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
                <button className="btn btn-success" disabled>
                    Descargar PDF
                </button>
            </div>
        </div>
    );
};

export default ConfirmacionCotizacion;
