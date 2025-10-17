import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import { readAllClientes, createCliente, updateCliente, deleteCliente } from '../data-access/clientesDataAccess.js';
import Modal from '../components/Modal';
import ClienteForm from '../forms/ClienteForm';
import { toast } from 'react-toastify';
import '../css/clientes.css';

const Clientes = () => {
    const { data: clientes, isLoading } = useQuery('clientes', readAllClientes);
    const [isShowingFormModal, setIsShowingFormModal] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [projectFilter, setProjectFilter] = useState('todos');
    const queryClient = useQueryClient();

    const createMutation = useMutation(createCliente, {
        onSuccess: () => {
            queryClient.invalidateQueries('clientes');
            toast('Cliente guardado correctamente', { type: 'success' });
            setIsShowingFormModal(false);
        },
        onError: (error) => {
            console.error('Error creando cliente:', error);
            toast('Hubo un error al crear el cliente.', { type: 'error' });
        },
    });

    const updateMutation = useMutation(updateCliente, {
        onSuccess: () => {
            queryClient.invalidateQueries('clientes');
            toast('Cliente actualizado correctamente', { type: 'success' });
            setIsShowingFormModal(false);
        },
        onError: (error) => {
            console.error('Error actualizando cliente:', error);
            toast('Hubo un error al actualizar el cliente.', { type: 'error' });
        },
    });

    const deleteMutation = useMutation(deleteCliente, {
        onSuccess: () => {
            queryClient.invalidateQueries('clientes');
            toast('Cliente eliminado correctamente', { type: 'success' });
        },
        onError: (error) => {
            console.error('Error eliminando cliente:', error);
            toast('Hubo un error al eliminar el cliente.', { type: 'error' });
        },
    });

    useEffect(() => {
        document.title = 'Orza - Clientes';
    }, []);

    const sortedClients = useMemo(() => {
        if (!clientes) return [];

        return [...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [clientes]);

    const totalClients = sortedClients.length;

    const clientsWithProject = useMemo(
        () => sortedClients.filter((client) => Boolean(client.proyecto)).length,
        [sortedClients]
    );

    const averageDiscount = useMemo(() => {
        if (!sortedClients.length) return 0;

        const total = sortedClients.reduce((accumulator, current) => {
            const discount = parseFloat(current.descuento) || 0;
            return accumulator + discount;
        }, 0);

        return total / sortedClients.length;
    }, [sortedClients]);

    const filteredClients = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return sortedClients.filter((client) => {
            const matchesSearch =
                !normalizedSearch ||
                [client.nombre, client.proyecto, client.direccion].some((field) =>
                    (field || '').toLowerCase().includes(normalizedSearch)
                );

            const hasProject = Boolean(client.proyecto);
            const matchesProjectFilter =
                projectFilter === 'todos' ||
                (projectFilter === 'con-proyecto' && hasProject) ||
                (projectFilter === 'sin-proyecto' && !hasProject);

            return matchesSearch && matchesProjectFilter;
        });
    }, [sortedClients, searchTerm, projectFilter]);

    const handleSaveCliente = (cliente) => {
        if (selectedCliente) {
            updateMutation.mutate({ ...cliente, id: selectedCliente.id });
        } else {
            createMutation.mutate(cliente);
        }
    };

    const handleDeleteCliente = async (id) => {
        const shouldDelete = window.confirm('¿Estás seguro de eliminar este cliente?');
        if (!shouldDelete) return;

        await deleteMutation.mutateAsync(id);
    };

    const handleCancel = () => {
        setSelectedCliente(null);
        setIsShowingFormModal(false);
    };

    const openCreateModal = () => {
        setSelectedCliente(null);
        setIsShowingFormModal(true);
    };

    return (
        <>
            <NavigationTitle menu="Relaciones" submenu="Clientes" />
            <div className="clients">
                <section className="clients__hero">
                    <div className="clients__hero-copy">
                        <p className="clients__hero-eyebrow">Panel de clientes</p>
                        <h1 className="clients__hero-title">Mantén tus relaciones comerciales siempre actualizadas</h1>
                        <p className="clients__hero-subtitle">
                            Visualiza tus cuentas clave, controla los proyectos activos y actualiza descuentos sin perder el
                            contexto.
                        </p>
                        <div className="clients__hero-actions">
                            <button type="button" className="clients__primary-action" onClick={openCreateModal}>
                                <i className="fa-solid fa-user-plus" aria-hidden="true"></i>
                                Nuevo cliente
                            </button>
                            <button
                                type="button"
                                className="clients__ghost-action"
                                onClick={() => queryClient.invalidateQueries('clientes')}
                            >
                                <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                                Actualizar lista
                            </button>
                        </div>
                    </div>
                    <div className="clients__hero-stats" aria-label="Indicadores de clientes">
                        <article className="clients__stat">
                            <span className="clients__stat-label">Clientes activos</span>
                            <strong className="clients__stat-value">{totalClients}</strong>
                            <p className="clients__stat-help">Personas o empresas registradas en tu cartera.</p>
                        </article>
                        <article className="clients__stat">
                            <span className="clients__stat-label">Proyectos con seguimiento</span>
                            <strong className="clients__stat-value">{clientsWithProject}</strong>
                            <p className="clients__stat-help">
                                {totalClients
                                    ? `${Math.round((clientsWithProject / totalClients) * 100)}% con un proyecto asignado`
                                    : 'Sin proyectos registrados'}
                            </p>
                        </article>
                        <article className="clients__stat">
                            <span className="clients__stat-label">Descuento promedio</span>
                            <strong className="clients__stat-value">{averageDiscount.toFixed(1)}%</strong>
                            <p className="clients__stat-help">Referencia rápida para ajustar tus negociaciones.</p>
                        </article>
                    </div>
                </section>

                <section className="clients__toolbar" aria-label="Herramientas de búsqueda y filtros">
                    <div className="clients__search">
                        <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                        <input
                            type="search"
                            placeholder="Buscar por nombre, proyecto o dirección"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <div className="clients__filters">
                        <label htmlFor="project-filter">Proyectos</label>
                        <select
                            id="project-filter"
                            value={projectFilter}
                            onChange={(event) => setProjectFilter(event.target.value)}
                        >
                            <option value="todos">Todos</option>
                            <option value="con-proyecto">Con proyecto</option>
                            <option value="sin-proyecto">Sin proyecto</option>
                        </select>
                    </div>
                </section>

                <section className="clients__table" aria-live="polite">
                    {isLoading ? (
                        <p className="clients__loading">Cargando clientes...</p>
                    ) : filteredClients.length ? (
                        <div className="clients__table-wrapper">
                            <table className="clients__data">
                                <thead>
                                    <tr>
                                        <th scope="col">Nombre</th>
                                        <th scope="col">Proyecto</th>
                                        <th scope="col">Dirección</th>
                                        <th scope="col">Descuento</th>
                                        <th scope="col" className="clients__actions-header">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClients.map((cliente) => (
                                        <tr key={cliente.id}>
                                            <td data-title="Nombre">{cliente.nombre}</td>
                                            <td data-title="Proyecto">{cliente.proyecto || 'Sin proyecto'}</td>
                                            <td data-title="Dirección">{cliente.direccion || '—'}</td>
                                            <td data-title="Descuento">
                                                {cliente.descuento ? `${parseFloat(cliente.descuento).toFixed(1)}%` : '0%'}
                                            </td>
                                            <td className="clients__actions">
                                                <div className="clients__action-group">
                                                    <button
                                                        type="button"
                                                        className="clients__action"
                                                        onClick={() => {
                                                            setSelectedCliente(cliente);
                                                            setIsShowingFormModal(true);
                                                        }}
                                                        aria-label={`Editar ${cliente.nombre}`}
                                                    >
                                                        <i className="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="clients__action clients__action--danger"
                                                        onClick={() => handleDeleteCliente(cliente.id)}
                                                        aria-label={`Eliminar ${cliente.nombre}`}
                                                    >
                                                        <i className="fa-solid fa-trash" aria-hidden="true"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="clients__empty-state">
                            <i className="fa-solid fa-users-slash" aria-hidden="true"></i>
                            <h2>No encontramos clientes con esos criterios</h2>
                            <p>Prueba con otros filtros o registra un nuevo cliente para comenzar.</p>
                            <button type="button" className="clients__primary-action" onClick={openCreateModal}>
                                <i className="fa-solid fa-user-plus" aria-hidden="true"></i>
                                Registrar cliente
                            </button>
                        </div>
                    )}
                </section>
            </div>
            <Modal isShowing={isShowingFormModal} setIsShowing={setIsShowingFormModal} onClose={handleCancel}>
                <ClienteForm clienteUpdate={selectedCliente} cancelAction={handleCancel} onSave={handleSaveCliente} />
            </Modal>
        </>
    );
};

export default Clientes;
