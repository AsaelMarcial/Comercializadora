import { API_HOST, processResponse } from "./dataAccessUtils";

const API_SERVICE = 'usuarios';

export const createUser = (user) => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${API_HOST}/${API_SERVICE}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
            const url = `http://localhost:8000/public/usuarios`; // Asegúrate de que esta URL coincida
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            // Procesar la respuesta
            const users = await processResponse(response);
            resolve(users);
        } catch (error) {
            console.error("Error al obtener usuarios: ", error); // Log de errores
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
                body: JSON.stringify(credentials)
            });
            const data = await processResponse(response);
            resolve(data);
        } catch (error) {
            reject(error.message);
        }
    });
}
