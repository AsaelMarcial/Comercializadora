import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import FormField from '../components/FormField';
import {
    createProveedorMutation,
    updateProveedorMutation,
    CREATE_MUTATION_OPTIONS,
    UPDATE_MUTATION_OPTIONS
} from '../utils/mutations';

const ProveedorForm = ({ cancelAction, proveedorUpdate }) => {
    const [proveedor, setProveedor] = useState(proveedorUpdate ?? {
        nombre: '',
        direccion: '',
        telefono: '',
        email: '',
        contacto: ''
    });

    const queryClient = useQueryClient();

    const createMutation = useMutation(createProveedorMutation, {
        ...CREATE_MUTATION_OPTIONS,
        onSuccess: () => {
            queryClient.invalidateQueries('proveedores');
            resetForm(); // Limpia el formulario
            cancelAction(); // Cierra el modal
        }
    });

    const updateMutation = useMutation(updateProveedorMutation, {
        ...UPDATE_MUTATION_OPTIONS,
        onSuccess: () => {
            queryClient.invalidateQueries('proveedores');
            resetForm(); // Limpia el formulario
            cancelAction(); // Cierra el modal
        }
    });

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setProveedor((prevProveedor) => ({
            ...prevProveedor,
            [name]: value
        }));
    };

    const submitProveedor = async () => {
        try {
            if (proveedor.id) {
                // Actualización
                await updateMutation.mutateAsync(proveedor);
            } else {
                // Creación
                await createMutation.mutateAsync(proveedor);
            }
        } catch (error) {
            console.error('Error al guardar el proveedor:', error);
        }
    };

    const resetForm = () => {
        setProveedor({
            nombre: '',
            direccion: '',
            telefono: '',
            email: '',
            contacto: ''
        });
    };

    return (
        <div>
            <div className="modal-header">
                <h2>{proveedor.id ? 'Editar Proveedor' : 'Registrar Proveedor'}</h2>
                <button
                    type="button"
                    className="close-button"
                    onClick={() => {
                        resetForm(); // Limpia el formulario
                        cancelAction(); // Cierra el modal
                    }}
                >
                    &times;
                </button>
            </div>
            <form>
                <div className="modal-body">
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
                        iconClasses="fa-solid fa-address-book"
                        placeholder="Persona de Contacto"
                        value={proveedor.contacto}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => {
                            resetForm(); // Limpia el formulario
                            cancelAction(); // Cierra el modal
                        }}
                    >
                        Cancelar
                    </button>
                    <button type="button" className="btn btn-primary" onClick={submitProveedor}>
                        {`${proveedor.id ? 'Actualizar' : 'Guardar'}`}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProveedorForm;
