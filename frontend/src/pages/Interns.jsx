import React, { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import NavigationTitle from '../components/NavigationTitle'
import { readAllInterns } from '../data-access/internsDataAccess'
import $ from 'jquery'
import { datatableOptions } from '../utils/datatables'
import { deleteInternMutation, DELETE_MUTATION_OPTIONS } from '../utils/mutations'
import { QUERY_OPTIONS } from '../utils/useQuery'
import Modal from '../components/Modal'
import InternForm from '../forms/InternForm'

const Interns = () => {
	const { data: interns, isLoading } = useQuery({
		...QUERY_OPTIONS,
		queryKey: 'interns',
		queryFn: readAllInterns,
	})
	const [isShowingModal, setIsShowingModal] = useState(false)
	const [selectedIntern, setSelectedIntern] = useState(null)
	const queryClient = useQueryClient()
	const tableRef = useRef()

	const deleteMutation = useMutation(deleteInternMutation, DELETE_MUTATION_OPTIONS)

	useEffect(() => {
		document.title = 'ComedorUV - Becarios'
		const table = $(tableRef.current).DataTable(datatableOptions)
		table.draw()
	}, [interns])

	async function onDeleteButtonClicked(id) {
		await deleteMutation.mutateAsync(id)
		queryClient.resetQueries()
	}

	return (
		<>
			<NavigationTitle
				menu='Inicio'
				submenu='Becarios'
			/>
			{isLoading ? 'Loading...' :
				<>
					<button
						type='button'
						className='btn-registrar'
						onClick={() => setIsShowingModal(true)}
					>
						<i className='fa-solid fa-plus'></i> Nuevo becario
					</button>
					<div className='contenedor-tabla'>
						<h3>Becarios</h3>
						<table ref={tableRef} className='table table-hover table-borderless'>
							<thead>
								<tr>
									<th className='leading-row'>Nombre</th>
									<th>Apellido</th>
									<th>Carrera</th>
									<th>Crédito</th>
									<th>Fecha de Inicio</th>
									<th>Fecha de Fin</th>
									<th className='trailing-row'>Opciones</th>
								</tr>
							</thead>
							<tbody className='table-group-divider'>
								{interns.map(intern =>
									<tr key={intern.id}>
										<td className='leading-row'>{intern.firstName}</td>
										<td>{intern.lastName}</td>
										<td>{intern.carrera}</td>
										<td>{intern.credito}</td>
										<td>{new Date(intern.fechaInicio).formatted()}</td>
										<td>{new Date(intern.fechaFin).formatted()}</td>
										<td className='trailing-row'>
											<button
												type='button'
												className='btn-opciones p-1'
												onClick={() => {
													setSelectedIntern(intern)
													setIsShowingModal(true)
												}}
											>
												<i className='fa-solid fa-pen-to-square'></i>
											</button>
											<button
												type='button'
												className='btn-opciones p-1'
												onClick={() => {
													onDeleteButtonClicked(intern.id)
												}}
											>
												<i className='fa-solid fa-trash'></i>
											</button>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</>
			}

			<Modal
				title={`${selectedIntern ? 'Actualizar' : 'Resgistrar Nuevo'} Becario`}
				isShowing={isShowingModal}
				setIsShowing={setIsShowingModal}
				onClose={() => {
					setSelectedIntern(null)
				}}
			>
				<InternForm
					cancelAction={() => {
						setSelectedIntern(null)
						setIsShowingModal(false)
					}}
					internUpdate={selectedIntern}
				/>
			</Modal>
		</>
	)
}

export default Interns