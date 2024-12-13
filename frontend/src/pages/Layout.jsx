// src/pages/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import SidebarButton from '../components/SidebarButton';
import '../css/layout.css';
import '../css/botones.css';
import '../css/datatable.css';
import { getUserFromToken } from '../utils/auth'; // Importar el helper

export const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUserFromToken();
    if (user) {
      setUserName(user.nombre); // Establecer el nombre del usuario
    }
  }, []);

  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
  }

  function handleLogout() {
    localStorage.removeItem('token'); // Eliminar el token al cerrar sesión
    navigate('/login'); // Redirigir al login
  }

  return (
    <>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="logo-detalles" onClick={toggleSidebar}>
          <div className="logo_nombre">ORZA</div>
          <i
            className={`bx ${isSidebarOpen ? 'bx-menu-alt-right' : 'bx-menu'}`}
            id="btn"
          ></i>
        </div>
        <ul className="nav-lista">
          <SidebarButton to="/app" iconClasses="fa-solid fa-house" label="Inicio" />
          <SidebarButton to="/app/users" iconClasses="bi bi-people-fill" label="Usuarios" />
          <SidebarButton to="/app/incomes" iconClasses="fa-solid fa-money-bill-trend-up" label="Ingresos" />
          <SidebarButton to="/app/outcomes" iconClasses="fa-solid fa-money-bill-transfer" label="Egresos" />
          <SidebarButton to="/app/reports" iconClasses="fa-solid fa-square-poll-vertical" label="Reportes" />
          <SidebarButton to="/app/menu" iconClasses="fa-solid fa-store" label="Ventas" />
          <SidebarButton to="/app/products" iconClasses="fa-solid fa-boxes-stacked" label="Productos" />
          <SidebarButton to="/app/help" iconClasses="fa-solid fa-circle-question" label="Ayuda" />

          <li className="perfil">
            <div className="perfil-detalles">
              <div className="perfil_nombre">{userName || 'Usuario Desconocido'}</div>
              <div className="perfil_correo">
                <br /> ejemplo@ejemplo.com
              </div>
            </div>
            <i className="bx bx-log-out" id="log_out" onClick={handleLogout}></i>
          </li>
        </ul>
      </div>
      <section className="main-seccion">
        <Outlet /> {/* Mostrar las rutas hijas aquí */}
      </section>
    </>
  );
};
