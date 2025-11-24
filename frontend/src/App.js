// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from './pages/Layout';
import Home from './pages/Home';
import Incomes from './pages/Incomes';
import Outcomes from './pages/Outcomes';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Ventas from './pages/Ventas';
import GananciasPorProducto from './pages/GananciasPorProducto';
import Users from './pages/Users';
import Help from './pages/Help';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import ConfirmacionCotizacion from "./pages/ConfirmacionCotizacion";
import Proveedores from './pages/Proveedores';
import Cotizaciones from "./pages/Cotizaciones";
import Clientes from "./pages/Clientes";
import Proyectos from './pages/Proyectos';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública: Login */}
        <Route path="/login" element={<Login />} />

        {/* Rutas privadas */}
        <Route element={<PrivateRoute />}>
          <Route path="/app" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="incomes" element={<Incomes />} />
            <Route path="outcomes" element={<Outcomes />} />
            <Route path="products" element={<Products />} />
            <Route path="reports" element={<Reports />} />
            <Route path="ventas" element={<Ventas />} />
            <Route path="ventas/ganancias" element={<GananciasPorProducto />} />
            <Route path="ventas/confirmacion" element={<ConfirmacionCotizacion />} />
            <Route path="ventas/cotizaciones" element={<Cotizaciones />} />
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="clientes" element={<Clientes />} /> {/* Nueva ruta para clientes */}
            <Route path="proyectos" element={<Proyectos />} />
            <Route path="users" element={<Users />} />
            <Route path="help" element={<Help />} />
          </Route>
        </Route>

        {/* Redirección a login para rutas no válidas */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
