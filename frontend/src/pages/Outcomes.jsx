import React, { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import NavigationTitle from '../components/NavigationTitle'
import { datatableOptions } from '../utils/datatables'
import { readAllOutcomes } from '../data-access/outcomesDataAccess'
import $ from 'jquery'
import Modal from '../components/Modal'
import OutcomeForm from '../forms/OutcomeForm'
import { deleteOutcomeMutation, DELETE_MUTATION_OPTIONS } from '../utils/mutations'
import { QUERY_OPTIONS } from '../utils/useQuery'
import 'datatables.net-buttons/js/buttons.print.js'

const Outcomes = () => {
	const { data: outcomes, isLoading } = useQuery({
		...QUERY_OPTIONS,
		queryKey: 'outcomes', 
		queryFn: readAllOutcomes
	})
	const [isShowingModal, setIsShowingModal] = useState(false)
	const [selectedOutcome, setSelectedOutcome] = useState(null)
	const queryClient = useQueryClient()
	const tableRef = useRef()

	const deleteMutation = useMutation(deleteOutcomeMutation, DELETE_MUTATION_OPTIONS)


	useEffect(() => {
		document.title = 'ComedorUV - Egresos'
		const table = $(tableRef.current).DataTable(datatableOptions)
		table.draw()
	}, [outcomes])

	async function onDeleteButtonClicked(id) {
		await deleteMutation.mutateAsync(id)
		queryClient.resetQueries()
	}

	return (
		<>
			<NavigationTitle
				menu='Inicio'
				submenu='Lista de egresos'
			/>
			{isLoading ? 'Loading' :
				<>
					<button
						type='button'
						className='btn-registrar'
						onClick={() => setIsShowingModal(true)}
					>
						<i className='fa-solid fa-plus'></i> Nuevo egreso
					</button>
					<div className='contenedor-tabla'>
						<h3>Egresos</h3>
						<table ref={tableRef} className='table table-hover table-borderless'>
							<thead>
								<tr>
									<th className='leading-row'>Proveedor</th>
									<th>Descripción</th>
									<th>Partida</th>
									<th>Total</th>
									<th>Factura</th>
									<th className='trailing-row'>Opciones</th>
								</tr>
							</thead>
							<tbody className='table-group-divider'>
								{outcomes.map(outcome =>
									<tr key={outcome.id}>
										<td className='leading-row'>{outcome.proveedor}</td>
										<td>{outcome.descripcion}</td>
										<td>{outcome.partida}</td>
										<td>{outcome.total}</td>
										<td>{outcome.factura}</td>
										<td className='trailing-row'>
											<button
												type='button'
												className='btn-opciones p-1'
												onClick={() => {
													setSelectedOutcome(outcome)
													setIsShowingModal(true)
												}}
											>
												<i className='fa-solid fa-pen-to-square'></i>
											</button>
											<button
												type='button'
												className='btn-opciones p-1'
												onClick={() => {
													onDeleteButtonClicked(outcome.id)
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
				title={`${selectedOutcome ? 'Actualizar' : 'Registrar Nuevo'} Egreso`}
				isShowing={isShowingModal}
				setIsShowing={setIsShowingModal}
				onClose={() => {
					setSelectedOutcome(null)
				}}
			>
				<OutcomeForm
					cancelAction={() => {
						setSelectedOutcome(null)
						setIsShowingModal(false)
					}}
					outcomeUpdate={selectedOutcome}
				/>
			</Modal>
		</>
	)
}

export default Outcomes


