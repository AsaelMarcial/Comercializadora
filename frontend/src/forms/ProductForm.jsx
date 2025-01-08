import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import FormField from '../components/FormField';
import {
	createProductMutation,
	updateProductMutation,
	CREATE_MUTATION_OPTIONS,
	UPDATE_MUTATION_OPTIONS
} from '../utils/mutations';

const ProductForm = ({ cancelAction, productUpdate }) => {
	const [product, setProduct] = useState(productUpdate ?? {
		codigo: '',
		nombre: '',
		formato: '',
		unidad_venta: '',
		piezas_caja: '',
		peso_pieza_kg: '',
		peso_caja_kg: '',
		m2_caja: '',
		precio_caja: '',
		precio_caja_con_iva: '',
		precio_caja_sin_iva: '',
		precio_pieza: '',
		precio_pieza_con_iva: '',
		precio_pieza_sin_iva: '',
		precio_m2: '',
		precio_m2_con_iva: '',
		precio_m2_sin_iva: '',
		imagen_url: '',
		color: '',
		material: '',
		es_externo: false
	});
	const [imageFile, setImageFile] = useState(null); // Estado para manejar la imagen seleccionada

	const queryClient = useQueryClient();

	const createMutation = useMutation(createProductMutation, {
		...CREATE_MUTATION_OPTIONS,
		onSettled: async () => {
			queryClient.resetQueries('products');
		}
	});

	const updateMutation = useMutation(updateProductMutation, {
		...UPDATE_MUTATION_OPTIONS,
		onSettled: async () => {
			queryClient.resetQueries('products');
		}
	});

	function handleInputChange(event) {
		const { name, value, type, checked } = event.target;
		setProduct((prevProduct) => ({
			...prevProduct,
			[name]: type === 'checkbox' ? checked : value
		}));
	}

	function handleImageChange(event) {
		const file = event.target.files[0];
		setImageFile(file); // Guardamos el archivo seleccionado en el estado
	}

	async function uploadImage() {
		if (!imageFile) return null;

		const formData = new FormData();
		formData.append('image', imageFile);

		// Endpoint de subida de imágenes (actualiza con tu URL)
		const response = await fetch('YOUR_IMAGE_UPLOAD_ENDPOINT', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			throw new Error('Error al subir la imagen');
		}

		const data = await response.json();
		return data.imageUrl; // Asume que el servidor devuelve la URL de la imagen
	}

	async function submitProduct() {
		try {
			let imageUrl = product.imagen_url;

			// Si hay una imagen seleccionada, súbela primero
			if (imageFile) {
				imageUrl = await uploadImage();
			}

			// Actualizamos el producto con la URL de la imagen
			const productToSave = {
				...product,
				imagen_url: imageUrl
			};

			if (product.id) {
				await updateMutation.mutateAsync(productToSave);
				updateMutation.reset();
			} else {
				await createMutation.mutateAsync(productToSave);
				createMutation.reset();
			}
			await queryClient.resetQueries();
			cancelAction();
		} catch (error) {
			console.error('Error al guardar el producto:', error);
		}
	}

	return (
		<form>
			<FormField
				name="codigo"
				inputType="text"
				iconClasses="fa-solid fa-barcode"
				placeholder="Código del Producto"
				value={product.codigo}
				onChange={handleInputChange}
			/>
			<FormField
				name="nombre"
				inputType="text"
				iconClasses="fa-solid fa-i-cursor"
				placeholder="Nombre del Producto"
				value={product.nombre}
				onChange={handleInputChange}
			/>
			<FormField
				name="formato"
				inputType="text"
				iconClasses="fa-solid fa-box"
				placeholder="Formato"
				value={product.formato}
				onChange={handleInputChange}
			/>
			<FormField
				name="unidad_venta"
				inputType="text"
				iconClasses="fa-solid fa-ruler-combined"
				placeholder="Unidad de Venta"
				value={product.unidad_venta}
				onChange={handleInputChange}
			/>
			<FormField
				name="piezas_caja"
				inputType="number"
				iconClasses="fa-solid fa-cubes"
				placeholder="Piezas por Caja"
				value={product.piezas_caja}
				onChange={handleInputChange}
			/>
			<FormField
				name="peso_pieza_kg"
				inputType="number"
				iconClasses="fa-solid fa-weight-hanging"
				placeholder="Peso por Pieza (kg)"
				value={product.peso_pieza_kg}
				onChange={handleInputChange}
			/>
			<FormField
				name="peso_caja_kg"
				inputType="number"
				iconClasses="fa-solid fa-box-open"
				placeholder="Peso por Caja (kg)"
				value={product.peso_caja_kg}
				onChange={handleInputChange}
			/>
			<FormField
				name="m2_caja"
				inputType="number"
				iconClasses="fa-solid fa-ruler-horizontal"
				placeholder="M2 por Caja"
				value={product.m2_caja}
				onChange={handleInputChange}
			/>
			<FormField
				name="precio_caja"
				inputType="number"
				iconClasses="fa-solid fa-dollar-sign"
				placeholder="Precio por Caja"
				value={product.precio_caja}
				onChange={handleInputChange}
			/>
			<FormField
				name="imagen_url"
				inputType="file"
				iconClasses="fa-solid fa-image"
				placeholder="Seleccionar Imagen"
				onChange={handleImageChange} // Maneja el cambio de la imagen
			/>
			<FormField
				name="color"
				inputType="text"
				iconClasses="fa-solid fa-palette"
				placeholder="Color"
				value={product.color}
				onChange={handleInputChange}
			/>
			<FormField
				name="material"
				inputType="text"
				iconClasses="fa-solid fa-tools"
				placeholder="Material"
				value={product.material}
				onChange={handleInputChange}
			/>
			<div className="form-check">
				<input
					className="form-check-input"
					type="checkbox"
					id="es_externo"
					name="es_externo"
					checked={product.es_externo}
					onChange={handleInputChange}
				/>
				<label className="form-check-label" htmlFor="es_externo">
					Es Externo
				</label>
			</div>
			<div className="modal-footer">
				<button type="button" className="btn btn-danger" onClick={cancelAction}>
					Cancelar
				</button>
				<button type="button" className="btn btn-primary" onClick={submitProduct}>
					{`${product.id ? 'Actualizar' : 'Guardar'}`}
				</button>
			</div>
		</form>
	);
};

export default ProductForm;
