import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from 'react-query';
import { createCotizacion } from '../data-access/cotizacionesDataAccess';
import NavigationTitle from '../components/NavigationTitle';
import { toast } from 'react-toastify';
import '../css/confirmacionCotizacion.css';

const ConfirmacionCotizacion = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { productos, granTotal } = location.state || {};

    // Manejo de la mutación para guardar la cotización
    const mutation = useMutation(createCotizacion, {
        onSuccess: (data) => {
            toast.success('Cotización guardada con éxito');
            navigate(`/home`); // Cambiar a la URL final cuando se defina
        },
        onError: (error) => {
            console.error('Error al guardar la cotización:', error);
            toast.error('Hubo un error al guardar la cotización.');
        },
    });

    // Validar que los datos necesarios estén presentes
    if (!productos || !granTotal) {
        return <p>Datos incompletos. Por favor, vuelve a intentarlo.</p>;
    }

    // Manejo del guardado de la cotización
    const handleGuardarCotizacion = () => {
        const cotizacion = {
            cliente: 'Nombre del Cliente', // Esto podría ser dinámico en el futuro
            detalles: productos.map((producto) => ({
                producto_id: producto.producto.id,
                cantidad: producto.cantidad,
                precio_unitario: parseFloat(
                    (producto.producto.precio_pieza_con_iva * (1 + producto.ganancia / 100)).toFixed(2)
                ),
            })),
            total: parseFloat(granTotal.toFixed(2)), // Asegurarse de redondear el total
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
                            const precioUnitario =
                                producto.producto.precio_pieza_con_iva * (1 + producto.ganancia / 100);
                            const totalProducto = precioUnitario * producto.cantidad;

                            return (
                                <tr key={producto.producto.id}>
                                    <td>{producto.producto.nombre}</td>
                                    <td>{producto.cantidad}</td>
                                    <td>${precioUnitario.toFixed(2)}</td>
                                    <td>${totalProducto.toFixed(2)}</td>
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
            </div>
        </div>
    );
};

export default ConfirmacionCotizacion;
