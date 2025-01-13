// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import jwtDecode from 'jwt-decode';

const PrivateRoute = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" />;
  }

  try {
    const decodedToken = jwtDecode(token);

    // Verificar expiración del token si tiene un campo `exp`
    if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
      localStorage.removeItem('token'); // Eliminar token expirado
      return <Navigate to="/login" />;
    }

    return <Outlet />;
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    localStorage.removeItem('token'); // Eliminar token inválido
    return <Navigate to="/login" />;
  }
};

export default PrivateRoute;
