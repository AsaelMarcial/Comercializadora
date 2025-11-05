import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import {
    readAllClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    createClienteProject,
    updateClienteProject,
    deleteClienteProject,
    reassignClienteProject,
} from '../data-access/clientesDataAccess.js';
import Modal from '../components/Modal';
import ClienteForm from '../forms/ClienteForm';
import { toast } from 'react-toastify';
import '../css/clientes.css';

const initialProjectModalState = {
    isOpen: false,
    mode: 'create',
    client: null,
    project: null,
};

const initialReassignModalState = {
    isOpen: false,
    client: null,
    project: null,
    targetId: '',
};

const Clientes = () => {
    const { data: clientes, isLoading } = useQuery('clientes', readAllClientes);
    const [isShowingFormModal, setIsShowingFormModal] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [projectFilter, setProjectFilter] = useState('todos');
    const [projectModalState, setProjectModalState] = useState(initialProjectModalState);
    const [projectDraft, setProjectDraft] = useState({ nombre: '', descripcion: '', direccion: '', id: undefined });
    const [reassignModalState, setReassignModalState] = useState(initialReassignModalState);
    const queryClient = useQueryClient();

    const invalidateClientes = useCallback(() => {
        queryClient.invalidateQueries('clientes');
    }, [queryClient]);

    const closeProjectModal = useCallback(() => {
        setProjectModalState(initialProjectModalState);
        setProjectDraft({ nombre: '', descripcion: '', direccion: '', id: undefined });
    }, [setProjectModalState, setProjectDraft]);

    const closeReassignModal = useCallback(() => {
        setReassignModalState(initialReassignModalState);
    }, [setReassignModalState]);

    const createMutation = useMutation(createCliente, {
        onSuccess: () => {
            invalidateClientes();
            toast('Cliente guardado correctamente', { type: 'success' });
            setSelectedCliente(null);
            setIsShowingFormModal(false);
        },
        onError: (error) => {
            console.error('Error creando cliente:', error);
            toast('Hubo un error al crear el cliente.', { type: 'error' });
        },
    });

    const updateMutation = useMutation(updateCliente, {
        onSuccess: () => {
            invalidateClientes();
            toast('Cliente actualizado correctamente', { type: 'success' });
            setSelectedCliente(null);
            setIsShowingFormModal(false);
        },
        onError: (error) => {
            console.error('Error actualizando cliente:', error);
            toast('Hubo un error al actualizar el cliente.', { type: 'error' });
        },
    });

    const deleteMutation = useMutation(deleteCliente, {
        onSuccess: () => {
            invalidateClientes();
            toast('Cliente eliminado correctamente', { type: 'success' });
        },
        onError: (error) => {
            console.error('Error eliminando cliente:', error);
            toast('Hubo un error al eliminar el cliente.', { type: 'error' });
        },
    });

    const createProjectMutation = useMutation(createClienteProject, {
        onSuccess: () => {
            invalidateClientes();
            toast('Proyecto creado correctamente', { type: 'success' });
            closeProjectModal();
        },
        onError: (error) => {
            console.error('Error creando proyecto:', error);
            toast('Hubo un error al crear el proyecto.', { type: 'error' });
        },
    });

    const updateProjectMutation = useMutation(updateClienteProject, {
        onSuccess: () => {
            invalidateClientes();
            toast('Proyecto actualizado correctamente', { type: 'success' });
            closeProjectModal();
        },
        onError: (error) => {
            console.error('Error actualizando proyecto:', error);
            toast('Hubo un error al actualizar el proyecto.', { type: 'error' });
        },
    });

    const deleteProjectMutation = useMutation(deleteClienteProject, {
        onSuccess: () => {
            invalidateClientes();
            toast('Proyecto eliminado correctamente', { type: 'success' });
        },
        onError: (error) => {
            console.error('Error eliminando proyecto:', error);
            toast('Hubo un error al eliminar el proyecto.', { type: 'error' });
        },
    });

    const reassignProjectMutation = useMutation(reassignClienteProject, {
        onSuccess: () => {
            invalidateClientes();
            toast('Proyecto reasignado correctamente', { type: 'success' });
            closeReassignModal();
        },
        onError: (error) => {
            console.error('Error reasignando proyecto:', error);
            toast('Hubo un error al reasignar el proyecto.', { type: 'error' });
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

    const clientsWithProjects = useMemo(
        () => sortedClients.filter((client) => (client.proyectos?.length ?? 0) > 0).length,
        [sortedClients]
    );

    const totalProjects = useMemo(
        () =>
            sortedClients.reduce(
                (accumulator, current) => accumulator + (current.proyectos?.length ?? 0),
                0
            ),
        [sortedClients]
    );

    const averageProjectsPerClient = totalClients
        ? (totalProjects / totalClients).toFixed(1)
        : '0.0';

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
            const projectTexts = (client.proyectos ?? []).flatMap((proyecto) => [
                proyecto?.nombre,
                proyecto?.descripcion,
                proyecto?.direccion,
            ]);

            const matchesSearch =
                !normalizedSearch ||
                [client.nombre, client.direccion, ...projectTexts].some((field) =>
                    (field || '').toLowerCase().includes(normalizedSearch)
                );

            const projectCount = client.proyectos?.length ?? 0;
            const matchesProjectFilter =
                projectFilter === 'todos' ||
                (projectFilter === 'con-proyecto' && projectCount > 0) ||
                (projectFilter === 'sin-proyecto' && projectCount === 0);

            return matchesSearch && matchesProjectFilter;
        });
    }, [sortedClients, searchTerm, projectFilter]);

    const handleSaveCliente = (cliente) => {
        if (cliente.id) {
            updateMutation.mutate(cliente);
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

    const openEditModal = (cliente) => {
        setSelectedCliente(cliente);
        setIsShowingFormModal(true);
    };

    const openProjectModal = (client, project = null) => {
        setProjectModalState({
            isOpen: true,
            mode: project ? 'edit' : 'create',
            client,
            project,
        });
        setProjectDraft({
            id: project?.id,
            nombre: project?.nombre ?? '',
            descripcion: project?.descripcion ?? '',
            direccion: project?.direccion ?? '',
        });
    };

    const setProjectModalVisibility = (isOpen) => {
        if (!isOpen) {
            closeProjectModal();
        } else {
            setProjectModalState((prev) => ({ ...prev, isOpen }));
        }
    };

    const openReassignModal = (client, project) => {
        setReassignModalState({
            isOpen: true,
            client,
            project,
            targetId: '',
        });
    };

    const setReassignModalVisibility = (isOpen) => {
        if (!isOpen) {
            closeReassignModal();
        } else {
            setReassignModalState((prev) => ({ ...prev, isOpen }));
        }
    };

    const handleProjectDraftChange = (field, value) => {
        setProjectDraft((prev) => ({ ...prev, [field]: value }));
    };

    const submitProjectModal = (event) => {
        event.preventDefault();
        if (!projectDraft.nombre.trim()) {
            toast('El proyecto debe tener un nombre.', { type: 'warning' });
            return;
        }

        if (!projectModalState.client) {
            toast('No se encontró el cliente para asociar el proyecto.', { type: 'error' });
            return;
        }

        const payload = {
            clienteId: projectModalState.client.id,
            proyecto: {
                nombre: projectDraft.nombre.trim(),
                descripcion: projectDraft.descripcion.trim(),
                direccion: projectDraft.direccion.trim(),
            },
        };

        if (projectModalState.mode === 'edit' && projectDraft.id) {
            updateProjectMutation.mutate({ ...payload, proyectoId: projectDraft.id });
        } else {
            createProjectMutation.mutate(payload);
        }
    };

    const handleDeleteProject = (cliente, proyecto) => {
        const shouldDelete = window.confirm(
            `¿Deseas eliminar el proyecto "${proyecto.nombre}" de ${cliente.nombre}?`
        );
        if (!shouldDelete) return;

        if (!proyecto.id) {
            toast('No se pudo identificar el proyecto a eliminar.', { type: 'warning' });
            return;
        }

        deleteProjectMutation.mutate({ clienteId: cliente.id, proyectoId: proyecto.id });
    };

    const submitReassign = (event) => {
        event.preventDefault();
        const targetId = Number(reassignModalState.targetId);
        if (!targetId) {
            toast('Selecciona un cliente de destino.', { type: 'warning' });
            return;
        }

        if (!reassignModalState.client) {
            toast('No se encontró el cliente origen del proyecto.', { type: 'error' });
            return;
        }

        if (targetId === reassignModalState.client.id) {
            toast('Selecciona un cliente distinto para reasignar el proyecto.', { type: 'info' });
            return;
        }

        if (!reassignModalState.project?.id) {
            toast('No se encontró el proyecto a reasignar.', { type: 'error' });
            return;
        }

        reassignProjectMutation.mutate({
            proyectoId: reassignModalState.project.id,
            clienteDestinoId: targetId,
        });
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
                            <span className="clients__stat-label">Proyectos en seguimiento</span>
                            <strong className="clients__stat-value">{totalProjects}</strong>
                            <p className="clients__stat-help">
                                Promedio de {averageProjectsPerClient} proyectos por cliente.
                            </p>
                        </article>
                        <article className="clients__stat">
                            <span className="clients__stat-label">Clientes con proyectos</span>
                            <strong className="clients__stat-value">{clientsWithProjects}</strong>
                            <p className="clients__stat-help">
                                {totalClients
                                    ? `${Math.round((clientsWithProjects / totalClients) * 100)}% tienen proyectos activos`
                                    : 'Sin clientes registrados aún'}
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
                            <option value="con-proyecto">Con proyectos</option>
                            <option value="sin-proyecto">Sin proyectos</option>
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
                                        <th scope="col">Proyectos</th>
                                        <th scope="col">Dirección</th>
                                        <th scope="col">Descuento</th>
                                        <th scope="col" className="clients__actions-header">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClients.map((cliente) => (
                                        <tr key={cliente.id}>
                                            <td data-title="Nombre">{cliente.nombre}</td>
                                            <td data-title="Proyectos">
                                                <div className="clients__projects-cell">
                                                    {cliente.proyectos?.length ? (
                                                        <ul className="clients__project-list">
                                                            {cliente.proyectos.map((proyecto) => (
                                                                <li key={proyecto.id} className="clients__project-chip">
                                                                    <div className="clients__project-content">
                                                                        <span className="clients__project-name">{proyecto.nombre}</span>
                                                                        {proyecto.descripcion && (
                                                                            <span className="clients__project-description">
                                                                                {proyecto.descripcion}
                                                                            </span>
                                                                        )}
                                                                        {proyecto.direccion && (
                                                                            <span className="clients__project-address">
                                                                                {proyecto.direccion}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="clients__project-actions">
                                                                        <button
                                                                            type="button"
                                                                            className="clients__chip-action"
                                                                            onClick={() => openProjectModal(cliente, proyecto)}
                                                                            aria-label={`Editar proyecto ${proyecto.nombre}`}
                                                                        >
                                                                            <i className="fa-solid fa-pen" aria-hidden="true"></i>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="clients__chip-action"
                                                                            onClick={() => openReassignModal(cliente, proyecto)}
                                                                            aria-label={`Reasignar proyecto ${proyecto.nombre}`}
                                                                        >
                                                                            <i className="fa-solid fa-right-left" aria-hidden="true"></i>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="clients__chip-action clients__chip-action--danger"
                                                                            onClick={() => handleDeleteProject(cliente, proyecto)}
                                                                            aria-label={`Eliminar proyecto ${proyecto.nombre}`}
                                                                        >
                                                                            <i className="fa-solid fa-trash" aria-hidden="true"></i>
                                                                        </button>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="clients__project-empty">Sin proyectos registrados</span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="clients__project-add"
                                                        onClick={() => openProjectModal(cliente)}
                                                    >
                                                        <i className="fa-solid fa-circle-plus" aria-hidden="true"></i>
                                                        Agregar proyecto
                                                    </button>
                                                </div>
                                            </td>
                                            <td data-title="Dirección">{cliente.direccion || '—'}</td>
                                            <td data-title="Descuento">
                                                {cliente.descuento ? `${parseFloat(cliente.descuento).toFixed(1)}%` : '0%'}
                                            </td>
                                            <td className="clients__actions">
                                                <div className="clients__action-group">
                                                    <button
                                                        type="button"
                                                        className="clients__action"
                                                        onClick={() => openEditModal(cliente)}
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
            <Modal
                isShowing={isShowingFormModal}
                setIsShowing={setIsShowingFormModal}
                onClose={handleCancel}
                title={selectedCliente ? 'Editar cliente' : 'Registrar cliente'}
            >
                <ClienteForm clienteUpdate={selectedCliente} cancelAction={handleCancel} onSave={handleSaveCliente} />
            </Modal>

            <Modal
                isShowing={projectModalState.isOpen}
                setIsShowing={setProjectModalVisibility}
                onClose={closeProjectModal}
                title={projectModalState.mode === 'edit' ? 'Editar proyecto' : 'Agregar proyecto'}
            >
                <form className="clients__project-form" onSubmit={submitProjectModal}>
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
                            {projectModalState.mode === 'edit' ? 'Guardar cambios' : 'Crear proyecto'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isShowing={reassignModalState.isOpen}
                setIsShowing={setReassignModalVisibility}
                onClose={closeReassignModal}
                title="Reasignar proyecto"
            >
                <form className="clients__reassign-form" onSubmit={submitReassign}>
                    <p className="clients__reassign-copy">
                        Selecciona el cliente al que deseas reasignar el proyecto
                        <strong> {reassignModalState.project?.nombre}</strong>.
                    </p>
                    <label className="clients__project-form-field">
                        Cliente destino
                        <select
                            value={reassignModalState.targetId}
                            onChange={(event) =>
                                setReassignModalState((prev) => ({ ...prev, targetId: event.target.value }))
                            }
                        >
                            <option value="">Selecciona un cliente</option>
                            {sortedClients
                                .filter((client) => client.id !== reassignModalState.client?.id)
                                .map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.nombre}
                                    </option>
                                ))}
                        </select>
                    </label>
                    <div className="clients__project-form-actions">
                        <button type="button" className="btn btn-light" onClick={closeReassignModal}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Reasignar proyecto
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default Clientes;
