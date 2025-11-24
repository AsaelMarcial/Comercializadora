import { API_HOST, processResponse } from './dataAccessUtils';

const API_SERVICE = 'proyectos';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token no encontrado en localStorage');
        return {};
    }
    return { Authorization: `Bearer ${token}` };
};

const normalizeProject = (project) => {
    if (!project || typeof project !== 'object') return null;

    const nombre = project.nombre?.trim() || 'Proyecto sin nombre';
    const descripcion = project.descripcion?.trim() || '';
    const direccion = project.direccion?.trim() || '';
    const clienteId = project.cliente_id ?? project.cliente?.id ?? null;
    const clienteNombre =
        project.cliente?.nombre?.trim() ?? project.cliente_nombre ?? project.cliente?.razon_social ?? null;
    const clienteCorreo = project.cliente?.correo ?? project.cliente?.email ?? null;
    const clienteTelefono = project.cliente?.telefono ?? null;
    const createdAt = project.created_at ?? project.createdAt ?? project.fecha_creacion ?? null;

    return {
        id: project.id,
        nombre,
        descripcion,
        direccion,
        clienteId,
        clienteNombre,
        clienteCorreo,
        clienteTelefono,
        createdAt,
    };
};

export const readAllProjects = async () => {
    try {
        const url = `${API_HOST}/${API_SERVICE}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...getAuthHeaders(),
            },
        });

        const projects = await processResponse(response);
        if (!Array.isArray(projects)) return [];

        return projects
            .map(normalizeProject)
            .filter((project) => project !== null)
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
    } catch (error) {
        console.error('Error al obtener proyectos:', error);
        throw new Error(error.message);
    }
};
