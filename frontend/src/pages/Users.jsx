import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import { datatableOptions } from '../utils/datatables';
import { readAllUsers, createUser, updateUser, deleteUser } from '../data-access/usersDataAccess';
import $ from 'jquery';
import Modal from '../components/Modal';
import UserForm from '../forms/UserForm';
import { QUERY_OPTIONS } from '../utils/useQuery';

const Users = () => {
    const { data: users = [], isLoading } = useQuery({
        ...QUERY_OPTIONS,
        queryKey: 'users',
        queryFn: readAllUsers,
    });

    const [isShowingModal, setIsShowingModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const queryClient = useQueryClient();
    const tableRef = useRef();

    const deleteMutation = useMutation(deleteUser, {
        onSuccess: () => {
            queryClient.invalidateQueries('users'); // Invalidar la consulta después de eliminar
        },
    });

    useEffect(() => {
        document.title = 'Orza - Usuarios';
        const table = $(tableRef.current).DataTable(datatableOptions);

        // Limpiar la tabla antes de agregar los nuevos datos
        table.clear();

        // Agregar usuarios a la tabla
        users.forEach(user => {
            table.row.add([
                user.nombre,
                user.email,
                user.rol,
                '', // Opciones aquí
            ]);
        });

        table.draw(); // Redibujar la tabla

        return () => {
            table.destroy(true); // Limpia la tabla al desmontar
        };
    }, [users]);

    async function onDeleteButtonClicked(id) {
        await deleteMutation.mutateAsync(id);
    }

    return (
        <>
            <NavigationTitle menu='Inicio' submenu='Usuarios' />
            {isLoading ? 'Loading...' : (
                <>
                    <button
                        type='button'
                        className='btn-registrar'
                        onClick={() => setIsShowingModal(true)}
                    >
                        <i className='fa-solid fa-plus'></i> Nuevo usuario
                    </button>
                    <div className='contenedor-tabla'>
                        <h3>Usuarios</h3>
                        <table ref={tableRef} className='table table-hover table-borderless'>
                            <thead>
                                <tr>
                                    <th className='leading-row'>Nombre</th>
                                    <th>E-mail</th>
                                    <th>Rol</th>
                                    <th className='trailing-row'>Opciones</th>
                                </tr>
                            </thead>
                            <tbody className='table-group-divider'>
                                {users.length > 0 ? (
                                    users.map(user => (
                                        <tr key={user.id}>
                                            <td className='leading-row'>{user.nombre}</td>
                                            <td>{user.email}</td>
                                            <td>{user.rol}</td>
                                            <td className='trailing-row'>
                                                <button
                                                    type='button'
                                                    className='btn-opciones p-1'
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setIsShowingModal(true);
                                                    }}
                                                >
                                                    <i className='fa-solid fa-pen-to-square'></i>
                                                </button>
                                                <button
                                                    type='button'
                                                    className='btn-opciones p-1'
                                                    onClick={() => {
                                                        onDeleteButtonClicked(user.id);
                                                    }}
                                                >
                                                    <i className='fa-solid fa-trash'></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4}>No hay usuarios disponibles.</td>
                                    </tr>
                                )}
                            </tbody>
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
                    userUpdate={selectedUser}
                />
            </Modal>
        </>
    );
};

export default Users;
