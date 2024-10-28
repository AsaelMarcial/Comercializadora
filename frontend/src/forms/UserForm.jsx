import React, { useState } from 'react';
import { useMutation } from 'react-query';
import FormField from '../components/FormField';
import { createUser, updateUser } from '../data-access/usersDataAccess'; // Asegúrate de que estas funciones están importadas

const UserForm = ({ cancelAction, userUpdate }) => {
    // Cambia los nombres de las propiedades para que coincidan con los de la API
    const [user, setUser] = useState(userUpdate ?? {
        nombre: '',
        email: '',
        username: '',
        rol: ''
    });

    const createMutation = useMutation(createUser, {
        onSuccess: () => {
            cancelAction(); // Cerrar modal después de crear
        },
        onError: (error) => {
            alert("Error al crear el usuario: " + error);
        }
    });

    const updateMutation = useMutation(updateUser, {
        onSuccess: () => {
            cancelAction(); // Cerrar modal después de actualizar
        },
        onError: (error) => {
            alert("Error al actualizar el usuario: " + error);
        }
    });

    function handleInputChange(event) {
        setUser(prevUser => ({
            ...prevUser,
            [event.target.name]: event.target.value
        }));
    }

    async function submitUser() {
        try {
            if (user.id) {
                await updateMutation.mutateAsync(user);
            } else {
                await createMutation.mutateAsync(user);
            }
        } catch (error) {
            alert("Error al guardar el usuario: " + error);
        }
    }

    return (
        <form>
            <FormField
                name='nombre' // Cambia el nombre a 'nombre'
                inputType='text'
                iconClasses='fa-solid fa-i-cursor'
                placeholder='Nombre'
                value={user.nombre} // Cambia a 'user.nombre'
                onChange={handleInputChange}
            />
            <FormField
                name='apellido' // Cambia el nombre a 'apellido' si lo tienes en la API
                inputType='text'
                iconClasses='fa-solid fa-i-cursor'
                placeholder='Apellido'
                value={user.apellido} // Cambia a 'user.apellido' si lo tienes en la API
                onChange={handleInputChange}
            />
            <FormField
                name='email'
                inputType='email'
                iconClasses='fa-solid fa-at'
                placeholder='E-mail'
                value={user.email}
                onChange={handleInputChange}
            />
            <FormField
                name='username'
                inputType='text'
                iconClasses='fa-solid fa-user'
                placeholder='Username'
                value={user.username}
                onChange={handleInputChange}
            />
            <FormField
                name='rol'
                inputType='text'
                iconClasses='fa-solid fa-address-book'
                placeholder='Rol'
                value={user.rol}
                onChange={handleInputChange}
            />
            <div className='modal-footer'>
                <button
                    type='button'
                    className='btn btn-danger'
                    onClick={cancelAction}
                >
                    Cancelar
                </button>
                <button
                    type='button'
                    className='btn btn-primary'
                    onClick={submitUser}
                >
                    {`${user.id ? 'Actualizar' : 'Guardar'}`}
                </button>
            </div>
        </form>
    );
};

export default UserForm;
