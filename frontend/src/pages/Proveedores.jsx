import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import {
    readAllProveedores,
    createProveedor,
    updateProveedor,
    deleteProveedor,
} from '../data-access/proveedoresDataAccess';
import { datatableOptions } from '../utils/datatables';
import $ from 'jquery';
import Modal from '../components/Modal';
import ProveedorForm from '../forms/ProveedorForm';
import { toast } from 'react-toastify';
import '../css/entity-management.css';

const Proveedores = () => {
    const { data: proveedores = [], isLoading } = useQuery('proveedores', readAllProveedores);
    const [isShowingFormModal, setIsShowingFormModal] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState(null);
    const queryClient = useQueryClient();
    const tableRef = useRef();

    const totalProveedores = proveedores.length;
    const proveedoresConContacto = useMemo(
        () => proveedores.filter((proveedor) => Boolean(proveedor.contacto)).length,
        [proveedores]
    );
    const proveedoresConEmail = useMemo(
        () => proveedores.filter((proveedor) => Boolean(proveedor.email)).length,
        [proveedores]
    );

    const createMutation = useMutation(createProveedor, {
        onSuccess: () => {
            queryClient.invalidateQueries('proveedores');
            toast.success('Proveedor guardado correctamente');
            setIsShowingFormModal(false);
        },
        onError: (error) => {
            console.error('Error creando proveedor:', error);
            toast.error('No pudimos guardar el proveedor. Intenta nuevamente.');
        },
    });

    const updateMutation = useMutation(updateProveedor, {
        onSuccess: () => {
            queryClient.invalidateQueries('proveedores');
            toast.success('Proveedor actualizado con éxito');
            setIsShowingFormModal(false);
        },
        onError: (error) => {
            console.error('Error actualizando proveedor:', error);
            toast.error('No pudimos actualizar el proveedor.');
        },
    });

    const deleteMutation = useMutation(deleteProveedor, {
        onSuccess: () => {
            queryClient.invalidateQueries('proveedores');
            toast.success('Proveedor eliminado');
        },
        onError: (error) => {
            console.error('Error eliminando proveedor:', error);
            toast.error('No fue posible eliminar el proveedor.');
        },
    });

    useEffect(() => {
        document.title = 'Orza - Proveedores';
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
    }, [proveedores, isLoading]);

    const handleSaveProveedor = (proveedor) => {
        if (selectedProveedor) {
            updateMutation.mutate({ ...proveedor, id: selectedProveedor.id });
        } else {
            createMutation.mutate(proveedor);
        }
    };

    const handleDeleteProveedor = async (id) => {
        const confirmation = window.confirm('¿Quieres eliminar este proveedor? Esta acción no se puede deshacer.');
        if (!confirmation) return;

        await deleteMutation.mutateAsync(id);
    };

    const handleCancel = () => {
        setSelectedProveedor(null);
        setIsShowingFormModal(false);
    };

    return (
        <>
            <NavigationTitle menu="Inicio" submenu="Proveedores" />
            <div className="entity-page">
                <section className="entity-page__hero">
                    <div className="entity-page__hero-copy">
                        <p className="entity-page__hero-eyebrow">Red de aliados</p>
                        <h1 className="entity-page__hero-title">Proveedores</h1>
                        <p className="entity-page__hero-subtitle">
                            Centraliza los datos de tus proveedores para agilizar pedidos, cotizaciones y
                            seguimiento de entregas.
                        </p>
                    </div>
                    <div className="entity-page__actions">
                        <button
                            type="button"
                            className="entity-page__primary-action"
                            onClick={() => setIsShowingFormModal(true)}
                        >
                            <i className="fa-solid fa-plus" aria-hidden="true"></i>
                            Nuevo proveedor
                        </button>
                        <button
                            type="button"
                            className="entity-page__ghost-action"
                            onClick={() => queryClient.invalidateQueries('proveedores')}
                        >
                            <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                            Actualizar lista
                        </button>
                    </div>
                </section>

                <section className="entity-page__stats" aria-label="Resumen de proveedores">
                    <article className="entity-page__stat">
                        <span className="entity-page__stat-label">Proveedores activos</span>
                        <strong className="entity-page__stat-value">{totalProveedores}</strong>
                    </article>
                    <article className="entity-page__stat">
                        <span className="entity-page__stat-label">Con contacto directo</span>
                        <strong className="entity-page__stat-value">
                            {proveedoresConContacto}
                            <span className="entity-page__stat-extra">
                                {totalProveedores
                                    ? `${Math.round((proveedoresConContacto / totalProveedores) * 100)}%`
                                    : '0%'}
                            </span>
                        </strong>
                    </article>
                    <article className="entity-page__stat">
                        <span className="entity-page__stat-label">Emails verificados</span>
                        <strong className="entity-page__stat-value">
                            {proveedoresConEmail}
                            <span className="entity-page__stat-extra">
                                {totalProveedores
                                    ? `${Math.round((proveedoresConEmail / totalProveedores) * 100)}%`
                                    : '0%'}
                            </span>
                        </strong>
                    </article>
                </section>

                <section className="entity-page__card">
                    <header className="entity-page__card-header">
                        <div>
                            <h2 className="entity-page__card-title">Listado de proveedores</h2>
                            <p className="entity-page__card-subtitle">
                                Visualiza de un vistazo la información clave para cada proveedor y toma decisiones
                                con datos confiables.
                            </p>
                        </div>
                    </header>

                    {isLoading ? (
                        <p className="entity-page__empty">Cargando proveedores...</p>
                    ) : proveedores.length ? (
                        <table ref={tableRef} className="table table-hover table-borderless">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Dirección</th>
                                    <th>Teléfono</th>
                                    <th>Email</th>
                                    <th>Contacto</th>
                                    <th>Opciones</th>
                                </tr>
                            </thead>
                            <tbody className="table-group-divider">
                                {proveedores.map((proveedor) => (
                                    <tr key={proveedor.id}>
                                        <td>{proveedor.nombre}</td>
                                        <td>{proveedor.direccion || '—'}</td>
                                        <td>{proveedor.telefono || '—'}</td>
                                        <td>{proveedor.email || '—'}</td>
                                        <td>{proveedor.contacto || '—'}</td>
                                        <td>
                                            <div className="entity-page__icon-buttons">
                                                <button
                                                    type="button"
                                                    className="entity-page__icon-button entity-page__icon-button--edit"
                                                    onClick={() => {
                                                        setSelectedProveedor(proveedor);
                                                        setIsShowingFormModal(true);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                                                    <span className="sr-only">Editar proveedor</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="entity-page__icon-button entity-page__icon-button--delete"
                                                    onClick={() => handleDeleteProveedor(proveedor.id)}
                                                >
                                                    <i className="fa-solid fa-trash" aria-hidden="true"></i>
                                                    <span className="sr-only">Eliminar proveedor</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="entity-page__empty">
                            Todavía no has agregado proveedores. Registra a tus aliados para agilizar tu gestión.
                        </p>
                    )}
                </section>
            </div>

            <Modal
                isShowing={isShowingFormModal}
                setIsShowing={setIsShowingFormModal}
                onClose={handleCancel}
            >
                <ProveedorForm
                    proveedorUpdate={selectedProveedor}
                    cancelAction={handleCancel}
                    onSave={handleSaveProveedor}
                />
            </Modal>
        </>
    );
};

export default Proveedores;
