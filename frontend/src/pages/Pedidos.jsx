import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import { readAllOrdenesVenta } from '../data-access/ordenesVentaDataAccess';
import '../css/pedidos.css';

const Pedidos = () => {
    const { data: ordenes = [], isLoading } = useQuery('ordenes-venta', readAllOrdenesVenta);
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('todos');

    const sortedOrders = useMemo(() => {
        if (!ordenes) return [];
        return [...ordenes].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }, [ordenes]);

    const filteredOrders = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return sortedOrders.filter((order) => {
            const searchFields = [order.id, order.cliente, order.total, order.estado];
            const matchesSearch =
                !normalizedSearch ||
                searchFields
                    .map((field) => (field ?? '').toString().toLowerCase())
                    .some((value) => value.includes(normalizedSearch));

            const matchesEstado = estadoFilter === 'todos' || order.estado === estadoFilter;

            return matchesSearch && matchesEstado;
        });
    }, [sortedOrders, searchTerm, estadoFilter]);

    return (
        <>
            <NavigationTitle menu="Ventas" submenu="Pedidos" />
            <div className="orders">
                <section className="orders__hero">
                    <div>
                        <p className="orders__hero-eyebrow">Seguimiento de ventas</p>
                        <h1 className="orders__hero-title">Pedidos en curso</h1>
                        <p className="orders__hero-subtitle">
                            Administra las cotizaciones convertidas en venta y da seguimiento a su estado de surtido.
                        </p>
                    </div>
                </section>

                <section className="orders__toolbar">
                    <div className="orders__search">
                        <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                        <input
                            type="search"
                            placeholder="Buscar por folio, cliente o estado"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <div className="orders__filters">
                        <label htmlFor="estado-filter">Estado</label>
                        <select
                            id="estado-filter"
                            value={estadoFilter}
                            onChange={(event) => setEstadoFilter(event.target.value)}
                        >
                            <option value="todos">Todos</option>
                            <option value="surtiendo">Surtiendo</option>
                            <option value="en_almacen">En almacén</option>
                            <option value="en_entrega">En entrega</option>
                            <option value="completada">Completada</option>
                        </select>
                    </div>
                </section>

                <section className="orders__table">
                    {isLoading ? (
                        <p className="orders__loading">Cargando pedidos...</p>
                    ) : filteredOrders.length ? (
                        <div className="orders__table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Folio</th>
                                        <th>Cliente</th>
                                        <th>Estado</th>
                                        <th>Fecha</th>
                                        <th>Total</th>
                                        <th>Ítems</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((order) => {
                                        const items = Array.isArray(order.detalles) ? order.detalles.length : 0;
                                        return (
                                            <tr key={order.id}>
                                                <td>{order.id}</td>
                                                <td>{order.cliente}</td>
                                                <td>
                                                    <span className={`orders__status orders__status--${order.estado}`}>
                                                        {order.estado}
                                                    </span>
                                                </td>
                                                <td>{new Date(order.fecha).toLocaleDateString()}</td>
                                                <td>
                                                    ${parseFloat(order.total || 0).toLocaleString('es-MX', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td>{items}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="orders__empty">
                            <i className="fa-solid fa-clipboard-list" aria-hidden="true"></i>
                            <h3>No hay pedidos registrados</h3>
                            <p>Convierte una cotización en venta para verla aquí.</p>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
};

export default Pedidos;
