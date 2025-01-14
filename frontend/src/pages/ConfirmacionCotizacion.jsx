import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from 'react-query';
import { createCotizacion, downloadCotizacionPDF } from '../data-access/cotizacionesDataAccess';
import NavigationTitle from '../components/NavigationTitle';
import '../css/confirmacionCotizacion.css';

const ConfirmacionCotizacion = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { productos, granTotal, cotizacionId } = location.state || {};

    const mutation = useMutation(createCotizacion, {
        onSuccess: (data) => {
            alert('Cotización guardada con éxito');
            // Aquí puedes actualizar el estado local si es necesario
            console.log('ID de la cotización creada:', data.id);
        },
        onError: (error) => {
            console.error('Error al guardar la cotización:', error);
            alert('Hubo un error al guardar la cotización.');
        },
    });

    const handleGuardarCotizacion = () => {
        const cotizacion = {
            cliente: 'Nombre del Cliente',
            detalles: productos.map((producto) => ({
                producto_id: producto.producto.id,
                cantidad: producto.cantidad,
                precio_unitario: producto.producto.precio_pieza_con_iva * (1 + producto.ganancia / 100),
            })),
            total: granTotal,
        };

        mutation.mutate(cotizacion);
    };

    const handleDescargarPDF = async () => {
        try {
            if (!cotizacionId) {
                alert('Debe guardar la cotización antes de descargar el PDF.');
                return;
            }
            await downloadCotizacionPDF(cotizacionId);
        } catch (error) {
            alert('Hubo un error al descargar el PDF.');
        }
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
                <button className="btn btn-success" onClick={handleDescargarPDF}>
                    Descargar PDF
                </button>
            </div>
        </div>
    );
};

export default ConfirmacionCotizacion;
