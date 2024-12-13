// src/utils/fetchWithAuth.js

export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token'); // Obtener el token del localStorage

  // Agregar el encabezado de autorización si el token existe
  const headers = {
    ...options.headers,
    Authorization: token ? `Bearer ${token}` : '',
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error en la solicitud');
  }

  return await response.json();
};
