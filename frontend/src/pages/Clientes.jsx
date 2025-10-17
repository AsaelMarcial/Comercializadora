import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import {
    readAllClientes,
    createCliente,
    updateCliente,
    deleteCliente,
} from '../data-access/clientesDataAccess.js';
import { datatableOptions } from '../utils/datatables';
import $ from 'jquery';
import Modal from '../components/Modal';
import ClienteForm from '../forms/ClienteForm';
import { toast } from 'react-toastify';
import '../css/entity-management.css';

const Clientes = () => {
    const { data: clientes = [], isLoading } = useQuery('clientes', readAllClientes);
    const [isShowingFormModal, setIsShowingFormModal] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const queryClient = useQueryClient();
    const tableRef = useRef();

    const totalClientes = clientes.length;
    const clientesConProyecto = useMemo(
        () => clientes.filter((cliente) => Boolean(cliente.proyecto)).length,
        [clientes]
    );
    const descuentoPromedio = useMemo(() => {
        if (!clientes.length) return 0;
        const total = clientes.reduce((acc, cliente) => acc + Number(cliente.descuento || 0), 0);
        return total / clientes.length;
    }, [clientes]);

    const createMutation = useMutation(createCliente, {
        onSuccess: () => {
            queryClient.invalidateQueries('clientes');
            toast.success('Cliente guardado correctamente');
            setIsShowingFormModal(false);
        },
        onError: (error) => {
            console.error('Error creando cliente:', error);
            toast.error('No pudimos guardar el cliente. Intenta de nuevo.');
        },
    });

    const updateMutation = useMutation(updateCliente, {
        onSuccess: () => {
            queryClient.invalidateQueries('clientes');
            toast.success('Cliente actualizado con éxito');
            setIsShowingFormModal(false);
        },
        onError: (error) => {
            console.error('Error actualizando cliente:', error);
            toast.error('No pudimos actualizar el cliente. Intenta nuevamente.');
        },
    });

    const deleteMutation = useMutation(deleteCliente, {
        onSuccess: () => {
            queryClient.invalidateQueries('clientes');
            toast.success('Cliente eliminado correctamente');
        },
        onError: (error) => {
            console.error('Error eliminando cliente:', error);
            toast.error('No fue posible eliminar el cliente.');
        },
    });

    useEffect(() => {
        document.title = 'Orza - Clientes';
    }, []);

    useEffect(() => {
        if (isLoading || !tableRef.current) {
            return;
        }

        const tableNode = tableRef.current;
        const tableElement = $(tableNode);

        if ($.fn.DataTable.isDataTable(tableNode)) {
            tableElement.DataTable().destroy();
        }

        const tableInstance = tableElement.DataTable(datatableOptions);

        return () => {
            tableInstance.destroy();
        };
    }, [clientes, isLoading]);

    const handleSaveCliente = (cliente) => {
        if (selectedCliente) {
            updateMutation.mutate({ ...cliente, id: selectedCliente.id });
        } else {
            createMutation.mutate(cliente);
        }
    };

    const handleDeleteCliente = async (id) => {
        const confirmation = window.confirm('¿Quieres eliminar este cliente de forma permanente?');
        if (!confirmation) return;

        await deleteMutation.mutateAsync(id);
    };

    const handleCancel = () => {
        setSelectedCliente(null);
        setIsShowingFormModal(false);
    };

    return (
        <>
            <NavigationTitle menu="Inicio" submenu="Clientes" />
            <div className="entity-page">
                <section className="entity-page__hero">
                    <div className="entity-page__hero-copy">
                        <p className="entity-page__hero-eyebrow">Relaciones comerciales</p>
                        <h1 className="entity-page__hero-title">Clientes</h1>
                        <p className="entity-page__hero-subtitle">
                            Administra tu cartera de clientes, mantén sus datos actualizados y crea propuestas
                            personalizadas con la información correcta en todo momento.
                        </p>
                    </div>
                    <div className="entity-page__actions">
                        <button
                            type="button"
                            className="entity-page__primary-action"
                            onClick={() => setIsShowingFormModal(true)}
                        >
                            <i className="fa-solid fa-plus" aria-hidden="true"></i>
                            Nuevo cliente
                        </button>
                        <button
                            type="button"
                            className="entity-page__ghost-action"
                            onClick={() => queryClient.invalidateQueries('clientes')}
                        >
                            <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                            Actualizar lista
                        </button>
                    </div>
                </section>

                <section className="entity-page__stats" aria-label="Resumen de clientes">
                    <article className="entity-page__stat">
                        <span className="entity-page__stat-label">Clientes activos</span>
                        <strong className="entity-page__stat-value">{totalClientes}</strong>
                    </article>
                    <article className="entity-page__stat">
                        <span className="entity-page__stat-label">Con proyecto asignado</span>
                        <strong className="entity-page__stat-value">
                            {clientesConProyecto}
                            <span className="entity-page__stat-extra">
                                {totalClientes
                                    ? `${Math.round((clientesConProyecto / totalClientes) * 100)}%`
                                    : '0%'}
                            </span>
                        </strong>
                    </article>
                    <article className="entity-page__stat">
                        <span className="entity-page__stat-label">Descuento promedio</span>
                        <strong className="entity-page__stat-value">
                            {descuentoPromedio.toFixed(1)}%
                        </strong>
                    </article>
                </section>

                <section className="entity-page__card">
                    <header className="entity-page__card-header">
                        <div>
                            <h2 className="entity-page__card-title">Listado de clientes</h2>
                            <p className="entity-page__card-subtitle">
                                Mantén organizada tu información comercial y accede en segundos a los datos
                                clave de cada cliente.
                            </p>
                        </div>
                    </header>

                    {isLoading ? (
                        <p className="entity-page__empty">Cargando clientes...</p>
                    ) : clientes.length ? (
                        <table ref={tableRef} className="table table-hover table-borderless">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Proyecto</th>
                                    <th>Dirección</th>
                                    <th>Descuento (%)</th>
                                    <th>Opciones</th>
                                </tr>
                            </thead>
                            <tbody className="table-group-divider">
                                {clientes.map((cliente) => (
                                    <tr key={cliente.id}>
                                        <td>{cliente.nombre}</td>
                                        <td>{cliente.proyecto || '—'}</td>
                                        <td>{cliente.direccion || '—'}</td>
                                        <td>{cliente.descuento ?? '0'}</td>
                                        <td>
                                            <div className="entity-page__icon-buttons">
                                                <button
                                                    type="button"
                                                    className="entity-page__icon-button entity-page__icon-button--edit"
                                                    onClick={() => {
                                                        setSelectedCliente(cliente);
                                                        setIsShowingFormModal(true);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                                                    <span className="sr-only">Editar cliente</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="entity-page__icon-button entity-page__icon-button--delete"
                                                    onClick={() => handleDeleteCliente(cliente.id)}
                                                >
                                                    <i className="fa-solid fa-trash" aria-hidden="true"></i>
                                                    <span className="sr-only">Eliminar cliente</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="entity-page__empty">
                            Aún no tienes clientes registrados. Comienza agregando tu primer contacto.
                        </p>
                    )}
                </section>
            </div>

            <Modal
                isShowing={isShowingFormModal}
                setIsShowing={setIsShowingFormModal}
                onClose={handleCancel}
            >
                <ClienteForm
                    clienteUpdate={selectedCliente}
                    cancelAction={handleCancel}
                    onSave={handleSaveCliente}
                />
            </Modal>
        </>
    );
};

export default Clientes;
