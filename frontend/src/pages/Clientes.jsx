import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import { readAllClientes, createCliente, updateCliente, deleteCliente } from '../data-access/clientesDataAccess.js';
import { datatableOptions } from '../utils/datatables';
import $ from 'jquery';
import Modal from '../components/Modal';
import ClienteForm from '../forms/ClienteForm';
import { toast } from "react-toastify";

const Clientes = () => {
    const { data: clientes, isLoading } = useQuery('clientes', readAllClientes);
    const [isShowingFormModal, setIsShowingFormModal] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const queryClient = useQueryClient();
    const tableRef = useRef();

    const createMutation = useMutation(createCliente, {
        onSuccess: () => {
            queryClient.invalidateQueries('clientes');
            toast('Cliente guardado correctamente', { type: 'success' });
            setIsShowingFormModal(false);
        },
        onError: (error) => {
            console.error('Error creando cliente:', error);
            alert('Hubo un error al crear el cliente.');
        },
    });

    const updateMutation = useMutation(updateCliente, {
        onSuccess: () => {
            queryClient.invalidateQueries('clientes');
            setIsShowingFormModal(false);
        },
        onError: (error) => {
            console.error('Error actualizando cliente:', error);
            alert('Hubo un error al actualizar el cliente.');
        },
    });

    const deleteMutation = useMutation(deleteCliente, {
        onSuccess: () => {
            queryClient.invalidateQueries('clientes');
        },
        onError: (error) => {
            console.error('Error eliminando cliente:', error);
            alert('Hubo un error al eliminar el cliente.');
        },
    });

    useEffect(() => {
        document.title = 'Orza - Clientes';
        if (!isLoading) {
            const table = $(tableRef.current).DataTable(datatableOptions);
            table.draw();
        }
    }, [clientes, isLoading]);

    const handleSaveCliente = (cliente) => {
        if (selectedCliente) {
            updateMutation.mutate({ ...cliente, id: selectedCliente.id });
        } else {
            createMutation.mutate(cliente);
        }
    };

    const handleDeleteCliente = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const handleCancel = () => {
        setSelectedCliente(null);
        setIsShowingFormModal(false);
    };

    return (
        <>
            <NavigationTitle menu="Inicio" submenu="Clientes" />
            {isLoading ? (
                'Loading...'
            ) : (
                <>
                    <button
                        type="button"
                        className="btn-registrar"
                        onClick={() => setIsShowingFormModal(true)}
                    >
                        <i className="fa-solid fa-plus"></i> Nuevo cliente
                    </button>
                    <div className="contenedor-tabla">
                        <h3>Clientes</h3>
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
                                        <td>{cliente.proyecto}</td>
                                        <td>{cliente.direccion}</td>
                                        <td>{cliente.descuento}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn-opciones p-1"
                                                onClick={() => {
                                                    setSelectedCliente(cliente);
                                                    setIsShowingFormModal(true);
                                                }}
                                            >
                                                <i className="fa-solid fa-pen-to-square"></i>
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-opciones p-1"
                                                onClick={() => handleDeleteCliente(cliente.id)}
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
