import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import Modal from '../components/Modal';
import { createClienteProject, readAllClientes } from '../data-access/clientesDataAccess';
import '../css/ganancias.css';
import { UPLOADS_BASE_URL } from '../data-access/dataAccessUtils';
import { toast } from 'react-toastify';
import { loadOrder, saveOrder } from '../utils/orderStorage';

const IMAGE_BASE_URL = UPLOADS_BASE_URL;
const GAIN_SLIDER_MAX = 120;

const obtenerCantidadAjustada = (cantidad) => parseFloat(cantidad) || 0;
const obtenerCantidadMinimaCaja = (producto) => {
    const baseProducto = producto.producto || {};
    const piezasCaja = parseFloat(baseProducto.piezas_caja);
    const m2Caja = parseFloat(baseProducto.m2_caja);

    if (Number.isFinite(piezasCaja) && piezasCaja > 0) return piezasCaja;
    if (Number.isFinite(m2Caja) && m2Caja > 0) return m2Caja;
    return 0;
};

const calcularCajasNecesarias = (cantidadUnidades, contenidoCaja) => {
    if (!Number.isFinite(contenidoCaja) || contenidoCaja <= 0) {
        return Math.max(1, Math.ceil(cantidadUnidades || 1));
    }

    const unidades = Number.isFinite(cantidadUnidades) ? cantidadUnidades : 0;
    return Math.max(1, Math.ceil(unidades / contenidoCaja));
};

const GananciasPorProducto = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const navigationOrder = location.state?.order;

    const buildProductosConGanancia = (items) =>
        items.map((producto) => {
            const baseProducto = producto.producto || producto;
            const requiereCajaCompleta =
                producto.requiereCajaCompleta ?? producto.requiere_caja_completa ?? false;
            const tipoPrecioInicial =
                producto.tipoPrecio ||
                (baseProducto.precio_pieza_sin_iva
                    ? 'pieza'
                    : baseProducto.precio_caja_sin_iva
                    ? 'caja'
                    : baseProducto.precio_m2_sin_iva
                    ? 'm2'
                    : null);

            const precioInicial =
                producto.precioSeleccionado ||
                (tipoPrecioInicial === 'pieza'
                    ? baseProducto.precio_pieza_sin_iva
                    : tipoPrecioInicial === 'caja'
                    ? baseProducto.precio_caja_sin_iva
                    : baseProducto.precio_m2_sin_iva || 0);

            const cantidadAjustada = obtenerCantidadAjustada(producto.cantidad);

            return {
                ...producto,
                producto: baseProducto,
                ganancia: producto.ganancia || 0,
                precioSeleccionado: precioInicial,
                tipoPrecio: tipoPrecioInicial,
                tipoPrecioPrevio: producto.tipoPrecioPrevio || tipoPrecioInicial,
                requiereCajaCompleta,
                cantidad: cantidadAjustada,
            };
        });

    const [carrito, setCarrito] = useState(() => {
        const fallbackOrder = navigationOrder?.length ? navigationOrder : loadOrder();
        if (fallbackOrder?.length) {
            saveOrder(fallbackOrder);
        }
        return fallbackOrder || [];
    });

    useEffect(() => {
        if (navigationOrder?.length) {
            setCarrito(navigationOrder);
            saveOrder(navigationOrder);
        } else {
            const storedOrder = loadOrder();
            if (storedOrder?.length) {
                setCarrito(storedOrder);
            }
        }
    }, [navigationOrder]);

    const { data: clientes, isLoading: isLoadingClientes } = useQuery('clientes', readAllClientes);
    const queryClient = useQueryClient();
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [selectedProyecto, setSelectedProyecto] = useState(null);
    const previousClienteId = useRef(null);
    const [initializedFromNavigation, setInitializedFromNavigation] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [projectDraft, setProjectDraft] = useState({ nombre: '', descripcion: '', direccion: '' });

    const [productosConGanancia, setProductosConGanancia] = useState(() =>
        buildProductosConGanancia(carrito || [])
    );

    useEffect(() => {
        setProductosConGanancia(buildProductosConGanancia(carrito || []));
    }, [carrito]);

    useEffect(() => {
        saveOrder(productosConGanancia || []);
    }, [productosConGanancia]);

    useEffect(() => {
        if (initializedFromNavigation) return;

        const clienteDesdeState = location.state?.cliente;
        if (!clienteDesdeState || !clientes?.length) return;

        const clienteMatch =
            clientes.find((cliente) => cliente.id === Number(clienteDesdeState.id)) ||
            clientes.find(
                (cliente) =>
                    cliente.nombre?.toLowerCase() === clienteDesdeState.nombre?.toLowerCase()
            );

        if (!clienteMatch) return;

        setSelectedCliente(clienteMatch);

        const proyectoDesdeState =
            location.state?.proyecto || location.state?.proyectoSeleccionado || null;

        if (proyectoDesdeState && Array.isArray(clienteMatch.proyectos)) {
            const proyectoMatch =
                clienteMatch.proyectos.find(
                    (proyecto) => proyecto.id === Number(proyectoDesdeState.id || proyectoDesdeState.proyectoId)
                ) ||
                clienteMatch.proyectos.find(
                    (proyecto) =>
                        proyecto.nombre?.toLowerCase() ===
                        (proyectoDesdeState.nombre || proyectoDesdeState.proyectoNombre)?.toLowerCase()
                );

            if (proyectoMatch) {
                setSelectedProyecto(proyectoMatch);
            }
        }

        setInitializedFromNavigation(true);
    }, [clientes, initializedFromNavigation, location.state]);

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

    useEffect(() => {
        const currentClienteId = selectedCliente?.id ?? null;

        if (previousClienteId.current === null) {
            previousClienteId.current = currentClienteId;
            return;
        }

        if (currentClienteId !== previousClienteId.current) {
            setSelectedProyecto(null);
            previousClienteId.current = currentClienteId;
        }
    }, [selectedCliente]);

    const createProjectMutation = useMutation(createClienteProject, {
        onSuccess: (createdProject, variables) => {
            toast('Proyecto creado correctamente', { type: 'success' });
            queryClient.invalidateQueries('clientes');
            setSelectedCliente((prev) => {
                if (!prev || prev.id !== variables?.clienteId) return prev;
                const proyectosActualizados = [...(prev.proyectos || []), createdProject];
                return { ...prev, proyectos: proyectosActualizados };
            });
            setSelectedProyecto(createdProject);
            setIsProjectModalOpen(false);
            setProjectDraft({ nombre: '', descripcion: '', direccion: '' });
        },
        onError: () => {
            toast('Hubo un error al crear el proyecto.', { type: 'error' });
        },
    });

    const openProjectModal = () => {
        if (!selectedCliente) {
            toast('Selecciona un cliente para crear un proyecto.', { type: 'info' });
            return;
        }
        setProjectDraft({ nombre: '', descripcion: '', direccion: '' });
        setIsProjectModalOpen(true);
    };

    const closeProjectModal = () => {
        setIsProjectModalOpen(false);
        setProjectDraft({ nombre: '', descripcion: '', direccion: '' });
    };

    const handleProjectDraftChange = (field, value) => {
        setProjectDraft((prev) => ({ ...prev, [field]: value }));
    };

    const submitProjectModal = (event) => {
        event.preventDefault();
        if (!selectedCliente) {
            toast('Debes seleccionar un cliente para crear un proyecto.', { type: 'warning' });
            return;
        }

        if (!projectDraft.nombre.trim()) {
            toast('El proyecto debe tener un nombre.', { type: 'warning' });
            return;
        }

        createProjectMutation.mutate({
            clienteId: selectedCliente.id,
            proyecto: {
                nombre: projectDraft.nombre.trim(),
                descripcion: projectDraft.descripcion.trim(),
                direccion: projectDraft.direccion.trim(),
            },
        });
    };

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

    const productosConCantidadInsuficiente = useMemo(
        () =>
            productosConGanancia.filter((producto) => {
                if (!producto.requiereCajaCompleta) return false;

                const cantidadActual = parseFloat(producto.cantidad) || 0;
                return cantidadActual < 1;
            }).length,
        [productosConGanancia]
    );

    const obtenerPrecioPorTipo = (baseProducto, tipoPrecio) => {
        switch (tipoPrecio) {
            case 'caja':
                return baseProducto?.precio_caja_sin_iva || 0;
            case 'pieza':
                return baseProducto?.precio_pieza_sin_iva || 0;
            case 'm2':
                return baseProducto?.precio_m2_sin_iva || 0;
            default:
                return 0;
        }
    };

    const promedioGanancia = useMemo(() => {
        if (!productosConGanancia.length) return 0;
        const suma = productosConGanancia.reduce((total, producto) => total + (producto.ganancia || 0), 0);
        return suma / productosConGanancia.length;
    }, [productosConGanancia]);

    const productosTotales = useMemo(() => {
        const uniqueProductIds = new Set(
            productosConGanancia
                .map((producto) => producto.producto?.id)
                .filter((id) => id !== undefined && id !== null)
        );

        return uniqueProductIds.size || productosConGanancia.length;
    }, [productosConGanancia]);

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
                    const nuevoPrecio = obtenerPrecioPorTipo(producto.producto, nuevoTipoPrecio);
                    return {
                        ...producto,
                        precioSeleccionado: nuevoPrecio,
                        tipoPrecio: nuevoTipoPrecio,
                        tipoPrecioPrevio: producto.requiereCajaCompleta
                            ? producto.tipoPrecioPrevio
                            : nuevoTipoPrecio,
                        cantidad: obtenerCantidadAjustada(producto.cantidad),
                    };
                }
                return producto;
            })
        );
    };

    const eliminarProducto = (id) => {
        setProductosConGanancia((prev) => prev.filter((producto) => producto.producto?.id !== id));
        setCarrito((prev) => prev.filter((producto) => producto.producto?.id !== id));
    };

    const actualizarCantidad = (id, nuevaCantidad) => {
        setProductosConGanancia((prev) =>
            prev.map((producto) => {
                if (producto.producto?.id !== id) return producto;

                const cantidadNumerica = obtenerCantidadAjustada(nuevaCantidad);

                if (producto.requiereCajaCompleta) {
                    const cajas = Math.max(1, Math.ceil(cantidadNumerica || 0));
                    if (cajas < 1) {
                        toast('La cantidad mínima es 1 caja.', { type: 'info' });
                    }
                    return { ...producto, cantidad: cajas };
                }

                return { ...producto, cantidad: cantidadNumerica };
            })
        );
    };

    const actualizarRequiereCajaCompleta = (id, requiereCajaCompleta) => {
        setProductosConGanancia((prev) =>
            prev.map((producto) => {
                if (producto.producto?.id === id) {
                    const precioCaja = producto.producto?.precio_caja_sin_iva || 0;
                    const cantidadActual = obtenerCantidadAjustada(producto.cantidad);
                    const contenidoCaja = obtenerCantidadMinimaCaja(producto);

                    if (requiereCajaCompleta) {
                        const cajasNecesarias = calcularCajasNecesarias(cantidadActual, contenidoCaja);

                        return {
                            ...producto,
                            requiereCajaCompleta,
                            tipoPrecioPrevio: producto.tipoPrecio,
                            precioSeleccionado: precioCaja,
                            tipoPrecio: 'caja',
                            cantidadPrevioCajaCompleta: cantidadActual,
                            cantidad: cajasNecesarias,
                        };
                    }

                    const tipoPrecioRestaurado = producto.tipoPrecioPrevio || producto.tipoPrecio;
                    const precioRestaurado = obtenerPrecioPorTipo(
                        producto.producto,
                        tipoPrecioRestaurado
                    );
                    const cantidadRestaurada =
                        producto.cantidadPrevioCajaCompleta !== undefined
                            ? producto.cantidadPrevioCajaCompleta
                            : cantidadActual;

                    return {
                        ...producto,
                        requiereCajaCompleta,
                        precioSeleccionado: precioRestaurado,
                        tipoPrecio: tipoPrecioRestaurado,
                        cantidad: cantidadRestaurada,
                        cantidadPrevioCajaCompleta: undefined,
                    };
                }
                return producto;
            })
        );
    };

    const ajustarCantidadConDelta = (producto, delta) => {
        const cantidadActual = obtenerCantidadAjustada(producto.cantidad);
        const minimoCaja = obtenerCantidadMinimaCaja(producto);
        const cantidadObjetivo = cantidadActual + delta;

        if (producto.requiereCajaCompleta) {
            const cantidadAjustada = Math.max(1, Math.ceil(cantidadObjetivo));
            actualizarCantidad(producto.producto?.id, cantidadAjustada);
            return;
        }

        const minimoPermitido = Math.max(0, minimoCaja || 0);
        const cantidadAjustada =
            minimoCaja > 0 ? Math.max(minimoCaja, cantidadObjetivo) : Math.max(minimoPermitido, cantidadObjetivo);

        actualizarCantidad(producto.producto?.id, cantidadAjustada);
    };

    const moveProduct = (fromIndex, toIndex) => {
        setProductosConGanancia((prev) => {
            if (toIndex < 0 || toIndex >= prev.length) return prev;
            const updated = [...prev];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, moved);
            return updated;
        });
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

    const agregarOtroProducto = () => {
        const orderActualizada = productosConGanancia || [];
        saveOrder(orderActualizada);
        navigate('/app/ventas', { state: { order: orderActualizada } });
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

        if (productosConCantidadInsuficiente) {
            alert('Ajusta las cantidades para cumplir con la venta de caja completa.');
            return;
        }

        const navigationState = {
            productos: productosConGanancia.map((producto) => {
                const cantidad = Number.parseFloat(producto.cantidad) || 0;
                const costoBase = Number.parseFloat(
                    producto.precioSeleccionado ?? producto.costo_base ?? 0
                );
                const gananciaPorcentaje = Number.parseFloat(producto.ganancia || 0);

                const precioUnitario = costoBase * (1 + gananciaPorcentaje / 100);
                const gananciaMonto = (precioUnitario - costoBase) * cantidad;

                return {
                    ...producto,
                    costo_base: Number.isFinite(costoBase) ? costoBase : 0,
                    ganancia_porcentaje: Number.isFinite(gananciaPorcentaje)
                        ? parseFloat(gananciaPorcentaje.toFixed(2))
                        : 0,
                    ganancia_monto: Number.isFinite(gananciaMonto)
                        ? parseFloat(gananciaMonto.toFixed(2))
                        : 0,
                };
            }),
            granTotal: granTotal,
            cliente: selectedCliente,
        };

        if (selectedProyecto) {
            navigationState.proyectoSeleccionado = {
                proyectoId: selectedProyecto.id,
                proyectoNombre: selectedProyecto.nombre,
                proyectoDireccion: selectedProyecto.direccion,
            };
        }

        navigate('/app/ventas/confirmacion', { state: navigationState });
    };

    const clienteTieneProyectos = useMemo(
        () => Array.isArray(selectedCliente?.proyectos) && selectedCliente.proyectos.length > 0,
        [selectedCliente]
    );

    const canContinue = Boolean(
        selectedCliente && !productosConPrecioInvalido && !productosConCantidadInsuficiente
    );

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
                                            onChange={(event) => {
                                                const nuevoCliente =
                                                    clientes?.find(
                                                        (cliente) => cliente.id === parseInt(event.target.value, 10)
                                                    ) || null;
                                                setSelectedCliente(nuevoCliente);
                                            }}
                                        >
                                            <option value="" disabled>
                                                Selecciona un cliente
                                            </option>
                                            {clientes?.map((cliente) => (
                                                <option key={cliente.id} value={cliente.id}>
                                                    {cliente.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {selectedCliente && (
                                    <div className="profit__sidebar-field">
                                        <label htmlFor="proyecto-select">Proyecto</label>
                                        {clienteTieneProyectos ? (
                                            <select
                                                id="proyecto-select"
                                                value={selectedProyecto?.id || ''}
                                                onChange={(event) => {
                                                    const proyecto = selectedCliente.proyectos?.find(
                                                        (item) => item.id === parseInt(event.target.value, 10)
                                                    );
                                                    setSelectedProyecto(proyecto || null);
                                                }}
                                            >
                                                <option value="" disabled>
                                                    Selecciona un proyecto
                                                </option>
                                                {selectedCliente.proyectos?.map((proyecto) => (
                                                    <option key={proyecto.id} value={proyecto.id}>
                                                        {proyecto.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="profit__sidebar-empty">
                                                <p className="profit__sidebar-hint">
                                                    Este cliente no tiene proyectos registrados. Registra uno para
                                                    asociarlo a la cotización (recomendado).
                                                </p>
                                                <button
                                                    type="button"
                                                    className="profit__ghost-button"
                                                    onClick={openProjectModal}
                                                >
                                                    Crear proyecto
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedCliente ? (
                                    <div className="profit__client-card">
                                        <div className="profit__client-info">
                                            <h3>{selectedCliente.nombre}</h3>
                                            {selectedProyecto ? (
                                                <>
                                                    <p>{selectedProyecto.nombre}</p>
                                                    <span>{selectedProyecto.direccion || 'Sin dirección registrada'}</span>
                                                </>
                                            ) : (
                                                <p>Selecciona un proyecto para asociarlo a la cotización (opcional).</p>
                                            )}
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
                                {productosConGanancia.map((producto, index) => {
                                    const cantidad = parseFloat(producto.cantidad) || 0;
                                    const contenidoCaja = obtenerCantidadMinimaCaja(producto);
                                    const minimoCaja = producto.requiereCajaCompleta ? 1 : 0;
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
                                                <div className="profit-product__order" aria-label="Orden del producto">
                                                    <button
                                                        type="button"
                                                        className="profit-product__order-button"
                                                        onClick={() => moveProduct(index, index - 1)}
                                                        disabled={index === 0}
                                                        aria-label="Mover producto hacia arriba"
                                                    >
                                                        ▲
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="profit-product__order-button"
                                                        onClick={() => moveProduct(index, index + 1)}
                                                        disabled={index === productosConGanancia.length - 1}
                                                        aria-label="Mover producto hacia abajo"
                                                    >
                                                        ▼
                                                    </button>
                                                </div>
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
                                                    <label htmlFor={`cantidad-${producto.producto?.id}`}>
                                                        Cantidad
                                                    </label>
                                                    <div className="profit-product__quantity-control" role="group" aria-label="Control de cantidad">
                                                        <button
                                                            type="button"
                                                            aria-label="Disminuir cantidad"
                                                            onClick={() => ajustarCantidadConDelta(producto, -1)}
                                                            disabled={cantidad <= (minimoCaja || 0)}
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            id={`cantidad-${producto.producto?.id}`}
                                                            type="number"
                                                            min={minimoCaja || 0}
                                                            step="1"
                                                            value={producto.cantidad ?? 0}
                                                            onChange={(event) =>
                                                                actualizarCantidad(
                                                                    producto.producto?.id,
                                                                    event.target.value
                                                                )
                                                            }
                                                        />
                                                        <button
                                                            type="button"
                                                            aria-label="Incrementar cantidad"
                                                            onClick={() => ajustarCantidadConDelta(producto, 1)}
                                                        >
                                                            +
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="profit-product__quantity-remove"
                                                            aria-label="Eliminar producto"
                                                            onClick={() => eliminarProducto(producto.producto?.id)}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                      {producto.requiereCajaCompleta && contenidoCaja > 0 && (
                                                          <p className="profit-product__helper">
                                                              Contenido por caja: {contenidoCaja}
                                                          </p>
                                                      )}
                                                  </div>
                                            </header>

                                            <div className="profit-product__field">
                                                <label
                                                    className="profit-product__checkbox"
                                                    htmlFor={`requiere-caja-${producto.producto?.id}`}
                                                >
                                                    <input
                                                        id={`requiere-caja-${producto.producto?.id}`}
                                                        type="checkbox"
                                                        checked={producto.requiereCajaCompleta || false}
                                                        onChange={(event) =>
                                                            actualizarRequiereCajaCompleta(
                                                                producto.producto?.id,
                                                                event.target.checked
                                                            )
                                                        }
                                                    />
                                                    <span>Requiere caja completa</span>
                                                </label>
                                                <p className="profit-product__helper">
                                                    Al activarlo se usará siempre el precio de caja y ajustaremos la cantidad al
                                                    número de cajas necesario para cubrir lo que solicitaste.
                                                </p>
                                            </div>

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

                                {Boolean(productosConCantidadInsuficiente) && (
                                    <p className="profit__summary-warning">
                                        {productosConCantidadInsuficiente}{' '}
                                        {productosConCantidadInsuficiente === 1
                                            ? 'producto debe cumplir con la cantidad mínima de una caja.'
                                            : 'productos deben cumplir con la cantidad mínima de una caja.'}
                                    </p>
                                )}

                                <div className="profit__summary-actions">
                                    <button
                                        type="button"
                                        className="profit__ghost-button"
                                        onClick={agregarOtroProducto}
                                    >
                                        Agregar otro producto
                                    </button>
                                    <button
                                        type="button"
                                        className="profit__primary-button"
                                        onClick={continuarConCotizacion}
                                        disabled={!canContinue}
                                    >
                                        Continuar a confirmación
                                    </button>
                                </div>
                                <p className="profit__summary-note">
                                    Tus productos y márgenes actuales se conservarán al regresar.
                                </p>
                            </div>
                        </section>
                    </>
                )}
            </div>

            <Modal
                isShowing={isProjectModalOpen}
                setIsShowing={setIsProjectModalOpen}
                onClose={closeProjectModal}
                title="Agregar proyecto"
            >
                <form className="clients__project-form" onSubmit={submitProjectModal}>
                    <h3 style={{ marginBottom: '1rem' }}>Registrar proyecto para {selectedCliente?.nombre}</h3>
                    <label className="clients__project-form-field">
                        Nombre del proyecto
                        <input
                            type="text"
                            value={projectDraft.nombre}
                            onChange={(event) => handleProjectDraftChange('nombre', event.target.value)}
                            placeholder="Ej. Implementación CRM"
                        />
                    </label>
                    <label className="clients__project-form-field">
                        Dirección
                        <input
                            type="text"
                            value={projectDraft.direccion}
                            onChange={(event) => handleProjectDraftChange('direccion', event.target.value)}
                            placeholder="Ej. Calle 123, Ciudad"
                        />
                    </label>
                    <label className="clients__project-form-field">
                        Descripción
                        <textarea
                            value={projectDraft.descripcion}
                            onChange={(event) => handleProjectDraftChange('descripcion', event.target.value)}
                            placeholder="Detalles o alcance del proyecto"
                        />
                    </label>
                    <div className="clients__project-form-actions">
                        <button type="button" className="btn btn-light" onClick={closeProjectModal}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Crear proyecto
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default GananciasPorProducto;
