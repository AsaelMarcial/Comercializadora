import jwtDecode from 'jwt-decode';

export const getUserFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);

    // Validar si el token ha expirado
    const currentTime = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
    if (decoded.exp && decoded.exp < currentTime) {
      console.warn('Token expirado');
      localStorage.removeItem('token'); // Elimina el token expirado
      return null;
    }

    return decoded; // Retorna el token decodificado si es válido
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    return null;
  }
};
