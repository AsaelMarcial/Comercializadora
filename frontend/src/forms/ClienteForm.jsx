import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import FormField from '../components/FormField';
import {
    createClienteMutation,
    updateClienteMutation,
    CREATE_MUTATION_OPTIONS,
    UPDATE_MUTATION_OPTIONS
} from '../utils/mutations';

const ClienteForm = ({ cancelAction, clienteUpdate }) => {
    const [cliente, setCliente] = useState(clienteUpdate ?? {
        nombre: '',
        direccion: '',
        proyecto: '',
        descuento: ''
    });

    const queryClient = useQueryClient();

    const createMutation = useMutation(createClienteMutation, {
        ...CREATE_MUTATION_OPTIONS,
        onSuccess: () => {
            queryClient.invalidateQueries('clientes');
            resetForm(); // Limpia el formulario
            cancelAction(); // Cierra el modal
        }
    });

    const updateMutation = useMutation(updateClienteMutation, {
        ...UPDATE_MUTATION_OPTIONS,
        onSuccess: () => {
            queryClient.invalidateQueries('clientes');
            resetForm(); // Limpia el formulario
            cancelAction(); // Cierra el modal
        }
    });

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setCliente((prevCliente) => ({
            ...prevCliente,
            [name]: value
        }));
    };

    const submitCliente = async () => {
        try {
            if (cliente.id) {
                await updateMutation.mutateAsync(cliente); // Actualización
            } else {
                await createMutation.mutateAsync(cliente); // Creación
            }
        } catch (error) {
            console.error('Error al guardar el cliente:', error);
        }
    };


    const resetForm = () => {
        setCliente({
            nombre: '',
            direccion: '',
            proyecto: '',
            descuento: ''
        });
    };

    return (
        <div>
            <div className="modal-header">
                <h2>{cliente.id ? 'Editar Cliente' : 'Registrar Cliente'}</h2>
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
                        placeholder="Nombre del Cliente"
                        value={cliente.nombre}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="direccion"
                        inputType="text"
                        iconClasses="fa-solid fa-map-marker-alt"
                        placeholder="Dirección"
                        value={cliente.direccion}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="proyecto"
                        inputType="text"
                        iconClasses="fa-solid fa-project-diagram"
                        placeholder="Proyecto"
                        value={cliente.proyecto}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="descuento"
                        inputType="number"
                        iconClasses="fa-solid fa-percent"
                        placeholder="Descuento (%)"
                        value={cliente.descuento}
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
                    <button type="button" className="btn btn-primary" onClick={submitCliente}>
                        {`${cliente.id ? 'Actualizar' : 'Guardar'}`}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ClienteForm;
