import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import NavigationTitle from '../components/NavigationTitle';
import { createCotizacion } from '../data-access/cotizacionesDataAccess';
import '../css/confirmacionCotizacion.css';

const SHIPPING_VARIANTS = [
    {
        value: 'Servicio de Paquetería',
        label: 'Paquetería programada',
        description: 'Entrega en 24-48h con seguimiento y seguro incluido.',
    },
    {
        value: 'Servicio de Unidades Completas',
        label: 'Unidades completas',
        description: 'Ideal para pedidos voluminosos con descarga asistida.',
    },
];

const formatCurrency = (value) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
        Number.isFinite(value) ? value : 0
    );

const ConfirmacionCotizacion = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { productos, granTotal: totalSinIva, cliente } = location.state || {};

    const [costoEnvio, setCostoEnvio] = useState('0');
    const [varianteEnvio, setVarianteEnvio] = useState(SHIPPING_VARIANTS[0].value);

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

    const productosCalculados = useMemo(() => {
        if (!productos?.length) {
            return [];
        }

        return productos.map((item) => {
            const productoBase = item.producto?.producto || item.producto || item;
            const ganancia = Number.parseFloat(item.ganancia) || 0;
            const cantidad = Number.parseFloat(item.cantidad) || 0;
            const precioSeleccionado = Number.parseFloat(item.precioSeleccionado) || 0;
            const factorGanancia = 1 + ganancia / 100;
            const precioUnitario = precioSeleccionado * factorGanancia;
            const totalProducto = precioUnitario * cantidad;

            return {
                id: productoBase?.id ?? item.id,
                nombre: productoBase?.nombre ?? 'Producto sin nombre',
                tipoVariante: item.tipoPrecio || 'No especificado',
                ganancia,
                cantidad,
                precioBase: precioSeleccionado,
                precioUnitario,
                total: totalProducto,
                original: item,
            };
        });
    }, [productos]);

    const subtotalProductos = useMemo(
        () => productosCalculados.reduce((acum, producto) => acum + producto.total, 0),
        [productosCalculados]
    );

    const unidadesTotales = useMemo(
        () => productosCalculados.reduce((acum, producto) => acum + producto.cantidad, 0),
        [productosCalculados]
    );

    const gananciaPromedio = useMemo(() => {
        if (!productosCalculados.length) return 0;
        const sumaGanancias = productosCalculados.reduce((acum, producto) => acum + producto.ganancia, 0);
        return sumaGanancias / productosCalculados.length;
    }, [productosCalculados]);

    const envioNumerico = Number.parseFloat(costoEnvio) || 0;
    const subtotalConEnvio = subtotalProductos + envioNumerico;
    const iva = subtotalConEnvio * 0.16;
    const totalConIva = subtotalConEnvio + iva;
    const ahorroCliente = subtotalProductos * ((cliente?.descuento || 0) / 100);

    const handleGuardarCotizacion = () => {
        if (!cliente) {
            toast.error('Selecciona un cliente antes de continuar.');
            return;
        }

        const cotizacion = {
            cliente: cliente.nombre,
            cliente_id: cliente.id,
            costo_envio: envioNumerico,
            variante_envio: varianteEnvio,
            detalles: productosCalculados.map((producto) => ({
                producto_id: producto.original?.producto?.id || producto.id,
                nombre: producto.nombre,
                cantidad: producto.cantidad,
                precio_unitario: Number.parseFloat(producto.precioUnitario.toFixed(2)),
                tipo_variante: producto.tipoVariante,
            })),
            total: Number.parseFloat(totalConIva.toFixed(2)),
        };

        mutation.mutate(cotizacion);
    };

    const handleVolver = () => {
        navigate('/app/ventas/ganancias', { replace: false });
    };

    if (!productos?.length || !totalSinIva || !cliente) {
        return (
            <div className="confirm-quote">
                <NavigationTitle menu="Ventas" submenu="Confirmación de Cotización" />
                <section className="confirm-quote__empty">
                    <h2>Necesitamos retomar tu flujo</h2>
                    <p>
                        No encontramos la información de la cotización. Vuelve al cálculo de ganancias para
                        seleccionar los productos y el cliente nuevamente.
                    </p>
                    <button className="confirm-quote__primary" type="button" onClick={handleVolver}>
                        Regresar a ganancias
                    </button>
                </section>
            </div>
        );
    }

    return (
        <div className="confirm-quote">
            <NavigationTitle menu="Ventas" submenu="Confirmación de Cotización" />

            <section className="confirm-quote__hero" aria-label="Resumen de la cotización">
                <div className="confirm-quote__hero-copy">
                    <p className="confirm-quote__hero-eyebrow">Paso 3 · Revisión final</p>
                    <h1 className="confirm-quote__hero-title">Comparte una propuesta clara con {cliente.nombre}</h1>
                    <p className="confirm-quote__hero-subtitle">
                        Revisa cantidades, márgenes y costos logísticos antes de enviar la cotización. Puedes ajustar el
                        envío o regresar a editar si detectas un detalle fuera de lugar.
                    </p>
                    <div className="confirm-quote__hero-actions">
                        <button
                            className="confirm-quote__link"
                            type="button"
                            onClick={() => navigate('/app/ventas/ganancias')}
                        >
                            Volver a ganancias
                        </button>
                        <button
                            className="confirm-quote__link"
                            type="button"
                            onClick={() => navigate('/app/ventas')}
                        >
                            Ver historial de ventas
                        </button>
                    </div>
                </div>
                <aside className="confirm-quote__hero-stats" aria-label="Indicadores rápidos">
                    <article className="confirm-quote__hero-stat">
                        <span className="confirm-quote__stat-label">Total estimado (sin envío)</span>
                        <span className="confirm-quote__stat-value">{formatCurrency(subtotalProductos)}</span>
                    </article>
                    <article className="confirm-quote__hero-stat">
                        <span className="confirm-quote__stat-label">Artículos confirmados</span>
                        <span className="confirm-quote__stat-value">{productosCalculados.length}</span>
                    </article>
                    <article className="confirm-quote__hero-stat">
                        <span className="confirm-quote__stat-label">Unidades totales</span>
                        <span className="confirm-quote__stat-value">{unidadesTotales}</span>
                    </article>
                    <article className="confirm-quote__hero-stat">
                        <span className="confirm-quote__stat-label">Margen promedio</span>
                        <span className="confirm-quote__stat-value">
                            {gananciaPromedio.toFixed(1)}%
                        </span>
                    </article>
                </aside>
            </section>

            <div className="confirm-quote__layout">
                <section className="confirm-quote__card" aria-label="Datos del cliente">
                    <header className="confirm-quote__card-header">
                        <div>
                            <h2>Cliente</h2>
                            <p>Verifica que los datos sean correctos antes de guardar la cotización.</p>
                        </div>
                        <span className="confirm-quote__chip">{cliente.descuento || 0}% descuento</span>
                    </header>
                    <dl className="confirm-quote__details">
                        <div>
                            <dt>Nombre</dt>
                            <dd>{cliente.nombre}</dd>
                        </div>
                        <div>
                            <dt>Dirección</dt>
                            <dd>{cliente.direccion || 'Sin especificar'}</dd>
                        </div>
                        <div>
                            <dt>Correo</dt>
                            <dd>{cliente.correo || 'No registrado'}</dd>
                        </div>
                        <div>
                            <dt>Teléfono</dt>
                            <dd>{cliente.telefono || 'No registrado'}</dd>
                        </div>
                    </dl>
                    <footer className="confirm-quote__card-footer">
                        <p>
                            Este cliente ahorrará aproximadamente{' '}
                            <strong>{formatCurrency(ahorroCliente)}</strong> gracias a su política vigente.
                        </p>
                    </footer>
                </section>

                <section className="confirm-quote__card confirm-quote__totals" aria-live="polite">
                    <header className="confirm-quote__card-header">
                        <div>
                            <h2>Resumen económico</h2>
                            <p>Desglosa costos y simula el envío para mostrar un total transparente.</p>
                        </div>
                    </header>

                    <div className="confirm-quote__shipping">
                        <p className="confirm-quote__section-label">Servicio de envío</p>
                        <div className="confirm-quote__variant-group" role="radiogroup" aria-label="Selecciona el tipo de envío">
                            {SHIPPING_VARIANTS.map((variant) => {
                                const isActive = varianteEnvio === variant.value;
                                return (
                                    <button
                                        key={variant.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={isActive}
                                        className={`confirm-quote__variant ${isActive ? 'is-active' : ''}`}
                                        onClick={() => setVarianteEnvio(variant.value)}
                                    >
                                        <span className="confirm-quote__variant-title">{variant.label}</span>
                                        <span className="confirm-quote__variant-description">{variant.description}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <label className="confirm-quote__input-group">
                            <span>Costo estimado</span>
                            <div className="confirm-quote__input-wrapper">
                                <span className="confirm-quote__input-prefix">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={costoEnvio}
                                    onChange={(event) => setCostoEnvio(event.target.value)}
                                    inputMode="decimal"
                                    aria-label="Costo de envío"
                                />
                            </div>
                            <small>Puedes dejarlo en 0 si el cliente recoge en sucursal.</small>
                        </label>
                    </div>

                    <dl className="confirm-quote__totals-list">
                        <div>
                            <dt>Subtotal productos</dt>
                            <dd>{formatCurrency(subtotalProductos)}</dd>
                        </div>
                        <div>
                            <dt>Envío</dt>
                            <dd>{formatCurrency(envioNumerico)}</dd>
                        </div>
                        <div>
                            <dt>Subtotal con envío</dt>
                            <dd>{formatCurrency(subtotalConEnvio)}</dd>
                        </div>
                        <div>
                            <dt>IVA (16%)</dt>
                            <dd>{formatCurrency(iva)}</dd>
                        </div>
                        <div>
                            <dt>Total a facturar</dt>
                            <dd className="confirm-quote__total-final">{formatCurrency(totalConIva)}</dd>
                        </div>
                    </dl>

                    <p className="confirm-quote__helper-text">
                        El monto original calculado era {formatCurrency(totalSinIva)}. Ajusta el envío si necesitas
                        absorber parte del costo para cerrar la venta.
                    </p>
                </section>
            </div>

            <section className="confirm-quote__products" aria-label="Productos incluidos">
                <header className="confirm-quote__products-header">
                    <div>
                        <h2>Detalle de productos</h2>
                        <p>
                            Cada tarjeta muestra el precio final con margen aplicado. Puedes regresar a ajustar precios
                            si detectas alguna discrepancia.
                        </p>
                    </div>
                    <span className="confirm-quote__badge">{productosCalculados.length} artículos</span>
                </header>

                <div className="confirm-quote__products-grid">
                    {productosCalculados.map((producto) => (
                        <article className="confirm-quote__product-card" key={producto.id}>
                            <header>
                                <h3>{producto.nombre}</h3>
                                <span className="confirm-quote__product-variant">{producto.tipoVariante}</span>
                            </header>
                            <dl>
                                <div>
                                    <dt>Precio base</dt>
                                    <dd>{formatCurrency(producto.precioBase)}</dd>
                                </div>
                                <div>
                                    <dt>Margen aplicado</dt>
                                    <dd>{producto.ganancia}%</dd>
                                </div>
                                <div>
                                    <dt>Precio unitario</dt>
                                    <dd>{formatCurrency(producto.precioUnitario)}</dd>
                                </div>
                                <div>
                                    <dt>Cantidad</dt>
                                    <dd>{producto.cantidad}</dd>
                                </div>
                                <div>
                                    <dt>Total producto</dt>
                                    <dd>{formatCurrency(producto.total)}</dd>
                                </div>
                            </dl>
                        </article>
                    ))}
                </div>
            </section>

            <section className="confirm-quote__guidance" aria-label="Recomendaciones antes de enviar">
                <article>
                    <h2>Checklist de envío</h2>
                    <ul>
                        <li>Confirma disponibilidad de inventario con logística.</li>
                        <li>Valida dirección y referencias de entrega con el cliente.</li>
                        <li>Programa un recordatorio para dar seguimiento dentro de 48 horas.</li>
                    </ul>
                </article>
                <article>
                    <h2>Notas adicionales</h2>
                    <p>
                        Guarda comentarios específicos para tu equipo comercial o añade condiciones especiales que deban
                        incluirse en el documento final.
                    </p>
                    <textarea
                        placeholder="Añade notas internas (opcional)"
                        rows={4}
                        className="confirm-quote__notes"
                        aria-label="Notas internas de la cotización"
                    />
                </article>
            </section>

            <footer className="confirm-quote__actions">
                <div className="confirm-quote__actions-left">
                    <button type="button" className="confirm-quote__ghost" onClick={handleVolver}>
                        Volver a ajustar márgenes
                    </button>
                    <p>Se guardará un registro con los productos, totales y notas asociadas.</p>
                </div>
                <div className="confirm-quote__actions-right">
                    <button
                        type="button"
                        className="confirm-quote__secondary"
                        onClick={() => navigate('/app/ventas/cotizaciones')}
                    >
                        Ver otras cotizaciones
                    </button>
                    <button
                        type="button"
                        className="confirm-quote__primary"
                        onClick={handleGuardarCotizacion}
                        disabled={mutation.isLoading}
                    >
                        {mutation.isLoading ? 'Guardando…' : 'Guardar cotización'}
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default ConfirmacionCotizacion;
