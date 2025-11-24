import React, { useEffect, useState } from 'react';
import FormField from '../components/FormField';
import '../css/modal.css';

const emptySucursal = {
    nombre: '',
    direccion: '',
    telefono: '',
    contacto: '',
    horario: '',
};

const SucursalForm = ({ cancelAction, sucursalUpdate, onSave }) => {
    const [sucursal, setSucursal] = useState(sucursalUpdate ?? emptySucursal);

    useEffect(() => {
        if (!sucursalUpdate) {
            setSucursal(emptySucursal);
            return;
        }

        setSucursal({ ...emptySucursal, ...sucursalUpdate });
    }, [sucursalUpdate]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setSucursal((prevSucursal) => ({
            ...prevSucursal,
            [name]: value,
        }));
    };

    const submitSucursal = (event) => {
        event.preventDefault();
        onSave?.(sucursal);
    };

    const resetForm = () => {
        setSucursal(emptySucursal);
    };

    return (
        <div className="supplier-modal">
            <div className="modal-header supplier-modal__header">
                <div className="supplier-modal__title">
                    <span className="supplier-modal__eyebrow">Catálogo de sucursales</span>
                    <h2>{sucursal.id ? 'Editar sucursal' : 'Registrar sucursal'}</h2>
                    <p className="supplier-modal__helper">
                        Administra los puntos de atención y mantén a tu equipo informado sobre horarios y contactos.
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
            <form className="supplier-form" onSubmit={submitSucursal}>
                <div className="modal-body supplier-form__body">
                    <section className="supplier-form__section">
                        <div className="supplier-form__section-header">
                            <div>
                                <p className="supplier-form__section-eyebrow">Identidad</p>
                                <h3>Información principal</h3>
                                <p className="supplier-form__section-helper">
                                    Define el nombre y ubicación para que el equipo pueda localizarla fácilmente.
                                </p>
                            </div>
                            <i className="fa-solid fa-building" aria-hidden="true"></i>
                        </div>
                        <div className="supplier-form__section-grid">
                            <FormField
                                name="nombre"
                                inputType="text"
                                iconClasses="fa-solid fa-store"
                                placeholder="Nombre de la sucursal"
                                value={sucursal.nombre}
                                onChange={handleInputChange}
                                required
                            />
                            <FormField
                                name="direccion"
                                inputType="text"
                                iconClasses="fa-solid fa-map-marker-alt"
                                placeholder="Dirección"
                                value={sucursal.direccion}
                                onChange={handleInputChange}
                            />
                        </div>
                    </section>

                    <section className="supplier-form__section">
                        <div className="supplier-form__section-header">
                            <div>
                                <p className="supplier-form__section-eyebrow">Contacto</p>
                                <h3>Datos de referencia</h3>
                                <p className="supplier-form__section-helper">
                                    Agrega el responsable y medios de comunicación disponibles.
                                </p>
                            </div>
                            <i className="fa-solid fa-address-book" aria-hidden="true"></i>
                        </div>
                        <div className="supplier-form__section-grid">
                            <FormField
                                name="contacto"
                                inputType="text"
                                iconClasses="fa-solid fa-user-tie"
                                placeholder="Persona de contacto"
                                value={sucursal.contacto}
                                onChange={handleInputChange}
                            />
                            <FormField
                                name="telefono"
                                inputType="text"
                                iconClasses="fa-solid fa-phone"
                                placeholder="Teléfono"
                                value={sucursal.telefono}
                                onChange={handleInputChange}
                            />
                            <FormField
                                name="horario"
                                inputType="text"
                                iconClasses="fa-solid fa-clock"
                                placeholder="Horario de atención"
                                value={sucursal.horario}
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
                        {sucursal.id ? 'Actualizar sucursal' : 'Guardar sucursal'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SucursalForm;
