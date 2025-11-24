import React, { useEffect, useState } from 'react';
import FormField from '../components/FormField';
import '../css/modal.css';

const emptyProveedor = {
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    contacto: '',
};

const ProveedorForm = ({ cancelAction, proveedorUpdate, onSave }) => {
    const [proveedor, setProveedor] = useState(proveedorUpdate ?? emptyProveedor);

    useEffect(() => {
        if (!proveedorUpdate) {
            setProveedor(emptyProveedor);
            return;
        }

        setProveedor({ ...emptyProveedor, ...proveedorUpdate });
    }, [proveedorUpdate]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setProveedor((prevProveedor) => ({
            ...prevProveedor,
            [name]: value,
        }));
    };

    const submitProveedor = (event) => {
        event.preventDefault();
        onSave?.(proveedor);
    };

    const resetForm = () => {
        setProveedor(emptyProveedor);
    };

    return (
        <div className="supplier-modal">
            <div className="modal-header supplier-modal__header">
                <div className="supplier-modal__title">
                    <span className="supplier-modal__eyebrow">Gestión de proveedores</span>
                    <h2>{proveedor.id ? 'Editar Proveedor' : 'Registrar Proveedor'}</h2>
                    <p className="supplier-modal__helper">
                        Estandariza los datos de contacto para agilizar negociaciones y asegurar respuestas rápidas.
                    </p>
                </div>
                <button
                    type="button"
                    className="close-button"
                    onClick={() => {
                        resetForm();
                        cancelAction();
                    }}
                >
                    &times;
                </button>
            </div>
            <form className="supplier-form" onSubmit={submitProveedor}>
                <div className="modal-body supplier-form__body">
                    <section className="supplier-form__section">
                        <div className="supplier-form__section-header">
                            <div>
                                <p className="supplier-form__section-eyebrow">Identidad</p>
                                <h3>Información general</h3>
                                <p className="supplier-form__section-helper">
                                    Define cómo aparecerá el proveedor en reportes y listados.
                                </p>
                            </div>
                            <i className="fa-solid fa-handshake-angle" aria-hidden="true"></i>
                        </div>
                        <div className="supplier-form__section-grid">
                            <FormField
                                name="nombre"
                                inputType="text"
                                iconClasses="fa-solid fa-user"
                                placeholder="Nombre del Proveedor"
                                value={proveedor.nombre}
                                onChange={handleInputChange}
                            />
                            <FormField
                                name="direccion"
                                inputType="text"
                                iconClasses="fa-solid fa-map-marker-alt"
                                placeholder="Dirección"
                                value={proveedor.direccion}
                                onChange={handleInputChange}
                            />
                        </div>
                    </section>

                    <section className="supplier-form__section">
                        <div className="supplier-form__section-header">
                            <div>
                                <p className="supplier-form__section-eyebrow">Comunicación</p>
                                <h3>Datos de contacto</h3>
                                <p className="supplier-form__section-helper">
                                    Prioriza los canales que facilitan la coordinación diaria.
                                </p>
                            </div>
                            <i className="fa-solid fa-address-book" aria-hidden="true"></i>
                        </div>
                        <div className="supplier-form__section-grid">
                            <FormField
                                name="telefono"
                                inputType="text"
                                iconClasses="fa-solid fa-phone"
                                placeholder="Teléfono"
                                value={proveedor.telefono}
                                onChange={handleInputChange}
                            />
                            <FormField
                                name="email"
                                inputType="email"
                                iconClasses="fa-solid fa-envelope"
                                placeholder="Correo Electrónico"
                                value={proveedor.email}
                                onChange={handleInputChange}
                            />
                            <FormField
                                name="contacto"
                                inputType="text"
                                iconClasses="fa-solid fa-user-tie"
                                placeholder="Persona de Contacto"
                                value={proveedor.contacto}
                                onChange={handleInputChange}
                            />
                        </div>
                    </section>
                </div>

                <div className="modal-footer supplier-modal__footer">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                            resetForm();
                            cancelAction();
                        }}
                    >
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {proveedor.id ? 'Actualizar proveedor' : 'Guardar proveedor'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProveedorForm;
