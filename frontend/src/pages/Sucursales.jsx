import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import NavigationTitle from '../components/NavigationTitle';
import Modal from '../components/Modal';
import SucursalForm from '../forms/SucursalForm';
import {
    createSucursal,
    deleteSucursal,
    readAllSucursales,
    updateSucursal,
} from '../data-access/sucursalesDataAccess';
import '../css/sucursales.css';

const Sucursales = () => {
    const { data: sucursales, isLoading } = useQuery('sucursales', readAllSucursales);
    const [isShowingFormModal, setIsShowingFormModal] = useState(false);
    const [selectedSucursal, setSelectedSucursal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();
    const savingToastId = useRef(null);

    useEffect(() => {
        document.title = 'Orza - Sucursales';
    }, []);

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

    const createMutation = useMutation(createSucursal, {
        onMutate: () => startSavingToast('Guardando sucursal...'),
        onSuccess: () => {
            queryClient.invalidateQueries('sucursales');
            finishSavingToast('Sucursal guardada correctamente', 'success');
            setIsShowingFormModal(false);
            setSelectedSucursal(null);
        },
        onError: (error) => {
            console.error('Error creando sucursal:', error);
            finishSavingToast('Hubo un error al crear la sucursal.', 'error');
        },
    });

    const updateMutation = useMutation(updateSucursal, {
        onMutate: () => startSavingToast('Actualizando sucursal...'),
        onSuccess: () => {
            queryClient.invalidateQueries('sucursales');
            finishSavingToast('Sucursal actualizada correctamente', 'success');
            setIsShowingFormModal(false);
            setSelectedSucursal(null);
        },
        onError: (error) => {
            console.error('Error actualizando sucursal:', error);
            finishSavingToast('Hubo un error al actualizar la sucursal.', 'error');
        },
    });

    const deleteMutation = useMutation(deleteSucursal, {
        onSuccess: () => {
            queryClient.invalidateQueries('sucursales');
            toast('Sucursal eliminada correctamente', { type: 'success' });
        },
        onError: (error) => {
            console.error('Error eliminando sucursal:', error);
            toast('Hubo un error al eliminar la sucursal.', { type: 'error' });
        },
    });

    const sucursalesList = useMemo(() => {
        if (Array.isArray(sucursales)) return sucursales;
        if (Array.isArray(sucursales?.data)) return sucursales.data;
        return [];
    }, [sucursales]);

    const filteredSucursales = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return sucursalesList
            .filter(Boolean)
            .filter((branch) =>
                normalizedSearch
                    ? [branch.nombre, branch.direccion, branch.contacto, branch.telefono, branch.horario]
                          .filter(Boolean)
                          .some((field) => field.toLowerCase().includes(normalizedSearch))
                    : true
            )
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }, [sucursalesList, searchTerm]);

    const handleSaveSucursal = (sucursal) => {
        if (selectedSucursal) {
            updateMutation.mutate({ ...sucursal, id: selectedSucursal.id });
        } else {
            createMutation.mutate(sucursal);
        }
    };

    const handleDeleteSucursal = async (id) => {
        const shouldDelete = window.confirm('¿Estás seguro de eliminar esta sucursal?');
        if (!shouldDelete) return;

        await deleteMutation.mutateAsync(id);
    };

    const handleCancel = () => {
        setSelectedSucursal(null);
        setIsShowingFormModal(false);
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries('sucursales');
    };

    return (
        <>
            <NavigationTitle menu="Operación" submenu="Sucursales" />
            <div className="branches">
                <section className="branches__hero">
                    <div className="branches__hero-copy">
                        <p className="branches__hero-eyebrow">Red de puntos</p>
                        <h1 className="branches__hero-title">Organiza tus sucursales y horarios clave</h1>
                        <p className="branches__hero-subtitle">
                            Mantén la información de contacto actualizada y garantiza que tu equipo sepa a dónde dirigirse.
                        </p>
                        <div className="branches__hero-actions">
                            <button
                                type="button"
                                className="branches__primary-action"
                                onClick={() => {
                                    setSelectedSucursal(null);
                                    setIsShowingFormModal(true);
                                }}
                            >
                                <i className="fa-solid fa-plus" aria-hidden="true"></i>
                                Nueva sucursal
                            </button>
                            <button type="button" className="branches__ghost-action" onClick={handleRefresh}>
                                <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                                Actualizar lista
                            </button>
                        </div>
                    </div>
                    <div className="branches__hero-stats" aria-label="Indicadores de sucursales">
                        <article className="branches__stat">
                            <span className="branches__stat-label">Sucursales activas</span>
                            <strong className="branches__stat-value">{sucursalesList.length}</strong>
                            <p className="branches__stat-help">Registros disponibles en el catálogo.</p>
                        </article>
                        <article className="branches__stat">
                            <span className="branches__stat-label">Con contacto registrado</span>
                            <strong className="branches__stat-value">
                                {sucursalesList.filter((branch) => branch.contacto || branch.telefono).length}
                            </strong>
                            <p className="branches__stat-help">Facilita la coordinación inmediata.</p>
                        </article>
                        <article className="branches__stat">
                            <span className="branches__stat-label">Con horario definido</span>
                            <strong className="branches__stat-value">
                                {sucursalesList.filter((branch) => branch.horario).length}
                            </strong>
                            <p className="branches__stat-help">Listas para recibir visitas y entregas.</p>
                        </article>
                    </div>
                </section>

                <section className="branches__toolbar" aria-label="Herramientas de búsqueda">
                    <div className="branches__search">
                        <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                        <input
                            type="search"
                            placeholder="Buscar por nombre, contacto, teléfono o dirección"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <button
                        type="button"
                        className="branches__ghost-action branches__toolbar-reset"
                        onClick={() => setSearchTerm('')}
                        disabled={!searchTerm}
                    >
                        <i className="fa-solid fa-eraser" aria-hidden="true"></i>
                        Limpiar filtros
                    </button>
                </section>

                <section className="branches__table" aria-live="polite">
                    {isLoading ? (
                        <p className="branches__loading">Cargando sucursales...</p>
                    ) : filteredSucursales.length === 0 ? (
                        <div className="branches__empty">
                            <p className="branches__empty-title">Aún no hay sucursales para mostrar.</p>
                            <p className="branches__empty-subtitle">
                                Crea un nuevo registro para compartir dirección, contacto y horario con tu equipo.
                            </p>
                            <button
                                type="button"
                                className="branches__primary-action"
                                onClick={() => {
                                    setSelectedSucursal(null);
                                    setIsShowingFormModal(true);
                                }}
                            >
                                <i className="fa-solid fa-plus" aria-hidden="true"></i>
                                Agregar primera sucursal
                            </button>
                        </div>
                    ) : (
                        <div className="branches__table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Dirección</th>
                                        <th>Contacto</th>
                                        <th>Teléfono</th>
                                        <th>Horario</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSucursales.map((branch) => (
                                        <tr key={branch.id}>
                                            <td>{branch.nombre || 'Sin nombre'}</td>
                                            <td>{branch.direccion || 'Sin dirección'}</td>
                                            <td>{branch.contacto || 'Sin contacto'}</td>
                                            <td>{branch.telefono || 'Sin teléfono'}</td>
                                            <td>{branch.horario || 'Sin horario'}</td>
                                            <td className="branches__actions">
                                                <button
                                                    type="button"
                                                    className="branches__action-button"
                                                    onClick={() => {
                                                        setSelectedSucursal(branch);
                                                        setIsShowingFormModal(true);
                                                    }}
                                                    aria-label={`Editar sucursal ${branch.nombre}`}
                                                >
                                                    <i className="fa-solid fa-pen" aria-hidden="true"></i>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="branches__action-button branches__action-button--danger"
                                                    onClick={() => handleDeleteSucursal(branch.id)}
                                                    aria-label={`Eliminar sucursal ${branch.nombre}`}
                                                >
                                                    <i className="fa-solid fa-trash" aria-hidden="true"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            <Modal isOpen={isShowingFormModal} closeModal={handleCancel}>
                <SucursalForm
                    sucursalUpdate={selectedSucursal}
                    cancelAction={handleCancel}
                    onSave={handleSaveSucursal}
                />
            </Modal>
        </>
    );
};

export default Sucursales;
