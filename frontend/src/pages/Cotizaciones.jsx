import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import NavigationTitle from '../components/NavigationTitle';
import { getAllCotizaciones, cancelCotizacion, downloadCotizacionPDF } from '../data-access/cotizacionesDataAccess';
import CotizacionDetailsModal from '../components/CotizacionDetailsModal';
import { toast } from 'react-toastify';
import '../css/cotizaciones.css';
import { getProductById } from '../data-access/productsDataAccess';

const Cotizaciones = () => {
    const navigate = useNavigate();
    const { data: cotizaciones, isLoading } = useQuery('cotizaciones', getAllCotizaciones);
    const queryClient = useQueryClient();
    const [isShowingModal, setIsShowingModal] = useState(false);
    const [selectedCotizacion, setSelectedCotizacion] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('todas');
    const [amountFilter, setAmountFilter] = useState('todas');

    const cancelMutation = useMutation(cancelCotizacion, {
        onSuccess: () => {
            queryClient.invalidateQueries('cotizaciones');
            toast('Cotización cancelada con éxito.', { type: 'success' });
            setIsShowingModal(false);
        },
        onError: (error) => {
            console.error('Error al cancelar la cotización:', error);
            toast('No se pudo cancelar la cotización. Inténtalo nuevamente.', { type: 'error' });
        },
    });

    useEffect(() => {
        document.title = 'Orza - Cotizaciones';
    }, []);

    const sortedQuotes = useMemo(() => {
        if (!cotizaciones) return [];

        return [...cotizaciones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }, [cotizaciones]);

    const totalQuotes = sortedQuotes.length;

    const totalAmount = useMemo(
        () =>
            sortedQuotes.reduce((accumulator, current) => {
                const total = parseFloat(current.total) || 0;
                return accumulator + total;
            }, 0),
        [sortedQuotes]
    );

    const averageTicket = totalQuotes ? totalAmount / totalQuotes : 0;

    const averageItemsPerQuote = useMemo(() => {
        if (!sortedQuotes.length) return 0;

        const totalItems = sortedQuotes.reduce((accumulator, current) => {
            const items = Array.isArray(current.detalles) ? current.detalles.length : 0;
            return accumulator + items;
        }, 0);

        return totalItems / sortedQuotes.length;
    }, [sortedQuotes]);

    const filteredQuotes = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return sortedQuotes.filter((quote) => {
            const searchableFields = [
                quote.cliente,
                quote.id,
                quote.total,
                quote.proyecto_nombre,
                quote.proyecto?.nombre,
                quote.proyectoNombre,
            ];

            const matchesSearch =
                !normalizedSearch ||
                searchableFields
                    .map((field) => (field ?? '').toString().toLowerCase())
                    .some((value) => value.includes(normalizedSearch));

            const quoteDate = new Date(quote.fecha);
            const now = new Date();

            const matchesDateFilter = (() => {
                switch (dateFilter) {
                    case 'ultimos-7':
                        return now - quoteDate <= 7 * 24 * 60 * 60 * 1000;
                    case 'ultimos-30':
                        return now - quoteDate <= 30 * 24 * 60 * 60 * 1000;
                    case 'ultimos-90':
                        return now - quoteDate <= 90 * 24 * 60 * 60 * 1000;
                    default:
                        return true;
                }
            })();

            const total = parseFloat(quote.total) || 0;

            const matchesAmountFilter = (() => {
                switch (amountFilter) {
                    case 'menor-5000':
                        return total < 5000;
                    case '5000-20000':
                        return total >= 5000 && total <= 20000;
                    case 'mayor-20000':
                        return total > 20000;
                    default:
                        return true;
                }
            })();

            return matchesSearch && matchesDateFilter && matchesAmountFilter;
        });
    }, [sortedQuotes, searchTerm, dateFilter, amountFilter]);

    const handleOpenDetails = (cotizacion) => {
        setSelectedCotizacion(cotizacion);
        setIsShowingModal(true);
    };

    const handleCloseDetails = () => {
        setSelectedCotizacion(null);
        setIsShowingModal(false);
    };

    const handleDownloadQuote = async (id) => {
        try {
            await downloadCotizacionPDF(id);
            toast('Descarga iniciada', { type: 'success' });
        } catch (error) {
            console.error('Error al descargar el PDF:', error);
            toast('No se pudo descargar la cotización.', { type: 'error' });
        }
    };

    const handleCancelCotizacion = async (id) => {
        const shouldCancel = window.confirm('¿Deseas cancelar esta cotización? Esta acción no se puede deshacer.');
        if (!shouldCancel) return;

        try {
            await cancelMutation.mutateAsync(id);
        } catch (error) {
            console.error('Error al cancelar la cotización:', error);
        }
    };

    const handleEditCotizacion = async (cotizacion) => {
        if (!cotizacion?.detalles?.length) return;

        try {
            const order = await Promise.all(
                cotizacion.detalles.map(async (detalle) => {
                    try {
                        const producto = await getProductById(detalle.producto_id);
                        const tipoPrecio = detalle.tipo_variante || 'm2';

                        return {
                            ...producto,
                            producto,
                            id: producto?.id || detalle.producto_id,
                            cantidad: (detalle.cantidad ?? 1).toString(),
                            tipoPrecio,
                            tipoPrecioPrevio: tipoPrecio,
                            precioSeleccionado:
                                detalle.precio_unitario ??
                                producto?.[`precio_${tipoPrecio}_sin_iva`] ??
                                producto?.precio_m2_sin_iva ??
                                0,
                            precio_m2_sin_iva: producto?.precio_m2_sin_iva,
                            precio_caja_sin_iva: producto?.precio_caja_sin_iva,
                            precio_pieza_sin_iva: producto?.precio_pieza_sin_iva,
                        };
                    } catch (error) {
                        console.error(
                            `Error al recuperar el producto con ID ${detalle.producto_id} para edición:`,
                            error
                        );
                        return null;
                    }
                })
            );

            const validOrder = order.filter(Boolean);

            if (validOrder.length) {
                const clienteState = {
                    id:
                        cotizacion.cliente_id ||
                        cotizacion.clienteId ||
                        cotizacion.cliente?.id ||
                        null,
                    nombre:
                        cotizacion.cliente ||
                        cotizacion.cliente_nombre ||
                        cotizacion.clienteNombre ||
                        cotizacion.cliente?.nombre ||
                        '',
                };

                const proyectoState = {
                    id:
                        cotizacion.proyecto_id ||
                        cotizacion.proyectoId ||
                        cotizacion.proyecto?.id ||
                        null,
                    nombre:
                        cotizacion.proyecto_nombre ||
                        cotizacion.proyecto?.nombre ||
                        cotizacion.proyectoNombre ||
                        '',
                    direccion:
                        cotizacion.proyecto_direccion ||
                        cotizacion.proyecto?.direccion ||
                        cotizacion.proyectoDireccion ||
                        '',
                };

                const navigationState = { order: validOrder };

                if (clienteState.id || clienteState.nombre) {
                    navigationState.cliente = clienteState;
                }

                if (proyectoState.id || proyectoState.nombre || proyectoState.direccion) {
                    navigationState.proyecto = proyectoState;
                }

                navigate('/app/ventas/ganancias', { state: navigationState });
            }
        } catch (error) {
            console.error('Error al preparar la cotización para edición:', error);
            toast('No se pudo preparar la cotización para editar.', { type: 'error' });
        }
    };

    return (
        <>
            <NavigationTitle menu="Ventas" submenu="Cotizaciones" />
            <div className="quotes">
                <section className="quotes__hero">
                    <div className="quotes__hero-copy">
                        <p className="quotes__hero-eyebrow">Embudo de cotizaciones</p>
                        <h1 className="quotes__hero-title">Da seguimiento a tus propuestas sin perder oportunidades</h1>
                        <p className="quotes__hero-subtitle">
                            Consulta el volumen de cotizaciones enviadas, prioriza las de mayor valor y revisa los detalles en
                            un par de clics.
                        </p>
                        <div className="quotes__hero-actions">
                            <button
                                type="button"
                                className="quotes__hero-refresh"
                                onClick={() => queryClient.invalidateQueries('cotizaciones')}
                            >
                                <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                                Actualizar listado
                            </button>
                        </div>
                    </div>
                    <div className="quotes__hero-stats" aria-label="Indicadores de cotizaciones">
                        <article className="quotes__stat">
                            <span className="quotes__stat-label">Cotizaciones activas</span>
                            <strong className="quotes__stat-value">{totalQuotes}</strong>
                            <p className="quotes__stat-help">Registro total disponible para seguimiento.</p>
                        </article>
                        <article className="quotes__stat">
                            <span className="quotes__stat-label">Monto estimado</span>
                            <strong className="quotes__stat-value">${totalAmount.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</strong>
                            <p className="quotes__stat-help">Suma de los importes cotizados hasta el momento.</p>
                        </article>
                        <article className="quotes__stat">
                            <span className="quotes__stat-label">Ticket promedio</span>
                            <strong className="quotes__stat-value">${averageTicket.toFixed(0)}</strong>
                            <p className="quotes__stat-help">Valor medio por cotización emitida.</p>
                        </article>
                        <article className="quotes__stat">
                            <span className="quotes__stat-label">Ítems por cotización</span>
                            <strong className="quotes__stat-value">{averageItemsPerQuote.toFixed(1)}</strong>
                            <p className="quotes__stat-help">Productos promedio incluidos en cada propuesta.</p>
                        </article>
                    </div>
                </section>

                <section className="quotes__toolbar" aria-label="Herramientas de búsqueda y filtros">
                    <div className="quotes__search">
                        <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                        <input
                            type="search"
                            placeholder="Buscar por folio, cliente, proyecto o total"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <div className="quotes__filters">
                        <label htmlFor="date-filter">Rango</label>
                        <select
                            id="date-filter"
                            value={dateFilter}
                            onChange={(event) => setDateFilter(event.target.value)}
                        >
                            <option value="todas">Todas</option>
                            <option value="ultimos-7">Últimos 7 días</option>
                            <option value="ultimos-30">Últimos 30 días</option>
                            <option value="ultimos-90">Últimos 90 días</option>
                        </select>
                    </div>
                    <div className="quotes__filters">
                        <label htmlFor="amount-filter">Importe</label>
                        <select
                            id="amount-filter"
                            value={amountFilter}
                            onChange={(event) => setAmountFilter(event.target.value)}
                        >
                            <option value="todas">Todos</option>
                            <option value="menor-5000">Menor a $5,000</option>
                            <option value="5000-20000">Entre $5,000 y $20,000</option>
                            <option value="mayor-20000">Más de $20,000</option>
                        </select>
                    </div>
                </section>

                <section className="quotes__table" aria-live="polite">
                    <header className="quotes__table-header">
                        <div>
                            <h2>Cotizaciones</h2>
                            <p>Haz clic en una fila para revisar el detalle o utiliza las acciones rápidas.</p>
                        </div>
                        <span className="quotes__result-count">
                            {filteredQuotes.length} {filteredQuotes.length === 1 ? 'resultado' : 'resultados'}
                        </span>
                    </header>

                    {isLoading ? (
                        <p className="quotes__loading">Cargando cotizaciones...</p>
                    ) : filteredQuotes.length ? (
                        <div className="quotes__table-wrapper">
                            <table className="quotes__data">
                                <thead>
                                    <tr>
                                        <th scope="col">Folio</th>
                                        <th scope="col">Cliente</th>
                                        <th scope="col">Proyecto</th>
                                        <th scope="col">Fecha</th>
                                        <th scope="col">Total</th>
                                        <th scope="col">Ítems</th>
                                        <th scope="col" className="quotes__actions-header">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQuotes.map((cotizacion) => {
                                        const items = Array.isArray(cotizacion.detalles)
                                            ? cotizacion.detalles.length
                                            : 0;

                                        return (
                                            <tr
                                                key={cotizacion.id}
                                                onClick={() => handleOpenDetails(cotizacion)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                        event.preventDefault();
                                                        handleOpenDetails(cotizacion);
                                                    }
                                                }}
                                            >
                                                <td data-title="Folio">{cotizacion.id}</td>
                                                <td data-title="Cliente">{cotizacion.cliente}</td>
                                                <td data-title="Proyecto">
                                                    {cotizacion.proyecto_nombre ||
                                                        cotizacion.proyecto?.nombre ||
                                                        cotizacion.proyectoNombre ||
                                                        'Sin proyecto asignado'}
                                                </td>
                                                <td data-title="Fecha">
                                                    {new Date(cotizacion.fecha).toLocaleDateString()}
                                                </td>
                                                <td data-title="Total">
                                                    ${parseFloat(cotizacion.total).toLocaleString('es-MX', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td data-title="Ítems">{items}</td>
                                                <td
                                                    className="quotes__actions"
                                                    onClick={(event) => event.stopPropagation()}
                                                    data-title="Acciones"
                                                >
                                                    <div className="quotes__action-group">
                                                        <button
                                                            type="button"
                                                            className="quotes__action"
                                                            onClick={() => handleOpenDetails(cotizacion)}
                                                            aria-label={`Ver detalles de la cotización ${cotizacion.id}`}
                                                        >
                                                            <i className="fa-solid fa-eye" aria-hidden="true"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="quotes__action quotes__action--download"
                                                            onClick={() => handleDownloadQuote(cotizacion.id)}
                                                            aria-label={`Descargar PDF de la cotización ${cotizacion.id}`}
                                                        >
                                                            <i className="fa-solid fa-file-arrow-down" aria-hidden="true"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="quotes__action quotes__action--danger"
                                                            onClick={() => handleCancelCotizacion(cotizacion.id)}
                                                            aria-label={`Cancelar cotización ${cotizacion.id}`}
                                                        >
                                                            <i className="fa-solid fa-ban" aria-hidden="true"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="quotes__empty-state">
                            <i className="fa-solid fa-clipboard-list" aria-hidden="true"></i>
                            <h3>No se encontraron cotizaciones con los filtros seleccionados</h3>
                            <p>
                                Ajusta la búsqueda o limpia los filtros para volver a ver el historial completo de
                                cotizaciones.
                            </p>
                            <button
                                type="button"
                                className="quotes__outline-action"
                                onClick={() => {
                                    setSearchTerm('');
                                    setDateFilter('todas');
                                    setAmountFilter('todas');
                                }}
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    )}
                </section>
            </div>

            {isShowingModal && selectedCotizacion && (
                <CotizacionDetailsModal
                    cotizacion={selectedCotizacion}
                    isShowing={isShowingModal}
                    onClose={handleCloseDetails}
                    onCancelCotizacion={handleCancelCotizacion}
                    onDownloadPDF={handleDownloadQuote}
                    onEditCotizacion={handleEditCotizacion}
                />
            )}
        </>
    );
};

export default Cotizaciones;
