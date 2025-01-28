import { API_HOST, processResponse } from "./dataAccessUtils";

const API_SERVICE = 'clientes';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token no encontrado en localStorage');
        return {};
    }
    return { Authorization: `Bearer ${token}` };
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
            body: JSON.stringify(cliente),
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
        return clientes;
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        throw new Error(error.message);
    }
};

export const updateCliente = async (cliente) => {
    const { id } = cliente;
    try {
        const url = `${API_HOST}/${API_SERVICE}/${id}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(cliente),
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
        const url = `${API_HOST}/clientes/${id}`;
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
