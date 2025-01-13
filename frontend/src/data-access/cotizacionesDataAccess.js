import { API_HOST, processResponse } from './dataAccessUtils';

const API_SERVICE = 'cotizaciones';

export const createCotizacion = async (cotizacion) => {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_HOST}/cotizaciones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`, // Incluye el token aquí
            },
            body: JSON.stringify(cotizacion),
        });

        await processResponse(response);
        console.log('Cotización creada con éxito');
    } catch (error) {
        console.error('Error al crear la cotización:', error);
        throw new Error(`Error al crear la cotización: ${error.message}`);
    }
};
