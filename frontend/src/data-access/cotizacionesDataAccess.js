import { API_HOST, processResponse } from './dataAccessUtils';

const API_SERVICE = 'cotizaciones';

// Función para obtener headers
const getHeaders = (includeContentType = true) => {
    const headers = {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
    };
    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

// Función genérica para manejar solicitudes HTTP
const httpRequest = async (url, method, body = null, includeContentType = true) => {
    try {
        const options = {
            method,
            headers: getHeaders(includeContentType),
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        return await processResponse(response);
    } catch (error) {
        console.error(`Error en la solicitud HTTP (${method} - ${url}):`, error);
        throw new Error(`Error en la solicitud HTTP: ${error.message}`);
    }
};

// Crear una nueva cotización
export const createCotizacion = async (cotizacion) => {
    if (!cotizacion || !cotizacion.total || !cotizacion.detalles) {
        throw new Error('La cotización debe tener un total y detalles válidos.');
    }

    return await httpRequest(`${API_HOST}/${API_SERVICE}`, 'POST', cotizacion);
};

// Actualizar una cotización existente
export const updateCotizacion = async (cotizacion) => {
    const { id, ...cotizacionData } = cotizacion;

    if (!id) {
        throw new Error('El ID de la cotización es requerido para actualizar.');
    }

    return await httpRequest(`${API_HOST}/${API_SERVICE}/${id}`, 'PUT', cotizacionData);
};

// Obtener una cotización por ID
export const getCotizacionById = async (id) => {
    if (!id) {
        throw new Error('El ID de la cotización no puede estar vacío.');
    }

    return await httpRequest(`${API_HOST}/${API_SERVICE}/${id}`, 'GET');
};

// Obtener todas las cotizaciones
export const getAllCotizaciones = async () => {
    return await httpRequest(`${API_HOST}/${API_SERVICE}`, 'GET');
};

// Eliminar una cotización
export const deleteCotizacion = async (id) => {
    if (!id) {
        throw new Error('El ID de la cotización no puede estar vacío.');
    }

    // Realiza la solicitud DELETE
    return await httpRequest(`${API_HOST}/${API_SERVICE}/${id}`, 'DELETE', null, false);
};

// Descargar el PDF de una cotización
export const downloadCotizacionPDF = async (cotizacionId) => {
    if (!cotizacionId) {
        throw new Error('El ID de la cotización no puede estar vacío.');
    }

    const url = `${API_HOST}/cotizaciones/${cotizacionId}/pdf`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders(false),
        });

        if (!response.ok) {
            throw new Error(`Error al descargar el PDF: ${response.status} - ${response.statusText}`);
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


// Cancelar una cotización
export const cancelCotizacion = async (cotizacionId) => {
    if (!cotizacionId) throw new Error('El ID de la cotización no puede estar vacío.');

    try {
        const response = await fetch(`${API_HOST}/${API_SERVICE}/${cotizacionId}/cancel`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
        });

        return await processResponse(response);
    } catch (error) {
        console.error('Error al cancelar la cotización:', error);
        throw new Error(`Error al cancelar la cotización: ${error.message}`);
    }
};
