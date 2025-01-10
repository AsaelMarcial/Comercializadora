import { API_HOST, processResponse } from "./dataAccessUtils";

const API_SERVICE = 'productos';

export const createProduct = (product) => {
	return new Promise(async (resolve, reject) => {
		try {
			const url = `${API_HOST}/${API_SERVICE}`;
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(product)
			});
			const savedProduct = await processResponse(response);
			resolve(savedProduct); // Retorna el producto creado, incluyendo su ID
			console.log('Producto creado:', savedProduct);
		} catch (error) {
			reject(error.message);
		}
	});
};

export const readAllProducts = () => {
	return new Promise(async (resolve, reject) => {
		try {
			const url = `${API_HOST}/${API_SERVICE}`;
			const response = await fetch(url);
			let products = await processResponse(response);
			resolve(products);
		} catch (error) {
			reject(error.message);
		}
	});
};

export const updateProduct = (product) => {
	const { id } = product;
	return new Promise(async (resolve, reject) => {
		try {
			const url = `${API_HOST}/${API_SERVICE}/${id}`;
			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(product)
			});
			await processResponse(response);
			resolve();
		} catch (error) {
			reject(error.message);
		}
	});
};

export const deleteProduct = (id) => {
	return new Promise(async (resolve, reject) => {
		try {
			const url = `${API_HOST}/${API_SERVICE}/${id}`;
			const response = await fetch(url, {
				method: 'DELETE',
			});
			await processResponse(response);
			resolve();
		} catch (error) {
			reject(error.message);
		}
	});
};

export const uploadImage = (imageFile) => {
	return new Promise(async (resolve, reject) => {
		try {
			const formData = new FormData();
			formData.append('image', imageFile);

			const response = await fetch(`${API_HOST}/productos/upload-imagen`, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('Error al subir la imagen');
			}

			const data = await response.json();
			resolve(data.imageUrl); // Asume que el servidor devuelve la URL de la imagen
		} catch (error) {
			reject(error.message);
		}
	});
};

export const uploadProductImage = async (productId, file) => {
	const formData = new FormData();
	formData.append('imagen', file);

	const response = await fetch(`${API_HOST}/productos/${productId}/upload-imagen`, {
		method: 'POST',
		body: formData,
	});

	if (!response.ok) {
		throw new Error('Error al subir la imagen');
	}

	return await response.json();
};
