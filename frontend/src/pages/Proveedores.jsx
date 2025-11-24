import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import {
    readAllProveedores,
    createProveedor,
    updateProveedor,
    deleteProveedor,
} from '../data-access/proveedoresDataAccess';
import Modal from '../components/Modal';
import ProveedorForm from '../forms/ProveedorForm';
import { toast } from 'react-toastify';
import '../css/proveedores.css';

const Proveedores = () => {
    const { data: proveedores, isLoading } = useQuery('proveedores', readAllProveedores);
    const [isShowingFormModal, setIsShowingFormModal] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [contactFilter, setContactFilter] = useState('todos');
    const queryClient = useQueryClient();
    const savingToastId = useRef(null);

    const startSavingToast = (message) => {
        savingToastId.current = toast.loading(message, { autoClose: false });
    };

    const finishSavingToast = (message, type) => {
        if (savingToastId.current) {
            toast.update(savingToastId.current, {
                render: message,
                type,
                isLoading: false,
                autoClose: 3000,
            });
            savingToastId.current = null;
        } else {
            toast(message, { type });
        }
    };

    const createMutation = useMutation(createProveedor, {
        onMutate: () => {
            startSavingToast('Guardando proveedor...');
        },
        onSuccess: () => {
            queryClient.invalidateQueries('proveedores');
            finishSavingToast('Proveedor guardado correctamente', 'success');
            setIsShowingFormModal(false);
            setSelectedProveedor(null);
        },
        onError: (error) => {
            console.error('Error creando proveedor:', error);
            finishSavingToast('Hubo un error al crear el proveedor.', 'error');
        },
    });

    const updateMutation = useMutation(updateProveedor, {
        onMutate: () => {
            startSavingToast('Actualizando proveedor...');
        },
        onSuccess: () => {
            queryClient.invalidateQueries('proveedores');
            finishSavingToast('Proveedor actualizado correctamente', 'success');
            setIsShowingFormModal(false);
            setSelectedProveedor(null);
        },
        onError: (error) => {
            console.error('Error actualizando proveedor:', error);
            finishSavingToast('Hubo un error al actualizar el proveedor.', 'error');
        },
    });

    const deleteMutation = useMutation(deleteProveedor, {
        onSuccess: () => {
            queryClient.invalidateQueries('proveedores');
            toast('Proveedor eliminado correctamente', { type: 'success' });
        },
        onError: (error) => {
            console.error('Error eliminando proveedor:', error);
            toast('Hubo un error al eliminar el proveedor.', { type: 'error' });
        },
    });

    useEffect(() => {
        document.title = 'Orza - Proveedores';
    }, []);

    const proveedoresList = useMemo(() => {
        if (Array.isArray(proveedores)) return proveedores;
        if (Array.isArray(proveedores?.data)) return proveedores.data;
        if (Array.isArray(proveedores?.results)) return proveedores.results;
        return [];
    }, [proveedores]);

    const sortedSuppliers = useMemo(() => {
        const safeName = (supplier) => (supplier?.nombre || '').toString();

        return [...proveedoresList]
            .filter(Boolean)
            .sort((a, b) => safeName(a).localeCompare(safeName(b), 'es', { sensitivity: 'base' }));
    }, [proveedoresList]);

    const totalSuppliers = sortedSuppliers.length;

    const suppliersWithEmail = useMemo(
        () => sortedSuppliers.filter((supplier) => Boolean(supplier.email)).length,
        [sortedSuppliers]
    );

    const suppliersWithPhone = useMemo(
        () => sortedSuppliers.filter((supplier) => Boolean(supplier.telefono)).length,
        [sortedSuppliers]
    );

    const filteredSuppliers = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return sortedSuppliers.filter((supplier) => {
            const matchesSearch =
                !normalizedSearch ||
                [supplier.nombre, supplier.direccion, supplier.email, supplier.contacto].some((field) =>
                    (field || '').toLowerCase().includes(normalizedSearch)
                );

            const hasEmail = Boolean(supplier.email);
            const hasPhone = Boolean(supplier.telefono);

            const matchesContactFilter =
                contactFilter === 'todos' ||
                (contactFilter === 'con-email' && hasEmail) ||
                (contactFilter === 'con-telefono' && hasPhone);

            return matchesSearch && matchesContactFilter;
        });
    }, [sortedSuppliers, searchTerm, contactFilter]);

    const handleSaveProveedor = (proveedor) => {
        if (selectedProveedor) {
            updateMutation.mutate({ ...proveedor, id: selectedProveedor.id });
        } else {
            createMutation.mutate(proveedor);
        }
    };

    const handleDeleteProveedor = async (id) => {
        const shouldDelete = window.confirm('¿Estás seguro de eliminar este proveedor?');
        if (!shouldDelete) return;

        await deleteMutation.mutateAsync(id);
    };

    const handleCancel = () => {
        setSelectedProveedor(null);
        setIsShowingFormModal(false);
    };

    const openCreateModal = () => {
        setSelectedProveedor(null);
        setIsShowingFormModal(true);
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries('proveedores');
    };

    return (
        <>
            <NavigationTitle menu="Relaciones" submenu="Proveedores" />
            <div className="suppliers">
                <section className="suppliers__hero">
                    <div className="suppliers__hero-copy">
                        <p className="suppliers__hero-eyebrow">Gestión de proveedores</p>
                        <h1 className="suppliers__hero-title">Orquesta tus alianzas estratégicas sin perder el ritmo</h1>
                        <p className="suppliers__hero-subtitle">
                            Mantén actualizados los canales de contacto, identifica brechas de comunicación y registra
                            nuevos socios en segundos.
                        </p>
                        <div className="suppliers__hero-actions">
                            <button type="button" className="suppliers__primary-action" onClick={openCreateModal}>
                                <i className="fa-solid fa-handshake" aria-hidden="true"></i>
                                Nuevo proveedor
                            </button>
                            <button type="button" className="suppliers__ghost-action" onClick={handleRefresh}>
                                <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                                Actualizar lista
                            </button>
                        </div>
                    </div>
                    <div className="suppliers__hero-stats" aria-label="Indicadores de proveedores">
                        <article className="suppliers__stat">
                            <span className="suppliers__stat-label">Total de proveedores</span>
                            <strong className="suppliers__stat-value">{totalSuppliers}</strong>
                            <p className="suppliers__stat-help">Contactos activos listos para colaborar.</p>
                        </article>
                        <article className="suppliers__stat">
                            <span className="suppliers__stat-label">Con correo validado</span>
                            <strong className="suppliers__stat-value">{suppliersWithEmail}</strong>
                            <p className="suppliers__stat-help">
                                {totalSuppliers
                                    ? `${Math.round((suppliersWithEmail / totalSuppliers) * 100)}% con email registrado`
                                    : 'Aún sin direcciones de correo'}
                            </p>
                        </article>
                        <article className="suppliers__stat">
                            <span className="suppliers__stat-label">Con línea directa</span>
                            <strong className="suppliers__stat-value">{suppliersWithPhone}</strong>
                            <p className="suppliers__stat-help">
                                {totalSuppliers
                                    ? `${Math.round((suppliersWithPhone / totalSuppliers) * 100)}% con teléfono disponible`
                                    : 'Agrega números para acelerar respuestas'}
                            </p>
                        </article>
                    </div>
                </section>

                <section className="suppliers__toolbar" aria-label="Herramientas de búsqueda y filtros">
                    <div className="suppliers__search">
                        <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                        <input
                            type="search"
                            placeholder="Buscar por nombre, correo, contacto o dirección"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <div className="suppliers__filters">
                        <label htmlFor="contact-filter">Canal principal</label>
                        <select
                            id="contact-filter"
                            value={contactFilter}
                            onChange={(event) => setContactFilter(event.target.value)}
                        >
                            <option value="todos">Todos</option>
                            <option value="con-email">Con email</option>
                            <option value="con-telefono">Con teléfono</option>
                        </select>
                    </div>
                </section>

                <section className="suppliers__table" aria-live="polite">
                    {isLoading ? (
                        <p className="suppliers__loading">Cargando proveedores...</p>
                    ) : filteredSuppliers.length ? (
                        <div className="suppliers__table-wrapper">
                            <table className="suppliers__data">
                                <thead>
                                    <tr>
                                        <th scope="col">Nombre</th>
                                        <th scope="col">Dirección</th>
                                        <th scope="col">Teléfono</th>
                                        <th scope="col">Email</th>
                                        <th scope="col">Contacto</th>
                                        <th scope="col" className="suppliers__actions-header">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSuppliers.map((proveedor) => (
                                        <tr key={proveedor.id}>
                                            <td data-title="Nombre">{proveedor.nombre}</td>
                                            <td data-title="Dirección">{proveedor.direccion || '—'}</td>
                                            <td data-title="Teléfono">{proveedor.telefono || '—'}</td>
                                            <td data-title="Email">{proveedor.email || '—'}</td>
                                            <td data-title="Contacto">{proveedor.contacto || '—'}</td>
                                            <td className="suppliers__actions">
                                                <div className="suppliers__action-group">
                                                    <button
                                                        type="button"
                                                        className="suppliers__action"
                                                        onClick={() => {
                                                            setSelectedProveedor(proveedor);
                                                            setIsShowingFormModal(true);
                                                        }}
                                                        aria-label={`Editar ${proveedor.nombre}`}
                                                    >
                                                        <i className="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="suppliers__action suppliers__action--danger"
                                                        onClick={() => handleDeleteProveedor(proveedor.id)}
                                                        aria-label={`Eliminar ${proveedor.nombre}`}
                                                    >
                                                        <i className="fa-solid fa-trash" aria-hidden="true"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="suppliers__empty-state">
                            <i className="fa-solid fa-truck-fast" aria-hidden="true"></i>
                            <h2>No encontramos proveedores con esos criterios</h2>
                            <p>Amplía la búsqueda o registra un nuevo aliado comercial para comenzar.</p>
                            <button type="button" className="suppliers__primary-action" onClick={openCreateModal}>
                                <i className="fa-solid fa-handshake" aria-hidden="true"></i>
                                Registrar proveedor
                            </button>
                        </div>
                    )}
                </section>
            </div>
            <Modal isShowing={isShowingFormModal} setIsShowing={setIsShowingFormModal} onClose={handleCancel}>
                <ProveedorForm proveedorUpdate={selectedProveedor} cancelAction={handleCancel} onSave={handleSaveProveedor} />
            </Modal>
        </>
    );
};

export default Proveedores;
