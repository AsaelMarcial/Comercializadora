import { API_HOST, processResponse } from "./dataAccessUtils"

const API_SERVICE = 'products'

export const createProduct = (product) => {
	return new Promise(async (resolve, reject) => {
		try {
			const url = `${API_HOST}/${API_SERVICE}`
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(product)
			})
			await processResponse(response)
			resolve()
		} catch (error) {
			reject(error.message)
		}
	})
}

export const readAllProducts = () => {
	return new Promise(async (resolve, reject) => {
		try {
			const url = `${API_HOST}/${API_SERVICE}`
			const response = await fetch(url)
			let products = await processResponse(response)
			resolve(products)
		} catch (error) {
			reject(error.message)
		}
	})
}

export const updateProduct = (product) => {
	const { id } = product
	return new Promise(async (resolve, reject) => {
		try {
			const url = `${API_HOST}/${API_SERVICE}/${id}`
			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(product)
			})
			await processResponse(response)
			resolve()
		} catch (error) {
			reject(error.message)
		}
	})
}

export const deleteProduct = (id) => {
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