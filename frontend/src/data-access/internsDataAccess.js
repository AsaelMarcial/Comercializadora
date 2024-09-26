import { API_HOST, processResponse } from "./dataAccessUtils"

const API_SERVICE = 'interns'

export const createIntern = (intern) => {
	return new Promise(async (resolve, reject) => {
		try {
			const url = `${API_HOST}/${API_SERVICE}`
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(intern)
			})
			await processResponse(response)
			resolve()
		} catch (error) {
			reject(error.message)
		}
	})
}

export const readAllInterns = () => {
	return new Promise(async (resolve, reject) => {
		try {
			const url = `${API_HOST}/${API_SERVICE}`
			const response = await fetch(url)
			let interns = await processResponse(response)
			resolve(interns)
		} catch (error) {
			reject(error.message)
		}
	})
}

export const updateIntern = (intern) => {
	return new Promise(async (resolve, reject) => {
		const { id } = intern
		try {
			const url = `${API_HOST}/${API_SERVICE}/${id}`
			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(intern)
			})
			await processResponse(response)
			resolve()
		} catch (error) {
			reject(error.message)
		}
	})
}

export const deleteIntern = (id) => {
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