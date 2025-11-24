import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import NavigationTitle from '../components/NavigationTitle';
import { readAllProjects } from '../data-access/projectsDataAccess';
import '../css/projects.css';

const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha registrada';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Sin fecha registrada';
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(date);
};

const Proyectos = () => {
    const queryClient = useQueryClient();
    const { data: projects, isLoading } = useQuery('projects', readAllProjects);
    const [searchTerm, setSearchTerm] = useState('');
    const [clientFilter, setClientFilter] = useState('todos');
    const [addressFilter, setAddressFilter] = useState('todos');

    useEffect(() => {
        document.title = 'Orza - Proyectos';
    }, []);

    const projectsWithFallbacks = useMemo(() => {
        if (!projects) return [];

        return projects.map((project) => ({
            ...project,
            nombre: project.nombre || 'Proyecto sin nombre',
            descripcion: project.descripcion || 'Sin descripción disponible.',
            direccion: project.direccion || '',
            clienteNombre: project.clienteNombre || (project.clienteId ? `Cliente #${project.clienteId}` : 'Sin cliente'),
        }));
    }, [projects]);

    const uniqueClients = useMemo(() => {
        const clients = new Map();
        projectsWithFallbacks.forEach((project) => {
            if (project.clienteId || project.clienteNombre) {
                clients.set(project.clienteId || project.clienteNombre, project.clienteNombre);
            }
        });
        return Array.from(clients.entries()).map(([id, name]) => ({ id: id ?? 'sin-id', name }));
    }, [projectsWithFallbacks]);

    const filteredProjects = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return projectsWithFallbacks.filter((project) => {
            const matchesSearch = normalizedSearch
                ? [project.nombre, project.descripcion, project.direccion, project.clienteNombre]
                      .filter(Boolean)
                      .some((field) => field.toLowerCase().includes(normalizedSearch))
                : true;

            const matchesClient = clientFilter === 'todos' ? true : String(project.clienteId) === clientFilter;

            const matchesAddress =
                addressFilter === 'todos'
                    ? true
                    : addressFilter === 'con-direccion'
                    ? Boolean(project.direccion)
                    : !project.direccion;

            return matchesSearch && matchesClient && matchesAddress;
        });
    }, [projectsWithFallbacks, searchTerm, clientFilter, addressFilter]);

    const totalProjects = projectsWithFallbacks.length;
    const projectsWithAddress = projectsWithFallbacks.filter((project) => project.direccion).length;
    const clientsInvolved = new Set(projectsWithFallbacks.map((project) => project.clienteId || project.clienteNombre));
    const averageProjectsPerClient = clientsInvolved.size
        ? (totalProjects / clientsInvolved.size).toFixed(1)
        : '0.0';

    const handleCopyAddress = async (project) => {
        if (!project.direccion) {
            toast('Este proyecto no tiene dirección registrada.', { type: 'info' });
            return;
        }

        try {
            await navigator.clipboard.writeText(project.direccion);
            toast('Dirección copiada en el portapapeles', { type: 'success' });
        } catch (error) {
            console.error('No se pudo copiar la dirección:', error);
            toast('No se pudo copiar la dirección. Intenta nuevamente.', { type: 'error' });
        }
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries('projects');
    };

    return (
        <>
            <NavigationTitle menu="Operación" submenu="Proyectos" />
            <div className="projects">
                <section className="projects__hero">
                    <div className="projects__hero-copy">
                        <p className="projects__hero-eyebrow">Panel de proyectos</p>
                        <h1 className="projects__hero-title">Controla los avances clave en un solo lugar</h1>
                        <p className="projects__hero-subtitle">
                            Visualiza el estado de tus obras, confirma la información de contacto y comparte direcciones
                            rápidamente con tu equipo.
                        </p>
                        <div className="projects__hero-actions">
                            <button type="button" className="projects__primary-action" onClick={handleRefresh}>
                                <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                                Actualizar lista
                            </button>
                            <button
                                type="button"
                                className="projects__ghost-action"
                                onClick={() => setSearchTerm('')}
                                disabled={!searchTerm}
                            >
                                <i className="fa-solid fa-eraser" aria-hidden="true"></i>
                                Limpiar filtros
                            </button>
                        </div>
                    </div>
                    <div className="projects__hero-stats" aria-label="Indicadores de proyectos">
                        <article className="projects__stat">
                            <span className="projects__stat-label">Proyectos activos</span>
                            <strong className="projects__stat-value">{totalProjects}</strong>
                            <p className="projects__stat-help">Registros totales disponibles en el sistema.</p>
                        </article>
                        <article className="projects__stat">
                            <span className="projects__stat-label">Clientes involucrados</span>
                            <strong className="projects__stat-value">{clientsInvolved.size}</strong>
                            <p className="projects__stat-help">{averageProjectsPerClient} proyectos en promedio.</p>
                        </article>
                        <article className="projects__stat">
                            <span className="projects__stat-label">Direcciones confirmadas</span>
                            <strong className="projects__stat-value">{projectsWithAddress}</strong>
                            <p className="projects__stat-help">{totalProjects ? `${Math.round((projectsWithAddress / totalProjects) * 100)}%` : '0%'} con georreferencia.</p>
                        </article>
                        <article className="projects__stat">
                            <span className="projects__stat-label">Sin dirección</span>
                            <strong className="projects__stat-value">{totalProjects - projectsWithAddress}</strong>
                            <p className="projects__stat-help">Prioriza su actualización para visitas en campo.</p>
                        </article>
                    </div>
                </section>

                <section className="projects__toolbar" aria-label="Herramientas de búsqueda y filtros">
                    <div className="projects__search">
                        <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                        <input
                            type="search"
                            placeholder="Buscar por nombre, cliente o dirección"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <div className="projects__filters">
                        <label htmlFor="client-filter">Cliente</label>
                        <select
                            id="client-filter"
                            value={clientFilter}
                            onChange={(event) => setClientFilter(event.target.value)}
                        >
                            <option value="todos">Todos</option>
                            {uniqueClients.map((client) => (
                                <option key={client.id} value={String(client.id)}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="projects__filters">
                        <label htmlFor="address-filter">Dirección</label>
                        <select
                            id="address-filter"
                            value={addressFilter}
                            onChange={(event) => setAddressFilter(event.target.value)}
                        >
                            <option value="todos">Todas</option>
                            <option value="con-direccion">Con dirección</option>
                            <option value="sin-direccion">Sin dirección</option>
                        </select>
                    </div>
                </section>

                <section className="projects__list" aria-live="polite">
                    {isLoading ? (
                        <p className="projects__loading">Cargando proyectos...</p>
                    ) : filteredProjects.length === 0 ? (
                        <div className="projects__empty">
                            <p className="projects__empty-title">Aún no hay proyectos que coincidan con tu búsqueda.</p>
                            <p className="projects__empty-subtitle">
                                Ajusta los filtros o verifica con el equipo comercial para asegurarte de que los datos estén
                                actualizados.
                            </p>
                            <button type="button" className="projects__primary-action" onClick={handleRefresh}>
                                <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                                Reintentar
                            </button>
                        </div>
                    ) : (
                        <div className="projects__grid">
                            {filteredProjects.map((project) => (
                                <article className="projects__card" key={project.id || project.nombre}>
                                    <header className="projects__card-header">
                                        <div className="projects__card-title">
                                            <span className="projects__pill">
                                                <i className="fa-solid fa-diagram-project" aria-hidden="true"></i>
                                                Proyecto
                                            </span>
                                            <h2>{project.nombre}</h2>
                                        </div>
                                        <span className="projects__date" aria-label="Fecha de creación">
                                            {formatDate(project.createdAt)}
                                        </span>
                                    </header>
                                    <p className="projects__description">{project.descripcion}</p>
                                    <dl className="projects__meta">
                                        <div className="projects__meta-row">
                                            <dt>Cliente</dt>
                                            <dd>{project.clienteNombre}</dd>
                                        </div>
                                        <div className="projects__meta-row">
                                            <dt>Dirección</dt>
                                            <dd>{project.direccion || 'Sin dirección registrada'}</dd>
                                        </div>
                                    </dl>
                                    <div className="projects__actions">
                                        <button
                                            type="button"
                                            className="projects__action"
                                            onClick={() => handleCopyAddress(project)}
                                        >
                                            <i className="fa-solid fa-copy" aria-hidden="true"></i>
                                            Copiar dirección
                                        </button>
                                        {project.clienteCorreo && (
                                            <a
                                                className="projects__action projects__action--ghost"
                                                href={`mailto:${project.clienteCorreo}`}
                                            >
                                                <i className="fa-solid fa-envelope" aria-hidden="true"></i>
                                                Escribir al cliente
                                            </a>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
};

export default Proyectos;
