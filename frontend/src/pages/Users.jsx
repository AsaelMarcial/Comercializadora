import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import { datatableOptions } from '../utils/datatables';
import { readAllUsers, createUser, updateUser } from '../data-access/usersDataAccess';
import $ from 'jquery';
import Modal from '../components/Modal';
import UserForm from '../forms/UserForm';
import { QUERY_OPTIONS } from '../utils/useQuery';
import { deleteUserMutation } from '../utils/mutations';
import { toast } from 'react-toastify';
import '../css/entity-management.css';

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

    const totalUsers = users.length;
    const rolesCount = useMemo(() => {
        return users.reduce((acc, user) => {
            if (user.rol) {
                acc[user.rol] = (acc[user.rol] || 0) + 1;
            }
            return acc;
        }, {});
    }, [users]);

    const deleteMutation = useMutation(deleteUserMutation, {
        onSuccess: () => {
            queryClient.invalidateQueries('users');
            toast.success('Usuario eliminado con éxito');
        },
        onError: (error) => {
            console.error('Error al eliminar usuario:', error);
            toast.error('No fue posible eliminar el usuario.');
        },
    });
    const createUserMutation = useMutation(createUser, {
        onSuccess: () => {
            queryClient.invalidateQueries('users');
            toast.success('Usuario creado correctamente');
        },
        onError: (error) => {
            console.error('Error al crear el usuario:', error);
            toast.error('No pudimos crear el usuario.');
        },
    });
    const updateUserMutation = useMutation(updateUser, {
        onSuccess: () => {
            queryClient.invalidateQueries('users');
            toast.success('Usuario actualizado con éxito');
        },
        onError: (error) => {
            console.error('Error al actualizar el usuario:', error);
            toast.error('No pudimos actualizar el usuario.');
        },
    });

    useEffect(() => {
        document.title = 'Orza - Usuarios';
    }, []);

    const onDeleteButtonClicked = useCallback(
        async (id) => {
            const confirmation = window.confirm('¿Quieres eliminar este usuario?');
            if (!confirmation) return;

            await deleteMutation.mutateAsync(id);
        },
        [deleteMutation]
    );

    useEffect(() => {
        if (!tableRef.current) {
            return;
        }

        const tableNode = tableRef.current;
        const tableElement = $(tableNode);

        if ($.fn.DataTable.isDataTable(tableNode)) {
            tableElement.DataTable().destroy();
        }

        const table = tableElement.DataTable({
            ...datatableOptions,
            data: users,
            columns: [
                { data: 'nombre', title: 'Nombre' },
                { data: 'email', title: 'E-mail' },
                { data: 'rol', title: 'Rol' },
                {
                    data: null,
                    title: 'Opciones',
                    orderable: false,
                    defaultContent: `
                        <div class="entity-page__icon-buttons">
                            <button type="button" class="entity-page__icon-button entity-page__icon-button--edit edit-btn">
                                <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                                <span class="sr-only">Editar usuario</span>
                            </button>
                            <button type="button" class="entity-page__icon-button entity-page__icon-button--delete delete-btn">
                                <i class="fa-solid fa-trash" aria-hidden="true"></i>
                                <span class="sr-only">Eliminar usuario</span>
                            </button>
                        </div>
                    `,
                },
            ],
        });

        const handleEditClick = function () {
            const rowData = table.row($(this).closest('tr')).data();
            setSelectedUser(rowData);
            setIsShowingModal(true);
        };

        const handleDeleteClick = function () {
            const rowData = table.row($(this).closest('tr')).data();
            onDeleteButtonClicked(rowData.id);
        };

        tableElement.off('click', '.edit-btn');
        tableElement.off('click', '.delete-btn');
        tableElement.on('click', '.edit-btn', handleEditClick);
        tableElement.on('click', '.delete-btn', handleDeleteClick);

        return () => {
            tableElement.off('click', '.edit-btn', handleEditClick);
            tableElement.off('click', '.delete-btn', handleDeleteClick);
            table.destroy();
        };
    }, [users, onDeleteButtonClicked]);

    return (
        <>
            <NavigationTitle menu="Inicio" submenu="Usuarios" />
            <div className="entity-page">
                <section className="entity-page__hero">
                    <div className="entity-page__hero-copy">
                        <p className="entity-page__hero-eyebrow">Equipo interno</p>
                        <h1 className="entity-page__hero-title">Usuarios</h1>
                        <p className="entity-page__hero-subtitle">
                            Gestiona los accesos y roles de tu equipo para mantener tu operación alineada y segura.
                        </p>
                    </div>
                    <div className="entity-page__actions">
                        <button
                            type="button"
                            className="entity-page__primary-action"
                            onClick={() => setIsShowingModal(true)}
                        >
                            <i className="fa-solid fa-plus" aria-hidden="true"></i>
                            Nuevo usuario
                        </button>
                        <button
                            type="button"
                            className="entity-page__ghost-action"
                            onClick={() => queryClient.invalidateQueries('users')}
                        >
                            <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                            Actualizar lista
                        </button>
                    </div>
                </section>

                <section className="entity-page__stats" aria-label="Resumen de usuarios">
                    <article className="entity-page__stat">
                        <span className="entity-page__stat-label">Usuarios activos</span>
                        <strong className="entity-page__stat-value">{totalUsers}</strong>
                    </article>
                    {Object.keys(rolesCount).map((role) => (
                        <article className="entity-page__stat" key={role}>
                            <span className="entity-page__stat-label">{role}</span>
                            <strong className="entity-page__stat-value">
                                {rolesCount[role]}
                                <span className="entity-page__stat-extra">
                                    {totalUsers ? `${Math.round((rolesCount[role] / totalUsers) * 100)}%` : '0%'}
                                </span>
                            </strong>
                        </article>
                    ))}
                </section>

                <section className="entity-page__card">
                    <header className="entity-page__card-header">
                        <div>
                            <h2 className="entity-page__card-title">Listado de usuarios</h2>
                            <p className="entity-page__card-subtitle">
                                Controla permisos y mantén un registro claro de las personas que pueden acceder a la
                                plataforma.
                            </p>
                        </div>
                    </header>

                    {isLoading ? (
                        <p className="entity-page__empty">Cargando usuarios...</p>
                    ) : (
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
                    )}
                </section>
            </div>

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
                    saveAction={async (userData) => {
                        try {
                            if (selectedUser) {
                                await updateUserMutation.mutateAsync(userData);
                            } else {
                                await createUserMutation.mutateAsync(userData);
                            }
                            setSelectedUser(null);
                            setIsShowingModal(false);
                        } catch (error) {
                            console.error('No fue posible guardar el usuario:', error);
                        }
                    }}
                    userUpdate={selectedUser}
                />
            </Modal>
        </>
    );
};

export default Users;
