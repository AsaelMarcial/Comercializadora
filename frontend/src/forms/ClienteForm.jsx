import React, { useEffect, useMemo, useState } from 'react';
import FormField from '../components/FormField';

const emptyProject = { nombre: '', descripcion: '', direccion: '' };

const buildInitialState = (clienteUpdate) => ({
    id: clienteUpdate?.id,
    nombre: clienteUpdate?.nombre ?? '',
    direccion: clienteUpdate?.direccion ?? '',
    descuento: clienteUpdate?.descuento ?? '',
    proyectos: Array.isArray(clienteUpdate?.proyectos)
        ? clienteUpdate.proyectos.map((proyecto) => ({
            id: proyecto.id,
            nombre: proyecto.nombre ?? '',
            descripcion: proyecto.descripcion ?? '',
            direccion: proyecto.direccion ?? '',
        }))
        : [],
});

const ClienteForm = ({ cancelAction, clienteUpdate, onSave }) => {
    const [formData, setFormData] = useState(() => buildInitialState(clienteUpdate));

    useEffect(() => {
        setFormData(buildInitialState(clienteUpdate));
    }, [clienteUpdate]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleProjectChange = (index, field, value) => {
        setFormData((prev) => {
            const proyectos = [...prev.proyectos];
            proyectos[index] = {
                ...proyectos[index],
                [field]: value,
            };
            return { ...prev, proyectos };
        });
    };

    const handleAddProject = () => {
        setFormData((prev) => ({
            ...prev,
            proyectos: [...prev.proyectos, { ...emptyProject }],
        }));
    };

    const handleRemoveProject = (index) => {
        setFormData((prev) => ({
            ...prev,
            proyectos: prev.proyectos.filter((_, projectIndex) => projectIndex !== index),
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const sanitizedProjects = formData.proyectos.filter(
            (proyecto) =>
                proyecto.nombre.trim() ||
                proyecto.descripcion.trim() ||
                proyecto.direccion.trim()
        );

        if (onSave) {
            onSave({
                ...formData,
                proyectos: sanitizedProjects,
            });
        }
    };

    const handleCancel = () => {
        setFormData(buildInitialState(null));
        cancelAction();
    };

    const hasProjects = useMemo(() => formData.proyectos.length > 0, [formData.proyectos.length]);

    return (
        <form className="cliente-form" onSubmit={handleSubmit}>
            <div className="modal-body cliente-form__body">
                <div className="cliente-form__fields">
                    <FormField
                        name="nombre"
                        inputType="text"
                        iconClasses="fa-solid fa-user"
                        placeholder="Nombre del Cliente"
                        value={formData.nombre}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="direccion"
                        inputType="text"
                        iconClasses="fa-solid fa-map-marker-alt"
                        placeholder="Dirección"
                        value={formData.direccion}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="descuento"
                        inputType="number"
                        iconClasses="fa-solid fa-percent"
                        placeholder="Descuento (%)"
                        value={formData.descuento}
                        onChange={handleInputChange}
                    />
                </div>

                <section className="cliente-form__projects">
                    <header className="cliente-form__projects-header">
                        <h3>Proyectos</h3>
                        <button type="button" className="cliente-form__add-project" onClick={handleAddProject}>
                            <i className="fa-solid fa-circle-plus" aria-hidden="true"></i>
                            Agregar proyecto
                        </button>
                    </header>

                    {hasProjects ? (
                        <ul className="cliente-form__project-list">
                            {formData.proyectos.map((proyecto, index) => (
                                <li key={proyecto.id ?? index} className="cliente-form__project-item">
                                    <div className="cliente-form__project-fields">
                                        <label className="cliente-form__project-label">
                                            Nombre del proyecto
                                            <input
                                                type="text"
                                                value={proyecto.nombre}
                                                onChange={(event) =>
                                                    handleProjectChange(index, 'nombre', event.target.value)
                                                }
                                                placeholder="Ej. Implementación CRM"
                                            />
                                        </label>
                                        <label className="cliente-form__project-label">
                                            Descripción
                                            <textarea
                                                value={proyecto.descripcion}
                                                onChange={(event) =>
                                                    handleProjectChange(index, 'descripcion', event.target.value)
                                                }
                                                placeholder="Detalles o alcance del proyecto"
                                            />
                                        </label>
                                        <label className="cliente-form__project-label">
                                            Dirección
                                            <input
                                                type="text"
                                                value={proyecto.direccion}
                                                onChange={(event) =>
                                                    handleProjectChange(index, 'direccion', event.target.value)
                                                }
                                                placeholder="Ej. Calle 123, Ciudad"
                                            />
                                        </label>
                                    </div>
                                    <button
                                        type="button"
                                        className="cliente-form__remove-project"
                                        onClick={() => handleRemoveProject(index)}
                                        aria-label="Eliminar proyecto"
                                    >
                                        <i className="fa-solid fa-trash" aria-hidden="true"></i>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="cliente-form__empty-projects">Aún no has añadido proyectos para este cliente.</p>
                    )}
                </section>
            </div>
            <div className="modal-footer cliente-form__footer">
                <button type="button" className="btn btn-danger" onClick={handleCancel}>
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                    {formData.id ? 'Actualizar cliente' : 'Registrar cliente'}
                </button>
            </div>
        </form>
    );
};

export default ClienteForm;
