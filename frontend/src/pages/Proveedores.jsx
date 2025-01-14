import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import { readAllProveedores, createProveedor, updateProveedor, deleteProveedor } from '../data-access/proveedoresDataAccess';
import { datatableOptions } from '../utils/datatables';
import $ from 'jquery';
import Modal from '../components/Modal';
import ProveedorForm from '../forms/ProveedorForm';
import {toast} from "react-toastify";

const Proveedores = () => {
    const { data: proveedores, isLoading } = useQuery('proveedores', readAllProveedores);
    const [isShowingFormModal, setIsShowingFormModal] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState(null);
    const queryClient = useQueryClient();
    const tableRef = useRef();

    const createMutation = useMutation(createProveedor, {
        onSuccess: () => {
            queryClient.invalidateQueries('proveedores');
            toast('Proveedor guardado correctamente', { type: 'success' }); // Mostrar mensaje de éxito
            setIsShowingFormModal(false); // Cierra el modal al guardar
        },
        onError: (error) => {
            console.error('Error creando proveedor:', error);
            alert('Hubo un error al crear el proveedor.');
        },
    });

    const updateMutation = useMutation(updateProveedor, {
        onSuccess: () => {
            queryClient.invalidateQueries('proveedores');
            setIsShowingFormModal(false); // Cierra el modal al actualizar
        },
        onError: (error) => {
            console.error('Error actualizando proveedor:', error);
            alert('Hubo un error al actualizar el proveedor.');
        },
    });

    const deleteMutation = useMutation(deleteProveedor, {
        onSuccess: () => {
            queryClient.invalidateQueries('proveedores');
        },
        onError: (error) => {
            console.error('Error eliminando proveedor:', error);
            alert('Hubo un error al eliminar el proveedor.');
        },
    });

    useEffect(() => {
        document.title = 'Orza - Proveedores';
        if (!isLoading) {
            const table = $(tableRef.current).DataTable(datatableOptions);
            table.draw();
        }
    }, [proveedores, isLoading]);

    const handleSaveProveedor = (proveedor) => {
        if (selectedProveedor) {
            updateMutation.mutate({ ...proveedor, id: selectedProveedor.id });
        } else {
            createMutation.mutate(proveedor);
        }
    };

    const handleDeleteProveedor = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const handleCancel = () => {
        setSelectedProveedor(null); // Limpia el proveedor seleccionado
        setIsShowingFormModal(false); // Cierra el modal
    };

    return (
        <>
            <NavigationTitle menu="Inicio" submenu="Proveedores" />
            {isLoading ? (
                'Loading...'
            ) : (
                <>
                    <button
                        type="button"
                        className="btn-registrar"
                        onClick={() => setIsShowingFormModal(true)}
                    >
                        <i className="fa-solid fa-plus"></i> Nuevo proveedor
                    </button>
                    <div className="contenedor-tabla">
                        <h3>Proveedores</h3>
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
                                        <td>{proveedor.direccion}</td>
                                        <td>{proveedor.telefono}</td>
                                        <td>{proveedor.email}</td>
                                        <td>{proveedor.contacto}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn-opciones p-1"
                                                onClick={() => {
                                                    setSelectedProveedor(proveedor);
                                                    setIsShowingFormModal(true);
                                                }}
                                            >
                                                <i className="fa-solid fa-pen-to-square"></i>
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-opciones p-1"
                                                onClick={() => handleDeleteProveedor(proveedor.id)}
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            <Modal
                isShowing={isShowingFormModal}
                setIsShowing={setIsShowingFormModal}
                onClose={handleCancel} // Usa handleCancel para manejar el cierre del modal
            >
                <ProveedorForm
                    proveedorUpdate={selectedProveedor}
                    cancelAction={handleCancel} // Pasa la función para cerrar el modal
                    onSave={handleSaveProveedor}
                />
            </Modal>
        </>
    );
};

export default Proveedores;
