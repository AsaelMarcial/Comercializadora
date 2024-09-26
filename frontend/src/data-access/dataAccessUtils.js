export const API_HOST = 'http://localhost:3001'

export const processResponse = async (response) => {
	if (!response) {
		throw new Error('Error de red.')
	}
	if (!response.ok) {
		const error = await response.json()
		throw new Error(error)
	}
	let data = await response.json()
	return data
}