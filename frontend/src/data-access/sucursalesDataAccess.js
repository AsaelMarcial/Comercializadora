import { API_HOST, processResponse } from "./dataAccessUtils";

const API_SERVICE = 'sucursales';
const getClienteSucursalesUrl = (clienteId) => `${API_HOST}/clientes/${clienteId}/sucursales`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token no encontrado en localStorage');
        return {};
    }
    return { Authorization: `Bearer ${token}` };
};

export const readAllSucursales = async () => {
    const url = `${API_HOST}/${API_SERVICE}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { ...getAuthHeaders() },
    });

    return processResponse(response);
};

export const readSucursalesByCliente = async (clienteId) => {
    const url = getClienteSucursalesUrl(clienteId);
    const response = await fetch(url, {
        method: 'GET',
        headers: { ...getAuthHeaders() },
    });

    return processResponse(response);
};

export const createSucursal = async (sucursal) => {
    const url = `${API_HOST}/${API_SERVICE}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        body: JSON.stringify(sucursal),
    });

    return processResponse(response);
};

export const updateSucursal = async (sucursal) => {
    const { id, ...payload } = sucursal;
    const url = `${API_HOST}/${API_SERVICE}/${id}`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    });

    return processResponse(response);
};

export const deleteSucursal = async (id) => {
    const url = `${API_HOST}/${API_SERVICE}/${id}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
    });

    return processResponse(response);
};
