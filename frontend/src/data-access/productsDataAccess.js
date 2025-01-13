import { API_HOST, processResponse } from "./dataAccessUtils";

const API_SERVICE = 'productos';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); // Asegúrate de guardar "access_token" bajo esta clave
    if (!token) {
        console.error('Token no encontrado en localStorage');
        return {};
    }
    return { Authorization: `Bearer ${token}` };
};

export const createProduct = async (product) => {
    try {
        const url = `${API_HOST}/${API_SERVICE}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(product),
        });

        const savedProduct = await processResponse(response);
        console.log('Producto creado:', savedProduct);
        return savedProduct;
    } catch (error) {
        console.error('Error creando producto:', error);
        throw new Error(`Error creando producto: ${error.message}`);
    }
};

export const readAllProducts = async () => {
    try {
        const url = `${API_HOST}/${API_SERVICE}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...getAuthHeaders(),
            },
        });

        const products = await processResponse(response);
        return products;
    } catch (error) {
        console.error('Error al obtener productos:', error);
        throw new Error(error.message);
    }
};

export const updateProduct = async (product) => {
    const { id } = product;
    try {
        const url = `${API_HOST}/${API_SERVICE}/${id}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(product),
        });

        await processResponse(response);
        console.log('Producto actualizado');
    } catch (error) {
        console.error('Error actualizando producto:', error);
        throw new Error(error.message);
    }
};

export const deleteProduct = async (id) => {
    try {
        const url = `${API_HOST}/${API_SERVICE}/${id}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                ...getAuthHeaders(),
            },
        });

        await processResponse(response);
        console.log('Producto eliminado');
    } catch (error) {
        console.error('Error eliminando producto:', error);
        throw new Error(error.message);
    }
};

export const uploadImage = async (imageFile) => {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await fetch(`${API_HOST}/productos/upload-imagen`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Error al subir la imagen');
        }

        const data = await response.json();
        console.log('Imagen subida con éxito:', data);
        return data.imageUrl; // Asume que el servidor devuelve la URL de la imagen
    } catch (error) {
        console.error('Error al subir la imagen:', error);
        throw new Error(error.message);
    }
};

export const uploadProductImage = async ({ productId, file }) => {
    if (!productId || typeof productId !== 'number') {
        throw new Error('productId debe ser un número válido');
    }

    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No se encontró un token de autenticación.');
    }

    const url = `${API_HOST}/productos/${productId}/upload-imagen`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`, // Incluye el token aquí
            },
            body: file, // `file` ya es un FormData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al subir la imagen: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error en uploadProductImage:', error);
        throw error;
    }
};
