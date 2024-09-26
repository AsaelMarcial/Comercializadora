import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import FormField from '../components/FormField'
import { createUserMutation, CREATE_MUTATION_OPTIONS, updateUserMutation, UPDATE_MUTATION_OPTIONS } from '../utils/mutations'

const UserForm = ({ cancelAction, userUpdate }) => {
	const [user, setUser] = useState(userUpdate ?? {
		firstName: '',
		lastName: '',
		email: '',
		username: '',
		rol: ''
	})
	const queryClient = useQueryClient()
	const createMutation = useMutation(createUserMutation, {
		...CREATE_MUTATION_OPTIONS,
		onSettled: async () => {
			queryClient.resetQueries('users')
		}
	})

	const updateMutation = useMutation(updateUserMutation, {
		...UPDATE_MUTATION_OPTIONS,
		onSettled: async () => {
			queryClient.resetQueries('users')
		}
	})

	function handleInputChange(event) {
		setUser(prevUser => {
			return {
				...prevUser,
				[event.target.name]: event.target.value
			}
		})
	}

	async function submitUser() {
		if (user.id) {
			await updateMutation.mutateAsync(user)
			updateMutation.reset()
		} else {
			await createMutation.mutateAsync(user)
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
				value={user.firstName}
				onChange={handleInputChange}
			/>
			<FormField
				name='lastName'
				inputType='text'
				iconClasses='fa-solid fa-i-cursor'
				placeholder='Apellido'
				value={user.lastName}
				onChange={handleInputChange}
			/>
			<FormField
				name='email'
				inputType='email'
				iconClasses='fa-solid fa-at'
				placeholder='E-mail'
				value={user.email}
				onChange={handleInputChange}
			/>
			<FormField
				name='username'
				inputType='text'
				iconClasses='fa-solid fa-user'
				placeholder='Apellido'
				value={user.username}
				onChange={handleInputChange}
			/>
			<FormField
				name='rol'
				inputType='text'
				iconClasses='fa-solid fa-address-book'
				placeholder='Rol'
				value={user.rol}
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
					onClick={submitUser}
				>
					{`${user.id ? 'Actualizar' : 'Guardar'}`}
				</button>
			</div>
		</form>
	)
}

export default UserForm