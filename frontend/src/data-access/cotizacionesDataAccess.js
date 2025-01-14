import { API_HOST, processResponse } from './dataAccessUtils';

const API_SERVICE = 'cotizaciones';

// Crear una nueva cotización
export const createCotizacion = async (cotizacion) => {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_HOST}/${API_SERVICE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`, // Incluye el token aquí
            },
            body: JSON.stringify(cotizacion),
        });

        return await processResponse(response);
    } catch (error) {
        console.error('Error al crear la cotización:', error);
        throw new Error(`Error al crear la cotización: ${error.message}`);
    }
};

// Actualizar una cotización existente
export const updateCotizacion = async (cotizacion) => {
    const token = localStorage.getItem('token');
    const { id, ...cotizacionData } = cotizacion; // Extrae el ID y los datos de la cotización

    try {
        const response = await fetch(`${API_HOST}/${API_SERVICE}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`, // Incluye el token aquí
            },
            body: JSON.stringify(cotizacionData),
        });

        return await processResponse(response);
    } catch (error) {
        console.error('Error al actualizar la cotización:', error);
        throw new Error(`Error al actualizar la cotización: ${error.message}`);
    }
};

// Obtener una cotización por ID
export const getCotizacionById = async (id) => {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_HOST}/${API_SERVICE}/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`, // Incluye el token aquí
            },
        });

        return await processResponse(response);
    } catch (error) {
        console.error('Error al obtener la cotización:', error);
        throw new Error(`Error al obtener la cotización: ${error.message}`);
    }
};

// Obtener todas las cotizaciones
export const getAllCotizaciones = async () => {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_HOST}/${API_SERVICE}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`, // Incluye el token aquí
            },
        });

        return await processResponse(response);
    } catch (error) {
        console.error('Error al obtener las cotizaciones:', error);
        throw new Error(`Error al obtener las cotizaciones: ${error.message}`);
    }
};

// Eliminar una cotización
export const deleteCotizacion = async (id) => {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_HOST}/${API_SERVICE}/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`, // Incluye el token aquí
            },
        });

        return await processResponse(response);
    } catch (error) {
        console.error('Error al eliminar la cotización:', error);
        throw new Error(`Error al eliminar la cotización: ${error.message}`);
    }
};

export const downloadCotizacionPDF = async (cotizacionId) => {
    const token = localStorage.getItem('token');
    const url = `${API_HOST}/cotizaciones/${cotizacionId}/pdf`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Error al descargar el PDF: ${response.statusText}`);
        }

        // Convertir la respuesta en blob
        const blob = await response.blob();

        // Crear un enlace de descarga dinámico
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Cotizacion_${cotizacionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        console.log('PDF descargado con éxito');
    } catch (error) {
        console.error('Error al descargar el PDF:', error);
        throw error;
    }
};