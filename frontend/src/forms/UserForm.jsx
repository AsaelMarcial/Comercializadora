import React, { useState } from 'react';
import PropTypes from 'prop-types';

const UserForm = ({ userUpdate, cancelAction, saveAction }) => {
    const [formData, setFormData] = useState({
        nombre: userUpdate?.nombre || '',
        email: userUpdate?.email || '',
        rol: userUpdate?.rol || '',
        password: '', // Nuevo campo para contraseña
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveAction(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="nombre">Nombre</label>
                <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="form-control"
                />
            </div>
            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-control"
                />
            </div>
            <div className="form-group">
                <label htmlFor="rol">Rol</label>
                <select
                    id="rol"
                    name="rol"
                    value={formData.rol}
                    onChange={handleChange}
                    required
                    className="form-control"
                >
                    <option value="">Selecciona un rol</option>
                    <option value="ADMIN">Admin</option>
                    <option value="VENDEDOR">Vendedor</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="form-control"
                />
            </div>
            <div className="form-group">
                <button type="submit" className="btn btn-primary">
                    {userUpdate ? 'Actualizar Usuario' : 'Registrar Usuario'}
                </button>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cancelAction}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
};

UserForm.propTypes = {
    userUpdate: PropTypes.object,
    cancelAction: PropTypes.func.isRequired,
    saveAction: PropTypes.func.isRequired,
};

export default UserForm;
