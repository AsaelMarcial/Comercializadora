// src/utils/auth.js
import jwtDecode from 'jwt-decode';

export const getUserFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded; // Devolver el objeto decodificado del token
  } catch (error) {
    console.error('Token inválido:', error);
    return null;
  }
};
