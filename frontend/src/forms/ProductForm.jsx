import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import FormField from '../components/FormField';
import {
	createProductMutation,
	updateProductMutation,
	CREATE_MUTATION_OPTIONS,
	UPDATE_MUTATION_OPTIONS
} from '../utils/mutations';

const ProductForm = ({ cancelAction, productUpdate, openImageModal }) => { // Agregado openImageModal
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

	const queryClient = useQueryClient();

	const createMutation = useMutation(createProductMutation, {
		...CREATE_MUTATION_OPTIONS,
		onSuccess: async (data) => {
			console.log("savedProduct en onSuccess:", data);
			if (data && data.id) {
				console.log("Producto creado:", data); // Agregar log para inspeccionar
				openImageModal(data.id); // Abre el modal de imagen con el ID del producto
			} else {
				console.error("El producto creado no tiene un ID:", data);
			}
		},
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

	async function submitProduct() {
		try {
			let savedProduct = { ...product };

			if (product.id) {
				await updateMutation.mutateAsync(savedProduct);
			} else {
				savedProduct = await createMutation.mutateAsync(savedProduct);
			}

			await queryClient.resetQueries('products');
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
			<div className="form-group">
				<label htmlFor="es_externo">Es Externo</label>
				<select
					id="es_externo"
					name="es_externo"
					className="form-control"
					value={product.es_externo ? 'true' : 'false'}
					onChange={(e) =>
						setProduct((prevProduct) => ({
							...prevProduct,
							es_externo: e.target.value === 'true'
						}))
					}
				>
					<option value="false">No</option>
					<option value="true">Sí</option>
				</select>
			</div>
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
				name="precio_caja_con_iva"
				inputType="number"
				iconClasses="fa-solid fa-dollar-sign"
				placeholder="Precio por Caja (con IVA)"
				value={product.precio_caja_con_iva}
				onChange={handleInputChange}
			/>
			<FormField
				name="precio_caja_sin_iva"
				inputType="number"
				iconClasses="fa-solid fa-dollar-sign"
				placeholder="Precio por Caja (sin IVA)"
				value={product.precio_caja_sin_iva}
				onChange={handleInputChange}
			/>
			<FormField
				name="precio_pieza"
				inputType="number"
				iconClasses="fa-solid fa-dollar-sign"
				placeholder="Precio por Pieza"
				value={product.precio_pieza}
				onChange={handleInputChange}
			/>
			<FormField
				name="precio_pieza_con_iva"
				inputType="number"
				iconClasses="fa-solid fa-dollar-sign"
				placeholder="Precio por Pieza (con IVA)"
				value={product.precio_pieza_con_iva}
				onChange={handleInputChange}
			/>
			<FormField
				name="precio_pieza_sin_iva"
				inputType="number"
				iconClasses="fa-solid fa-dollar-sign"
				placeholder="Precio por Pieza (sin IVA)"
				value={product.precio_pieza_sin_iva}
				onChange={handleInputChange}
			/>
			<FormField
				name="precio_m2"
				inputType="number"
				iconClasses="fa-solid fa-dollar-sign"
				placeholder="Precio por m2"
				value={product.precio_m2}
				onChange={handleInputChange}
			/>
			<FormField
				name="precio_m2_con_iva"
				inputType="number"
				iconClasses="fa-solid fa-dollar-sign"
				placeholder="Precio por m2 (con IVA)"
				value={product.precio_m2_con_iva}
				onChange={handleInputChange}
			/>
			<FormField
				name="precio_m2_sin_iva"
				inputType="number"
				iconClasses="fa-solid fa-dollar-sign"
				placeholder="Precio por m2 (sin IVA)"
				value={product.precio_m2_sin_iva}
				onChange={handleInputChange}
			/>
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
