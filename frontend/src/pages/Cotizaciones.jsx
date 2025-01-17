import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import NavigationTitle from '../components/NavigationTitle';
import {
    getAllCotizaciones,
    cancelCotizacion,
    downloadCotizacionPDF,
} from '../data-access/cotizacionesDataAccess';
import { datatableOptions } from '../utils/datatables';
import $ from 'jquery';
import CotizacionDetailsModal from '../components/CotizacionDetailsModal';

const Cotizaciones = () => {
    const { data: cotizaciones, isLoading } = useQuery('cotizaciones', getAllCotizaciones);
    const queryClient = useQueryClient();
    const [isShowingModal, setIsShowingModal] = useState(false);
    const [selectedCotizacion, setSelectedCotizacion] = useState(null);
    const tableRef = useRef();

    const cancelMutation = useMutation(cancelCotizacion, {
        onSuccess: () => {
            queryClient.invalidateQueries('cotizaciones');
            alert('Cotización cancelada con éxito.');
        },
        onError: (error) => {
            console.error('Error al cancelar la cotización:', error);
            alert('Hubo un error al cancelar la cotización.');
        },
    });

    useEffect(() => {
        document.title = 'Orza - Cotizaciones';
        if (cotizaciones) {
            const table = $(tableRef.current).DataTable({
                ...datatableOptions,
                data: cotizaciones,
                columns: [
                    { data: 'cliente', title: 'Cliente' },
                    { data: 'total', title: 'Total', render: (data) => `$${parseFloat(data).toFixed(2)}` },
                    {
                        data: 'fecha',
                        title: 'Fecha',
                        render: (data) => new Date(data).toLocaleDateString(),
                    },
                    {
                        data: null,
                        title: '',
                        render: (data) =>
                            `<button class="btn-opciones p-1 delete-button" data-id="${data.id}">
                                <i class="fa-solid fa-trash"></i>
                            </button>`,
                    },
                ],
            });

            $(tableRef.current).off('click', '.delete-button'); // Evita múltiples bindings
            $(tableRef.current).on('click', '.delete-button', function () {
                const id = $(this).data('id');
                handleCancelCotizacion(id);
            });

            $(tableRef.current).on('click', 'tbody tr', function () {
                const rowData = table.row(this).data();
                setSelectedCotizacion(rowData);
                setIsShowingModal(true);
            });

            return () => table.destroy();
        }
    }, [cotizaciones]);

    const handleCancelCotizacion = async (id) => {
        const confirmCancel = window.confirm('¿Estás seguro de que deseas cancelar esta cotización?');
        if (!confirmCancel) return;

        try {
            await cancelMutation.mutateAsync(id);
        } catch (error) {
            console.error('Error al cancelar la cotización:', error);
        }
    };

    return (
        <>
            <NavigationTitle menu="Ventas" submenu="Cotizaciones" />
            {isLoading ? (
                'Cargando cotizaciones...'
            ) : (
                <div className="contenedor-tabla">
                    <h3>Cotizaciones</h3>
                    <table ref={tableRef} className="table table-hover table-borderless">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Fecha</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            )}
            {isShowingModal && (
                <CotizacionDetailsModal
                    cotizacion={selectedCotizacion}
                    isShowing={isShowingModal}
                    onClose={() => setIsShowingModal(false)}
                    onCancelCotizacion={handleCancelCotizacion}
                    onDownloadPDF={downloadCotizacionPDF}
                />
            )}
        </>
    );
};

export default Cotizaciones;
