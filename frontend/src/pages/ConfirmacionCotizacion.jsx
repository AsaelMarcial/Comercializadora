import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import NavigationTitle from '../components/NavigationTitle';
import { createCotizacion } from '../data-access/cotizacionesDataAccess';
import { readSucursalesByCliente } from '../data-access/sucursalesDataAccess';
import '../css/confirmacionCotizacion.css';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
});

const formatCurrency = (value) => currencyFormatter.format(Number.isFinite(value) ? value : 0);

const shippingOptions = [
    { value: 'Servicio completo', label: 'Servicio completo' },
    { value: 'Paquetería', label: 'Paquetería' },
    { value: 'Recoger personalmente', label: 'Recoger personalmente' },
];

const normalizeSucursales = (sucursales) => {
    if (!Array.isArray(sucursales)) return [];

    return sucursales
        .filter(Boolean)
        .map((sucursal) => {
            if (typeof sucursal === 'string') {
                return { id: null, nombre: sucursal };
            }

            const nombre = sucursal.nombre ?? sucursal.label ?? sucursal.direccion ?? '';

            return {
                id: sucursal.id ?? sucursal.sucursal_id ?? null,
                nombre,
            };
        })
        .filter((sucursal) => sucursal.nombre);
};

const ConfirmacionCotizacion = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state;
    const productos = useMemo(
        () => locationState?.productos ?? [],
        [locationState]
    );
    const totalSinIva = useMemo(
        () => parseFloat(locationState?.granTotal) || 0,
        [locationState]
    );
    const cliente = locationState?.cliente;
    const proyectoSeleccionado = locationState?.proyectoSeleccionado || null;
    const initialSucursales = normalizeSucursales(locationState?.sucursales || cliente?.sucursales || []);

    const [shippingCosts, setShippingCosts] = useState({
        'Servicio completo': '0',
        Paquetería: '0',
        'Recoger personalmente': '0',
    });
    const [varianteEnvio, setVarianteEnvio] = useState(shippingOptions[0].value);
    const [sucursalesDisponibles, setSucursalesDisponibles] = useState(initialSucursales);
    const [sucursalRecogidaId, setSucursalRecogidaId] = useState(null);
    const [sucursalRecogidaNombre, setSucursalRecogidaNombre] = useState('');

    const mutation = useMutation(createCotizacion, {
        onSuccess: () => {
            toast.success('Cotización guardada con éxito');
            navigate('/app/ventas/cotizaciones');
        },
        onError: (error) => {
            console.error('Error al guardar la cotización:', error);
            toast.error('Hubo un error al guardar la cotización.');
        },
    });

    useEffect(() => {
        const fetchSucursales = async () => {
            if (!cliente?.id) return;

            try {
                const sucursales = await readSucursalesByCliente(cliente.id);
                const sucursalesList = normalizeSucursales(Array.isArray(sucursales?.data) ? sucursales.data : sucursales);

                setSucursalesDisponibles(sucursalesList);

                if (sucursalesList.length > 0 && !sucursalRecogidaNombre) {
                    setSucursalRecogidaId(sucursalesList[0].id ?? null);
                    setSucursalRecogidaNombre(sucursalesList[0].nombre ?? '');
                }
            } catch (error) {
                console.error('Error al obtener sucursales del cliente:', error);
            }
        };

        fetchSucursales();
    }, [cliente?.id]);

    useEffect(() => {
        if (
            varianteEnvio === 'Recoger personalmente' &&
            sucursalesDisponibles.length > 0 &&
            !sucursalRecogidaNombre
        ) {
            const primeraSucursal = sucursalesDisponibles[0];
            setSucursalRecogidaId(primeraSucursal.id ?? null);
            setSucursalRecogidaNombre(primeraSucursal.nombre ?? '');
        }
    }, [sucursalesDisponibles, sucursalRecogidaNombre, varianteEnvio]);

    const totalProductos = useMemo(
        () =>
            productos.reduce((total, producto) => total + (parseFloat(producto.cantidad) || 0), 0),
        [productos]
    );

    const costoEnvioSeleccionado = shippingCosts[varianteEnvio] ?? '0';
    const envio = useMemo(
        () => Math.max(0, parseFloat(costoEnvioSeleccionado) || 0),
        [costoEnvioSeleccionado]
    );
    const totalConEnvio = useMemo(() => totalSinIva + envio, [envio, totalSinIva]);
    const iva = useMemo(() => totalConEnvio * 0.16, [totalConEnvio]);
    const granTotalConIva = useMemo(() => totalConEnvio + iva, [iva, totalConEnvio]);
    const selectedSucursalValue = sucursalRecogidaId != null ? String(sucursalRecogidaId) : sucursalRecogidaNombre;

    const handleCostoEnvioChange = (event) => {
        const { value } = event.target;
        if (Number(value) < 0) {
            return;
        }
        setShippingCosts((prev) => ({
            ...prev,
            [varianteEnvio]: value,
        }));
    };

    const handleSucursalChange = (event) => {
        const { value } = event.target;

        if (sucursalesDisponibles.length === 0) {
            setSucursalRecogidaId(null);
            setSucursalRecogidaNombre(value);
            return;
        }

        const selectedSucursal = sucursalesDisponibles.find(
            (sucursal) => String(sucursal.id ?? sucursal.nombre ?? '') === value
        );

        setSucursalRecogidaId(selectedSucursal?.id ?? null);
        setSucursalRecogidaNombre(selectedSucursal?.nombre ?? '');
    };

    const handleGuardarCotizacion = (event) => {
        event.preventDefault();

        if (varianteEnvio === 'Recoger personalmente' && !sucursalRecogidaNombre.trim()) {
            toast.error('Selecciona o escribe la sucursal de recolección.');
            return;
        }

        const proyectoId =
            proyectoSeleccionado?.proyectoId || proyectoSeleccionado?.id || cliente?.proyecto_id || null;

        const cotizacion = {
            cliente: cliente?.nombre,
            costo_envio: envio,
            cliente_id: cliente?.id,
            detalles: productos.map((producto) => {
                const precioBase = producto.precioSeleccionado || 0;
                const ganancia = producto.ganancia || 0;
                const precioUnitario = parseFloat((precioBase * (1 + ganancia / 100)).toFixed(2));

                return {
                    producto_id: producto.producto.id,
                    nombre: producto.producto.nombre,
                    cantidad: producto.cantidad,
                    precio_unitario: precioUnitario,
                    tipo_variante: producto.tipoPrecio,
                };
            }),
            total: parseFloat(granTotalConIva.toFixed(2)),
            variante_envio: varianteEnvio,
            costos_envio: shippingCosts,
            sucursal_id: varianteEnvio === 'Recoger personalmente' ? sucursalRecogidaId : null,
            sucursal_recoleccion:
                varianteEnvio === 'Recoger personalmente' ? sucursalRecogidaNombre.trim() : null,
        };

        if (proyectoId) {
            cotizacion.proyecto_id = proyectoId;
        }

        mutation.mutate(cotizacion);
    };

    const regresarAGanancias = () => {
        navigate('/app/ventas/ganancias');
    };

    if (!productos.length || !cliente) {
        return (
            <div className="quote-confirmation quote-confirmation--empty">
                <NavigationTitle menu="Ventas" submenu="Confirmación de Cotización" />
                <section className="quote-confirmation__empty-card">
                    <h2>Faltan datos para mostrar la cotización</h2>
                    <p>
                        No encontramos la información necesaria para mostrar el resumen de la cotización.
                        Vuelve al paso anterior y selecciona nuevamente los productos y el cliente.
                    </p>
                    <button type="button" className="btn btn-primary" onClick={regresarAGanancias}>
                        Volver a configurar la cotización
                    </button>
                </section>
            </div>
        );
    }

    return (
        <div className="quote-confirmation">
            <NavigationTitle menu="Ventas" submenu="Confirmación de Cotización" />

            <section className="quote-confirmation__hero" aria-labelledby="quote-confirmation-title">
                <div className="quote-confirmation__hero-copy">
                    <p className="quote-confirmation__eyebrow">Revisa y confirma</p>
                    <h1 className="quote-confirmation__title" id="quote-confirmation-title">
                        Último paso para completar tu cotización
                    </h1>
                    <p className="quote-confirmation__subtitle">
                        Verifica la información del cliente, ajusta los detalles del envío y confirma el
                        total antes de guardar.
                    </p>
                    <div className="quote-confirmation__chips" role="list" aria-label="Resumen rápido">
                        <span className="quote-confirmation__chip" role="listitem">
                            {productos.length} producto{productos.length === 1 ? '' : 's'} incluidos
                        </span>
                        <span className="quote-confirmation__chip" role="listitem">
                            {totalProductos} unidad{totalProductos === 1 ? '' : 'es'} totales
                        </span>
                        {proyectoSeleccionado && (
                            <span className="quote-confirmation__chip" role="listitem">
                                Proyecto: {proyectoSeleccionado.proyectoNombre || proyectoSeleccionado.nombre}
                            </span>
                        )}
                        <span className="quote-confirmation__chip" role="listitem">
                            {varianteEnvio}
                        </span>
                    </div>
                </div>
                <aside className="quote-confirmation__total-card" aria-live="polite">
                    <p className="quote-confirmation__total-label">Gran total estimado</p>
                    <span className="quote-confirmation__total-value">
                        {formatCurrency(granTotalConIva)}
                    </span>
                    <p className="quote-confirmation__total-hint">Incluye IVA y costo de envío.</p>
                </aside>
            </section>

            <form className="quote-confirmation__grid" onSubmit={handleGuardarCotizacion}>
                <section className="quote-confirmation__panel">
                    <header className="quote-confirmation__panel-header">
                        <h2>Información del cliente</h2>
                        <p>Confirma que los datos del cliente estén correctos antes de guardar.</p>
                    </header>
                    <dl className="quote-confirmation__client-info">
                        <div>
                            <dt>Nombre</dt>
                            <dd>{cliente.nombre}</dd>
                        </div>
                        <div>
                            <dt>Dirección</dt>
                            <dd>{cliente.direccion || 'Sin dirección registrada'}</dd>
                        </div>
                        {proyectoSeleccionado && (
                            <div>
                                <dt>Proyecto</dt>
                                <dd>
                                    <span className="quote-confirmation__project-name">
                                        {proyectoSeleccionado.proyectoNombre || proyectoSeleccionado.nombre}
                                    </span>
                                    <br />
                                    <span className="quote-confirmation__project-address">
                                        {proyectoSeleccionado.proyectoDireccion || proyectoSeleccionado.direccion ||
                                            'Dirección no especificada'}
                                    </span>
                                </dd>
                            </div>
                        )}
                        <div>
                            <dt>Descuento negociado</dt>
                            <dd>{cliente.descuento ? `${cliente.descuento}%` : 'Sin descuento'}</dd>
                        </div>
                    </dl>
                </section>

                <section className="quote-confirmation__panel quote-confirmation__panel--wide">
                    <header className="quote-confirmation__panel-header">
                        <h2>Detalle de la cotización</h2>
                        <p>Revisa los precios finales y ajusta el método de envío si es necesario.</p>
                    </header>

                    <div className="quote-confirmation__shipping">
                        <div className="quote-confirmation__field">
                            <label htmlFor="shipping-variant">Variante de envío</label>
                            <p className="quote-confirmation__hint">
                                Elige la opción que mejor se adapte a la entrega del pedido.
                            </p>
                            <select
                                id="shipping-variant"
                                value={varianteEnvio}
                                onChange={(event) => setVarianteEnvio(event.target.value)}
                            >
                                {shippingOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="quote-confirmation__field">
                            <label htmlFor="shipping-cost">Costo de envío</label>
                            <p className="quote-confirmation__hint">
                                Introduce el costo del traslado por modalidad. Se aplicará en automático al total.
                            </p>
                            <div className="quote-confirmation__input-group">
                                <span>$</span>
                                <input
                                    id="shipping-cost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={shippingCosts[varianteEnvio] ?? ''}
                                    onChange={handleCostoEnvioChange}
                                    inputMode="decimal"
                                />
                            </div>
                        </div>

                        {varianteEnvio === 'Recoger personalmente' && (
                            <div className="quote-confirmation__field">
                                <label htmlFor="pickup-branch">Sucursal de recolección</label>
                                <p className="quote-confirmation__hint">
                                    Elige una sucursal registrada o escribe el punto de entrega.
                                </p>
                                {sucursalesDisponibles.length > 0 ? (
                                    <select
                                        id="pickup-branch"
                                        value={selectedSucursalValue}
                                        onChange={handleSucursalChange}
                                        required
                                        disabled={varianteEnvio !== 'Recoger personalmente'}
                                    >
                                        {sucursalesDisponibles.map((sucursal) => (
                                            <option
                                                key={sucursal.id ?? sucursal.nombre}
                                                value={String(sucursal.id ?? sucursal.nombre)}
                                            >
                                                {sucursal.nombre}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        id="pickup-branch"
                                        type="text"
                                        value={sucursalRecogidaNombre}
                                        onChange={handleSucursalChange}
                                        required
                                        placeholder="Ej. Sucursal Centro, CDMX"
                                        disabled={varianteEnvio !== 'Recoger personalmente'}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="quote-confirmation__table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">Producto</th>
                                    <th scope="col">Variante</th>
                                    <th scope="col" className="is-numeric">
                                        Cantidad
                                    </th>
                                    <th scope="col" className="is-numeric">
                                        Precio unitario
                                    </th>
                                    <th scope="col" className="is-numeric">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map((producto) => {
                                    const precioBase = producto.precioSeleccionado || 0;
                                    const ganancia = producto.ganancia || 0;
                                    const cantidad = parseFloat(producto.cantidad) || 0;
                                    const precioUnitario = precioBase * (1 + ganancia / 100);
                                    const totalProducto = precioUnitario * cantidad;

                                    return (
                                        <tr key={producto.producto.id}>
                                            <th scope="row">{producto.producto.nombre}</th>
                                            <td>{producto.tipoPrecio || 'No especificado'}</td>
                                            <td className="is-numeric">{cantidad}</td>
                                            <td className="is-numeric">{formatCurrency(precioUnitario)}</td>
                                            <td className="is-numeric">{formatCurrency(totalProducto)}</td>
                                        </tr>
                                    );
                                })}
                                <tr className="quote-confirmation__shipping-row">
                                    <th scope="row">Servicio de envío</th>
                                    <td>
                                        {varianteEnvio}
                                        {varianteEnvio === 'Recoger personalmente' && sucursalRecogidaNombre && (
                                            <>
                                                <br />
                                                <small className="quote-confirmation__hint">{sucursalRecogidaNombre}</small>
                                            </>
                                        )}
                                    </td>
                                    <td className="is-numeric">{envio > 0 ? 1 : '-'}</td>
                                    <td className="is-numeric">{envio > 0 ? formatCurrency(envio) : 'Sin costo'}</td>
                                    <td className="is-numeric">{envio > 0 ? formatCurrency(envio) : 'Sin costo'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <dl className="quote-confirmation__summary" aria-label="Resumen de totales">
                        <div>
                            <dt>Subtotal con envío</dt>
                            <dd>{formatCurrency(totalConEnvio)}</dd>
                        </div>
                        <div>
                            <dt>IVA (16%)</dt>
                            <dd>{formatCurrency(iva)}</dd>
                        </div>
                        <div>
                            <dt>Gran total</dt>
                            <dd>{formatCurrency(granTotalConIva)}</dd>
                        </div>
                    </dl>

                    <footer className="quote-confirmation__actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={regresarAGanancias}
                        >
                            Volver
                        </button>
                        <div className="quote-confirmation__actions-right">
                            {mutation.isLoading && (
                                <p className="quote-confirmation__status" role="status" aria-live="polite">
                                    Guardando cotización...
                                </p>
                            )}
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={mutation.isLoading}
                            >
                                Guardar cotización
                            </button>
                        </div>
                    </footer>
                </section>
            </form>
        </div>
    );
};

export default ConfirmacionCotizacion;
