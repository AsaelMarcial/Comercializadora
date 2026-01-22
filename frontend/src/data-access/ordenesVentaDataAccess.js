import { API_HOST, processResponse } from './dataAccessUtils';

const API_SERVICE = 'ordenes-venta';

const getHeaders = (includeContentType = true) => {
    const headers = {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
    };
    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

export const readAllOrdenesVenta = async () => {
    try {
        const url = `${API_HOST}/${API_SERVICE}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...getHeaders(false),
            },
        });
        return await processResponse(response);
    } catch (error) {
        console.error('Error al obtener órdenes de venta:', error);
        throw new Error(error.message);
    }
};

export const getOrdenVentaById = async (ordenId) => {
    if (!ordenId) throw new Error('El ID de la orden no puede estar vacío.');

    try {
        const url = `${API_HOST}/${API_SERVICE}/${ordenId}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...getHeaders(false),
            },
        });
        return await processResponse(response);
    } catch (error) {
        console.error('Error al obtener la orden de venta:', error);
        throw new Error(error.message);
    }
};

export const updateOrdenVenta = async (ordenId, payload) => {
    if (!ordenId) throw new Error('El ID de la orden no puede estar vacío.');

    try {
        const url = `${API_HOST}/${API_SERVICE}/${ordenId}`;
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                ...getHeaders(true),
            },
            body: JSON.stringify(payload || {}),
        });

        return await processResponse(response);
    } catch (error) {
        console.error('Error al actualizar la orden de venta:', error);
        throw new Error(error.message);
    }
};
