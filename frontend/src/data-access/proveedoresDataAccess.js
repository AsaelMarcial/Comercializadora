import { API_HOST, processResponse } from "./dataAccessUtils";

const API_SERVICE = 'proveedores';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token no encontrado en localStorage');
        return {};
    }
    return { Authorization: `Bearer ${token}` };
};

export const createProveedor = async (proveedor) => {
    try {
        const url = `${API_HOST}/${API_SERVICE}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(proveedor),
        });

        const savedProveedor = await processResponse(response);
        console.log('Proveedor creado:', savedProveedor);
        return savedProveedor;
    } catch (error) {
        console.error('Error creando proveedor:', error);
        throw new Error(`Error creando proveedor: ${error.message}`);
    }
};

export const readAllProveedores = async () => {
    try {
        const url = `${API_HOST}/${API_SERVICE}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...getAuthHeaders(),
            },
        });

        const proveedores = await processResponse(response);
        return proveedores;
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        throw new Error(error.message);
    }
};

export const updateProveedor = async (proveedor) => {
    const { id } = proveedor;
    try {
        const url = `${API_HOST}/${API_SERVICE}/${id}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(proveedor),
        });

        await processResponse(response);
        console.log('Proveedor actualizado');
    } catch (error) {
        console.error('Error actualizando proveedor:', error);
        throw new Error(error.message);
    }
};

export const deleteProveedor = async (id) => {
    try {
        const url = `${API_HOST}/${API_SERVICE}/${id}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                ...getAuthHeaders(),
            },
        });

        await processResponse(response);
        console.log('Proveedor eliminado');
    } catch (error) {
        console.error('Error eliminando proveedor:', error);
        throw new Error(error.message);
    }
};
