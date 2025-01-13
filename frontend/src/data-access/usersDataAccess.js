import { API_HOST, processResponse } from "./dataAccessUtils";

// Agregar función para obtener el token
const getToken = () => localStorage.getItem('token');

const API_SERVICE = 'usuarios';

export const createUser = (user) => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${API_HOST}/${API_SERVICE}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`, // Incluir el token
                },
                body: JSON.stringify(user)
            });
            await processResponse(response);
            resolve();
        } catch (error) {
            reject(error.message);
        }
    });
}

export const readAllUsers = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${API_HOST}/${API_SERVICE}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${getToken()}`, // Incluir el token
                },
            });

            // Procesar la respuesta
            const users = await processResponse(response);
            resolve(users);
        } catch (error) {
            console.error("Error al obtener usuarios: ", error);
            reject(error.message);
        }
    });
};

export const updateUser = (user) => {
    const { id } = user;
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${API_HOST}/${API_SERVICE}/${id}`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`, // Incluir el token
                },
                body: JSON.stringify(user)
            });
            await processResponse(response);
            resolve();
        } catch (error) {
            reject(error.message);
        }
    });
}

export const deleteUser = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${API_HOST}/${API_SERVICE}/${id}`;
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getToken()}`, // Incluir el token
                },
            });
            await processResponse(response);
            resolve();
        } catch (error) {
            reject(error.message);
        }
    });
}

export const login = (credentials) => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${API_HOST}/login`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await processResponse(response);
            localStorage.setItem('token', data.access_token); // Guarda el token de acceso
            localStorage.setItem('user_info', JSON.stringify(data.user_info)); // Guarda la info del usuario
            resolve(data);
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            reject(error.message);
        }
    });
};