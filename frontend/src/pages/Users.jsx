import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import { datatableOptions } from '../utils/datatables';
import { readAllUsers, createUser, updateUser } from '../data-access/usersDataAccess';
import $ from 'jquery';
import Modal from '../components/Modal';
import UserForm from '../forms/UserForm';
import { QUERY_OPTIONS } from '../utils/useQuery';
import { deleteUserMutation, DELETE_MUTATION_OPTIONS } from '../utils/mutations';

const Users = () => {
    const { data: users, isLoading } = useQuery({
        ...QUERY_OPTIONS,
        queryKey: 'users',
        queryFn: readAllUsers,
    });

    const [isShowingModal, setIsShowingModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const queryClient = useQueryClient();
    const tableRef = useRef();

    const deleteMutation = useMutation(deleteUserMutation, DELETE_MUTATION_OPTIONS);
    const createUserMutation = useMutation(createUser, {
        onSuccess: () => {
            queryClient.invalidateQueries('users');
            alert('Usuario creado con éxito.');
        },
        onError: (error) => {
            console.error('Error al crear el usuario:', error);
            alert('Error al crear el usuario.');
        },
    });
    const updateUserMutation = useMutation(updateUser, {
        onSuccess: () => {
            queryClient.invalidateQueries('users');
            alert('Usuario actualizado con éxito.');
        },
        onError: (error) => {
            console.error('Error al actualizar el usuario:', error);
            alert('Error al actualizar el usuario.');
        },
    });

    useEffect(() => {
        if (users) {
            const table = $(tableRef.current).DataTable({
                ...datatableOptions,
                destroy: true,
                data: users,
                columns: [
                    { data: 'nombre', title: 'Nombre' },
                    { data: 'email', title: 'E-mail' },
                    { data: 'rol', title: 'Rol' },
                    {
                        data: null,
                        title: 'Opciones',
                        orderable: false,
                        render: (_, __, row) => `
                            <button type="button" class="btn-opciones p-1 edit-btn">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="btn-opciones p-1 delete-btn">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        `,
                    },
                ],
            });

            $(tableRef.current).on('click', '.edit-btn', function () {
                const rowData = table.row($(this).closest('tr')).data();
                setSelectedUser(rowData);
                setIsShowingModal(true);
            });

            $(tableRef.current).on('click', '.delete-btn', function () {
                const rowData = table.row($(this).closest('tr')).data();
                onDeleteButtonClicked(rowData.id);
            });

            return () => {
                table.destroy();
            };
        }
    }, [users]);

    async function onDeleteButtonClicked(id) {
        try {
            await deleteMutation.mutateAsync(id);
            queryClient.invalidateQueries('users');
            alert('Usuario eliminado con éxito.');
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            alert('Hubo un error al eliminar el usuario.');
        }
    }

    return (
        <>
            <NavigationTitle menu="Inicio" submenu="Usuarios" />
            {isLoading ? (
                'Cargando...'
            ) : (
                <>
                    <button
                        type="button"
                        className="btn-registrar"
                        onClick={() => setIsShowingModal(true)}
                    >
                        <i className="fa-solid fa-plus"></i> Nuevo usuario
                    </button>
                    <div className="contenedor-tabla">
                        <h3>Usuarios</h3>
                        <table ref={tableRef} className="table table-hover table-borderless">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>E-mail</th>
                                    <th>Rol</th>
                                    <th>Opciones</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </>
            )}

            <Modal
                title={`${selectedUser ? 'Actualizar' : 'Registrar Nuevo'} Usuario`}
                isShowing={isShowingModal}
                setIsShowing={setIsShowingModal}
                onClose={() => {
                    setSelectedUser(null);
                }}
            >
                <UserForm
                    cancelAction={() => {
                        setSelectedUser(null);
                        setIsShowingModal(false);
                    }}
                    saveAction={(userData) => {
                        if (selectedUser) {
                            updateUserMutation.mutate(userData);
                        } else {
                            createUserMutation.mutate(userData);
                        }
                        setIsShowingModal(false);
                    }}
                    userUpdate={selectedUser}
                />
            </Modal>
        </>
    );
};

export default Users;
