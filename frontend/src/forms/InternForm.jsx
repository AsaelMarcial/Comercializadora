import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import FormField from '../components/FormField'
import { createInternMutation, CREATE_MUTATION_OPTIONS, updateInternMutation, UPDATE_MUTATION_OPTIONS } from '../utils/mutations'
import '../utils/formatting'

const InternForm = ({ cancelAction, internUpdate }) => {
	const [intern, setIntern] = useState(internUpdate ? {
		...internUpdate,
		fechaInicio: new Date(internUpdate.fechaInicio).formatted(),
		fechaFin: new Date(internUpdate.fechaFin).formatted(),
	} : {
		firstName: '',
		lastName: '',
		carrera: '',
		credito: '',
		fechaInicio: new Date().toISOString(),
		fechaFin: new Date().toISOString()
	})
	const queryClient = useQueryClient()
	const createMutation = useMutation(createInternMutation, {
		...CREATE_MUTATION_OPTIONS,
		onSettled: async () => {
			queryClient.resetQueries('interns')
		}
	})

	const updateMutation = useMutation(updateInternMutation, {
		...UPDATE_MUTATION_OPTIONS,
		onSettled: async () => {
			queryClient.resetQueries('interns')
		}
	})

	function handleInputChange(event) {
		setIntern(prevIntern => {
			return {
				...prevIntern,
				[event.target.name]: event.target.value
			}
		})
	}

	async function submitIntern() {
		if (intern.id) {
			await updateMutation.mutateAsync(intern)
			updateMutation.reset()
		} else {
			await createMutation.mutateAsync(intern)
			createMutation.reset()
		}
		await queryClient.resetQueries()
		cancelAction()
	}

	return (
		<form>
			<FormField
				name='firstName'
				inputType='text'
				iconClasses='fa-solid fa-i-cursor'
				placeholder='Nombre'
				value={intern.firstName}
				onChange={handleInputChange}
			/>
			<FormField
				name='lastName'
				inputType='text'
				iconClasses='fa-solid fa-i-cursor'
				placeholder='Apellido'
				value={intern.lastName}
				onChange={handleInputChange}
			/>
			<FormField
				name='carrera'
				inputType='text'
				iconClasses='fa-solid fa-user-graduate'
				placeholder='Carrera'
				value={intern.carrera}
				onChange={handleInputChange}
			/>
			<FormField
				name='credito'
				inputType='number'
				iconClasses='fa-solid fa-dollar'
				placeholder='Crédito'
				value={intern.credito}
				onChange={handleInputChange}
			/>
			<FormField
				name='fechaInicio'
				inputType='date'
				iconClasses='fa-solid fa-calendar-days'
				placeholder='Fecha de Inicio'
				value={intern.fechaInicio}
				onChange={handleInputChange}
			/>
			<FormField
				name='fechaFin'
				inputType='date'
				iconClasses='fa-solid fa-calendar-days'
				placeholder='Fecha de Fin'
				value={intern.fechaFin}
				onChange={handleInputChange}
			/>
			<div className='modal-footer'>
				<button
					type='button'
					className='btn btn-danger'
					onClick={cancelAction}
				>
					Cancelar
				</button>
				<button
					type='button'
					className='btn btn-primary'
					onClick={submitIntern}
				>
					{`${intern.id ? 'Actualizar' : 'Guardar'}`}
				</button>
			</div>
		</form>
	)
}

export default InternForm