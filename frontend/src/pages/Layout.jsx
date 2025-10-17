// src/pages/Layout.jsx
import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import SidebarButton from '../components/SidebarButton';
import '../css/layout.css';
import '../css/botones.css';
import '../css/datatable.css';

export const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <>
      <aside className={`sidebar ${isSidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__top">
          <button
            type="button"
            className="sidebar__toggle"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? 'Contraer menú lateral' : 'Expandir menú lateral'}
          >
            <i className={`fa-solid ${isSidebarOpen ? 'fa-chevron-left' : 'fa-bars'}`} aria-hidden="true"></i>
          </button>
          <div className="sidebar__brand">
            <span className="sidebar__brand-mark" aria-hidden="true">ORZA</span>
            <span className="sidebar__brand-subtitle">Comercializadora</span>
          </div>
        </div>

        <nav className="sidebar__navigation" aria-label="Menú principal">
          <p className="sidebar__section-label">Panel</p>
          <ul className="sidebar__nav-list">
            <SidebarButton to="/app" iconClasses="fa-solid fa-gauge-high" label="Inicio" />
            <SidebarButton to="/app/users" iconClasses="fa-solid fa-user-group" label="Usuarios" />
            <SidebarButton to="/app/products" iconClasses="fa-solid fa-box-archive" label="Productos" />
            <SidebarButton to="/app/clientes" iconClasses="fa-solid fa-address-card" label="Clientes" />
            <SidebarButton to="/app/proveedores" iconClasses="fa-solid fa-truck-ramp-box" label="Proveedores" />
          </ul>

          <p className="sidebar__section-label">Operaciones</p>
          <ul className="sidebar__nav-list">
            <SidebarButton to="/app/ventas" iconClasses="fa-solid fa-store" label="Ventas" />
            <SidebarButton to="/app/ventas/cotizaciones" iconClasses="fa-solid fa-file-signature" label="Cotizaciones" />
          </ul>
        </nav>

        <div className="sidebar__profile">
          <div className="sidebar__profile-details">
            <span className="sidebar__profile-name">Usuario</span>
            <span className="sidebar__profile-email">ejemplo@ejemplo.com</span>
          </div>
          <button
            type="button"
            className="sidebar__logout"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
          </button>
        </div>
      </aside>

      <section className="main-seccion">
        <Outlet />
      </section>
    </>
  );
};