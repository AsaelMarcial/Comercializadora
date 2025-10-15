import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import { readAllClientes } from '../data-access/clientesDataAccess';
import '../css/ganancias.css';

const IMAGE_BASE_URL = 'http://147.93.47.106:8000/uploads';
const GAIN_SLIDER_MAX = 120;

const GananciasPorProducto = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const carrito = location.state?.order || [];

    const { data: clientes, isLoading: isLoadingClientes } = useQuery('clientes', readAllClientes);
    const [selectedCliente, setSelectedCliente] = useState(null);

    const [productosConGanancia, setProductosConGanancia] = useState(() =>
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
                ganancia: 0,
                precioSeleccionado: precioInicial,
                tipoPrecio: tipoPrecioInicial,
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

    const formatCurrency = (value) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
            Number.isFinite(value) ? value : 0
        );

    const costoTotalBase = useMemo(
        () =>
            productosConGanancia.reduce((total, producto) => {
                if (!producto.precioSeleccionado || Number.isNaN(producto.precioSeleccionado)) {
                    return total;
                }
                const cantidad = parseFloat(producto.cantidad) || 0;
                return total + producto.precioSeleccionado * cantidad;
            }, 0),
        [productosConGanancia]
    );

    const totalGanancia = useMemo(
        () =>
            productosConGanancia.reduce((total, producto) => {
                const cantidad = parseFloat(producto.cantidad) || 0;
                const gananciaUnitaria = (producto.precioSeleccionado * producto.ganancia) / 100;
                return total + gananciaUnitaria * cantidad;
            }, 0),
        [productosConGanancia]
    );

    const granTotal = useMemo(() => costoTotalBase + totalGanancia, [costoTotalBase, totalGanancia]);

    const productosConPrecioInvalido = useMemo(
        () =>
            productosConGanancia.filter(
                (producto) =>
                    !producto.tipoPrecio ||
                    !producto.precioSeleccionado ||
                    Number.isNaN(producto.precioSeleccionado)
            ).length,
        [productosConGanancia]
    );

    const promedioGanancia = useMemo(() => {
        if (!productosConGanancia.length) return 0;
        const suma = productosConGanancia.reduce((total, producto) => total + (producto.ganancia || 0), 0);
        return suma / productosConGanancia.length;
    }, [productosConGanancia]);

    const productosTotales = productosConGanancia.length;

    const actualizarGanancia = (id, nuevoValor) => {
        setProductosConGanancia((prev) =>
            prev.map((producto) =>
                producto.producto?.id === id
                    ? {
                          ...producto,
                          ganancia: Math.max(0, Math.min(GAIN_SLIDER_MAX, parseFloat(nuevoValor) || 0)),
                      }
                    : producto
            )
        );
    };

    const incrementarGanancia = (id, delta) => {
        setProductosConGanancia((prev) =>
            prev.map((producto) =>
                producto.producto?.id === id
                    ? {
                          ...producto,
                          ganancia: Math.max(
                              0,
                              Math.min(GAIN_SLIDER_MAX, (parseFloat(producto.ganancia) || 0) + delta)
                          ),
                      }
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

    const aplicarDescuentoCliente = () => {
        if (!selectedCliente) return;
        setProductosConGanancia((prev) =>
            prev.map((producto) => ({
                ...producto,
                ganancia: Math.max(0, Math.min(GAIN_SLIDER_MAX, selectedCliente.descuento || 0)),
            }))
        );
    };

    const reiniciarGanancias = () => {
        setProductosConGanancia((prev) =>
            prev.map((producto) => ({
                ...producto,
                ganancia: 0,
            }))
        );
    };

    const continuarConCotizacion = () => {
        if (!selectedCliente) {
            alert('Debes seleccionar un cliente para continuar.');
            return;
        }

        if (productosConPrecioInvalido) {
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
        <>
            <NavigationTitle menu="Ventas" submenu="Definir ganancias por producto" />

            <div className="profit">
                <section className="profit__hero">
                    <div className="profit__hero-copy">
                        <p className="profit__hero-eyebrow">Análisis de ganancias</p>
                        <h1 className="profit__hero-title">
                            Ajusta el margen de tus productos con una vista clara y accionable
                        </h1>
                        <p className="profit__hero-subtitle">
                            Selecciona a tu cliente, aplica descuentos sugeridos y visualiza el impacto en tiempo real
                            antes de confirmar la cotización.
                        </p>
                        <div className="profit__hero-stats" role="list">
                            <article className="profit__hero-stat" role="listitem">
                                <span className="profit__stat-label">Productos en la cotización</span>
                                <strong className="profit__stat-value">{productosTotales}</strong>
                            </article>
                            <article className="profit__hero-stat" role="listitem">
                                <span className="profit__stat-label">Ganancia promedio</span>
                                <strong className="profit__stat-value">{promedioGanancia.toFixed(1)}%</strong>
                            </article>
                            <article className="profit__hero-stat" role="listitem">
                                <span className="profit__stat-label">Total estimado</span>
                                <strong className="profit__stat-value">{formatCurrency(granTotal)}</strong>
                            </article>
                        </div>
                    </div>
                    <div className="profit__hero-figure" aria-hidden="true">
                        <div className="profit__hero-badge">
                            <i className="fa-solid fa-scale-balanced"></i>
                            <span>Optimiza tus márgenes</span>
                        </div>
                        <div className="profit__hero-illustration">
                            <i className="fa-solid fa-chart-column"></i>
                        </div>
                    </div>
                </section>

                {!carrito.length ? (
                    <section className="profit__empty" role="status">
                        <div className="profit__empty-card">
                            <i className="fa-solid fa-box-open" aria-hidden="true"></i>
                            <h2>No hay productos para calcular ganancias</h2>
                            <p>Regresa al flujo de ventas para agregar artículos al carrito.</p>
                            <button type="button" className="profit__ghost-button" onClick={() => navigate('/app/ventas')}>
                                Volver a ventas
                            </button>
                        </div>
                    </section>
                ) : (
                    <>
                        <section className="profit__panel">
                            <aside className="profit__sidebar" aria-label="Información del cliente">
                                <header className="profit__sidebar-header">
                                    <h2>Selecciona un cliente</h2>
                                    <p>Personaliza descuentos y comentarios para esta cotización.</p>
                                </header>

                                <div className="profit__sidebar-field">
                                    <label htmlFor="cliente-select">Cliente</label>
                                    {isLoadingClientes ? (
                                        <div className="profit__skeleton"></div>
                                    ) : (
                                        <select
                                            id="cliente-select"
                                            value={selectedCliente?.id || ''}
                                            onChange={(event) =>
                                                setSelectedCliente(
                                                    clientes?.find(
                                                        (cliente) => cliente.id === parseInt(event.target.value, 10)
                                                    ) || null
                                                )
                                            }
                                        >
                                            <option value="" disabled>
                                                Selecciona un cliente
                                            </option>
                                            {clientes?.map((cliente) => (
                                                <option key={cliente.id} value={cliente.id}>
                                                    {cliente.nombre} · {cliente.proyecto || 'Sin proyecto'}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {selectedCliente ? (
                                    <div className="profit__client-card">
                                        <div className="profit__client-info">
                                            <h3>{selectedCliente.nombre}</h3>
                                            <p>{selectedCliente.proyecto || 'Proyecto no especificado'}</p>
                                            <span>{selectedCliente.direccion || 'Sin dirección registrada'}</span>
                                        </div>
                                        <div className="profit__client-actions">
                                            <button
                                                type="button"
                                                className="profit__ghost-button"
                                                onClick={aplicarDescuentoCliente}
                                            >
                                                Aplicar descuento del cliente ({selectedCliente.descuento || 0}%)
                                            </button>
                                            <button
                                                type="button"
                                                className="profit__ghost-button"
                                                onClick={reiniciarGanancias}
                                            >
                                                Reiniciar márgenes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="profit__sidebar-hint">
                                        Elige un cliente para usar su descuento sugerido y mostrar sus datos de contacto.
                                    </p>
                                )}
                            </aside>

                            <div className="profit__products" aria-live="polite">
                                {productosConGanancia.map((producto) => {
                                    const cantidad = parseFloat(producto.cantidad) || 0;
                                    const precioFinalUnitario =
                                        producto.precioSeleccionado * (1 + (producto.ganancia || 0) / 100);
                                    const totalProducto = precioFinalUnitario * cantidad;

                                    const imageSrc = `${IMAGE_BASE_URL}/producto_${producto.producto?.id}.jpeg`;

                                    const disablePriceSelect =
                                        !producto.producto?.precio_pieza_sin_iva &&
                                        !producto.producto?.precio_caja_sin_iva &&
                                        !producto.producto?.precio_m2_sin_iva;

                                    return (
                                        <article className="profit-product" key={producto.producto?.id}>
                                            <header className="profit-product__header">
                                                <div className="profit-product__thumbnail" aria-hidden="true">
                                                    <img
                                                        src={imageSrc}
                                                        alt={producto.producto?.nombre || 'Producto sin nombre'}
                                                        onError={(event) => {
                                                            event.currentTarget.classList.add('profit-product__image--fallback');
                                                            event.currentTarget.parentElement?.classList.add(
                                                                'profit-product__thumbnail--empty'
                                                            );
                                                        }}
                                                    />
                                                </div>
                                                <div className="profit-product__title">
                                                    <h3>{producto.producto?.nombre || 'Producto sin nombre'}</h3>
                                                    <p>
                                                        {producto.producto?.codigo || 'Código no disponible'} ·{' '}
                                                        {producto.producto?.formato || 'Formato no especificado'}
                                                    </p>
                                                </div>
                                                <div className="profit-product__quantity">
                                                    <span>Cantidad</span>
                                                    <strong>{cantidad}</strong>
                                                </div>
                                            </header>

                                            <dl className="profit-product__grid">
                                                <div>
                                                    <dt>Precio base</dt>
                                                    <dd>{formatCurrency(producto.precioSeleccionado)}</dd>
                                                </div>
                                                <div>
                                                    <dt>Subtotal base</dt>
                                                    <dd>{formatCurrency(producto.precioSeleccionado * cantidad)}</dd>
                                                </div>
                                                <div>
                                                    <dt>Ganancia</dt>
                                                    <dd>{formatCurrency(totalProducto - producto.precioSeleccionado * cantidad)}</dd>
                                                </div>
                                                <div>
                                                    <dt>Total del producto</dt>
                                                    <dd>{formatCurrency(totalProducto)}</dd>
                                                </div>
                                            </dl>

                                            <div className="profit-product__field">
                                                <label htmlFor={`tipo-precio-${producto.producto?.id}`}>
                                                    Tipo de precio
                                                </label>
                                                <select
                                                    id={`tipo-precio-${producto.producto?.id}`}
                                                    value={producto.tipoPrecio || ''}
                                                    onChange={(event) =>
                                                        actualizarPrecioSeleccionado(
                                                            producto.producto?.id,
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={disablePriceSelect}
                                                >
                                                    <option value="" disabled>
                                                        Selecciona una opción
                                                    </option>
                                                    {producto.producto?.precio_pieza_sin_iva && (
                                                        <option value="pieza">Por pieza</option>
                                                    )}
                                                    {producto.producto?.precio_caja_sin_iva && (
                                                        <option value="caja">Por caja</option>
                                                    )}
                                                    {producto.producto?.precio_m2_sin_iva && (
                                                        <option value="m2">Por m²</option>
                                                    )}
                                                </select>
                                                {disablePriceSelect && (
                                                    <p className="profit-product__helper">
                                                        Este producto no tiene precios configurados. Actualiza el catálogo antes de
                                                        continuar.
                                                    </p>
                                                )}
                                            </div>

                                            <div className="profit-product__field">
                                                <label htmlFor={`ganancia-${producto.producto?.id}`}>
                                                    Ganancia objetivo
                                                </label>
                                                <div className="profit-product__gain-control">
                                                    <input
                                                        id={`ganancia-${producto.producto?.id}`}
                                                        type="range"
                                                        min="0"
                                                        max={GAIN_SLIDER_MAX}
                                                        value={producto.ganancia || 0}
                                                        onChange={(event) =>
                                                            actualizarGanancia(
                                                                producto.producto?.id,
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={GAIN_SLIDER_MAX}
                                                        value={producto.ganancia || 0}
                                                        onChange={(event) =>
                                                            actualizarGanancia(
                                                                producto.producto?.id,
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                    <span className="profit-product__gain-value">{producto.ganancia || 0}%</span>
                                                </div>
                                                <div className="profit-product__quick-actions" role="group" aria-label="Accesos rápidos de ganancia">
                                                    {[5, 10, 15].map((incremento) => (
                                                        <button
                                                            key={incremento}
                                                            type="button"
                                                            onClick={() => incrementarGanancia(producto.producto?.id, incremento)}
                                                        >
                                                            +{incremento}%
                                                        </button>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => actualizarGanancia(producto.producto?.id, 0)}
                                                    >
                                                        Quitar ganancia
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="profit__summary" aria-live="polite">
                            <div className="profit__summary-card">
                                <header>
                                    <h2>Resumen del pedido</h2>
                                    <p>Valida la información antes de avanzar a la confirmación.</p>
                                </header>
                                <dl>
                                    <div>
                                        <dt>Subtotal base</dt>
                                        <dd>{formatCurrency(costoTotalBase)}</dd>
                                    </div>
                                    <div>
                                        <dt>Ganancia estimada</dt>
                                        <dd>{formatCurrency(totalGanancia)}</dd>
                                    </div>
                                    <div>
                                        <dt>Total con margen</dt>
                                        <dd>{formatCurrency(granTotal)}</dd>
                                    </div>
                                </dl>
                                {Boolean(productosConPrecioInvalido) && (
                                    <p className="profit__summary-warning">
                                        {productosConPrecioInvalido}{' '}
                                        {productosConPrecioInvalido === 1
                                            ? 'producto requiere definir un tipo de precio válido.'
                                            : 'productos requieren definir un tipo de precio válido.'}
                                    </p>
                                )}

                                <div className="profit__summary-actions">
                                    <button type="button" className="profit__ghost-button" onClick={() => navigate('/app/ventas')}>
                                        Volver
                                    </button>
                                    <button type="button" className="profit__primary-button" onClick={continuarConCotizacion}>
                                        Continuar a confirmación
                                    </button>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </>
    );
};

export default GananciasPorProducto;
