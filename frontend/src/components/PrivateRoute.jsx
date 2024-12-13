// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  const token = localStorage.getItem('token'); // Verificar si el token existe
  return token ? <Outlet /> : <Navigate to="/login" />; // Si no hay token, redirige al login
};

export default PrivateRoute;
