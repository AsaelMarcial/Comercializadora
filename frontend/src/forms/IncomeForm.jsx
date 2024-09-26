import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import FormField from '../components/FormField'
import { createIncomeMutation, CREATE_MUTATION_OPTIONS, updateIncomeMutation } from '../utils/mutations'

const IncomeForm = ({ cancelAction, incomeUpdate }) => {
	const [income, setIncome] = useState(incomeUpdate ?? {
		concepto: '',
		monto: 0.00,
		referencia: ''
	})
	const queryClient = useQueryClient()
	const createMutation = useMutation(createIncomeMutation, {
		...CREATE_MUTATION_OPTIONS,
		onSettled: async () => {
			queryClient.resetQueries('incomes')
		}
	})

	const updateMutation = useMutation(updateIncomeMutation, {
		...CREATE_MUTATION_OPTIONS,
		onSettled: async () => {
			queryClient.resetQueries('incomes')
		}
	})

	function handleInputChange(event) {
		setIncome(prevIncome => {
			return {
				...prevIncome,
				[event.target.name]: event.target.value
			}
		})
	}

	async function submitIncome() {
		if (income.id) {
			await updateMutation.mutateAsync(income)
			updateMutation.reset()
		} else {
			await createMutation.mutateAsync(income)
			createMutation.reset()
		}
		await queryClient.resetQueries()
		cancelAction()
	}

	return (
		<form>
			<FormField
				name='concepto'
				inputType='text'
				iconClasses='fa-solid fa-tag'
				placeholder='Concepto'
				value={income.concepto}
				onChange={handleInputChange}
			/>
			<FormField
				name='monto'
				inputType='text'
				iconClasses='fa-solid fa-coins'
				placeholder='Monto'
				value={income.monto}
				onChange={handleInputChange}
			/>
			<FormField
				name='referencia'
				inputType='text'
				iconClasses='fa-solid fa-money-check'
				placeholder='Referencia'
				value={income.referencia}
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
					onClick={submitIncome}
				>
					{`${income.id ? 'Actualizar' : 'Guardar'}`}
				</button>
			</div>
		</form>
	)
}

export default IncomeForm