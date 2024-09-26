import { API_HOST, processResponse } from "./dataAccessUtils"

const API_SERVICE = 'incomes'

export const createIncome = (income) => {
	return new Promise(async (resolve, reject) => {
		try {
			const url = `${API_HOST}/${API_SERVICE}`
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(income)
			})
			await processResponse(response)
			resolve()
		} catch (error) {
			reject(error.message)
		}
	})
}

export const readAllIncomes = () => {
	return new Promise(async (resolve, reject) => {
		try {
			const url = `${API_HOST}/${API_SERVICE}`
			const response = await fetch(url)
			let incomes = await processResponse(response)
			resolve(incomes)
		} catch (error) {
			reject(error.message)
		}
	})
}

export const updateIncome = (income) => {
	return new Promise(async (resolve, reject) => {
		const { id } = income
		try {
			const url = `${API_HOST}/${API_SERVICE}/${id}`
			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(income)
			})
			await processResponse(response)
			resolve()
		} catch (error) {
			reject(error.message)
		}
	})
}

export const deleteIncome = (id) => {
	return new Promise(async (resolve, reject) => {
		try {
			const url = `${API_HOST}/${API_SERVICE}/${id}`
			const response = await fetch(url, {
				method: 'DELETE',
			})
			await processResponse(response)
			resolve()
		} catch (error) {
			reject(error.message)
		}
	})
}