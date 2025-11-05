import { API_HOST, processResponse } from "./dataAccessUtils";

const API_SERVICE = 'clientes';

const getClienteUrl = (clienteId) => `${API_HOST}/${API_SERVICE}/${clienteId}`;
const getClienteProjectsUrl = (clienteId) => `${getClienteUrl(clienteId)}/proyectos`;
const getProyectoReassignUrl = (proyectoId) => `${API_HOST}/${API_SERVICE}/proyectos/${proyectoId}/reasignar`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token no encontrado en localStorage');
        return {};
    }
    return { Authorization: `Bearer ${token}` };
};

const normalizeClientePayload = (cliente) => {
    const proyectos = Array.isArray(cliente.proyectos)
        ? cliente.proyectos
            .filter((proyecto) => proyecto && (proyecto.nombre?.trim() || proyecto.descripcion?.trim()))
            .map((proyecto) => ({
                id: proyecto.id,
                nombre: proyecto.nombre?.trim() ?? '',
                descripcion: proyecto.descripcion?.trim() ?? '',
            }))
        : [];

    const { proyecto: _deprecatedProyecto, ...rest } = cliente;

    return {
        ...rest,
        proyectos,
    };
};

export const createCliente = async (cliente) => {
    try {
        const url = `${API_HOST}/${API_SERVICE}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(normalizeClientePayload(cliente)),
        });

        const savedCliente = await processResponse(response);
        console.log('Cliente creado:', savedCliente);
        return savedCliente;
    } catch (error) {
        console.error('Error creando cliente:', error);
        throw new Error(`Error creando cliente: ${error.message}`);
    }
};

export const readAllClientes = async () => {
    try {
        const url = `${API_HOST}/${API_SERVICE}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...getAuthHeaders(),
            },
        });

        const clientes = await processResponse(response);
        return clientes.map((cliente) => ({
            ...cliente,
            proyectos: Array.isArray(cliente.proyectos) ? cliente.proyectos : [],
        }));
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        throw new Error(error.message);
    }
};

export const updateCliente = async (cliente) => {
    const { id } = cliente;
    try {
        const url = getClienteUrl(id);
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(normalizeClientePayload(cliente)),
        });

        await processResponse(response);
        console.log('Cliente actualizado');
    } catch (error) {
        console.error('Error actualizando cliente:', error);
        throw new Error(error.message);
    }
};

export const deleteCliente = async (id) => {
    try {
        const url = getClienteUrl(id);
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                ...getAuthHeaders(),
            },
        });

        await processResponse(response);
        console.log('Cliente eliminado');
    } catch (error) {
        console.error('Error eliminando cliente:', error);
        throw error;
    }
};

export const createClienteProject = async ({ clienteId, proyecto }) => {
    try {
        const response = await fetch(getClienteProjectsUrl(clienteId), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(proyecto),
        });

        return await processResponse(response);
    } catch (error) {
        console.error('Error creando proyecto para cliente:', error);
        throw error;
    }
};

export const updateClienteProject = async ({ clienteId, proyectoId, proyecto }) => {
    try {
        const response = await fetch(`${getClienteProjectsUrl(clienteId)}/${proyectoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(proyecto),
        });

        return await processResponse(response);
    } catch (error) {
        console.error('Error actualizando proyecto de cliente:', error);
        throw error;
    }
};

export const deleteClienteProject = async ({ clienteId, proyectoId }) => {
    try {
        const response = await fetch(`${getClienteProjectsUrl(clienteId)}/${proyectoId}`, {
            method: 'DELETE',
            headers: {
                ...getAuthHeaders(),
            },
        });

        await processResponse(response);
    } catch (error) {
        console.error('Error eliminando proyecto de cliente:', error);
        throw error;
    }
};

export const reassignClienteProject = async ({ proyectoId, clienteDestinoId }) => {
    try {
        const response = await fetch(getProyectoReassignUrl(proyectoId), {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify({ clienteId: clienteDestinoId }),
        });

        return await processResponse(response);
    } catch (error) {
        console.error('Error reasignando proyecto de cliente:', error);
        throw error;
    }
};
