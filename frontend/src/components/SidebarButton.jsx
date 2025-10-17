import React from 'react';
import { NavLink } from 'react-router-dom';

const SidebarButton = ({ to, iconClasses, label }) => {
    const isRoot = to === '/app';

    return (
        <li className="sidebar__item">
            <NavLink
                to={to}
                end={isRoot}
                className={({ isActive }) =>
                    `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                }
                title={label}
            >
                <span className="sidebar__icon" aria-hidden="true">
                    <i className={iconClasses}></i>
                </span>
                <span className="sidebar__label">{label}</span>
            </NavLink>
        </li>
    );
};

export default SidebarButton;