import React, { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import NavigationTitle from '../components/NavigationTitle'
import { readAllProducts } from '../data-access/productsDataAccess'
import { datatableOptions } from '../utils/datatables'
import $ from 'jquery'
import { deleteProductMutation, DELETE_MUTATION_OPTIONS } from '../utils/mutations'
import { QUERY_OPTIONS } from '../utils/useQuery'
import Modal from '../components/Modal'
import ProductForm from '../forms/ProductForm'

const Products = () => {
	const { data: products, isLoading } = useQuery({
		...QUERY_OPTIONS,
		queryKey: 'products',
		queryFn: readAllProducts
	})
	const [isShowingModal, setIsShowingModal] = useState(false)
	const [selectedProduct, setSelectedProduct] = useState(null)
	const queryClient = useQueryClient()
	const tableRef = useRef()

	const deleteMutation = useMutation(deleteProductMutation, DELETE_MUTATION_OPTIONS)

	useEffect(() => {
		document.title = 'ComedorUV - Productos'
		const table = $(tableRef.current).DataTable(datatableOptions)
		table.draw()
	}, [products])

	async function onDeleteButtonClicked(id) {
		await deleteMutation.mutateAsync(id)
		queryClient.resetQueries()
	}

	return (
		<>
			<NavigationTitle
				menu='Inicio'
				submenu='Productos'
			/>
			{isLoading ? 'Loading...' :
				<>
					<button
						type='button'
						className='btn-registrar'
						onClick={() => setIsShowingModal(true)}
					>
						<i className='fa-solid fa-plus'></i> Nuevo producto
					</button>
					<div className='contenedor-tabla'>
						<h3>Productos</h3>
						<table ref={tableRef} className='table table-hover table-borderless'>
							<thead>
								<tr>
									<th className='leading-row'>Nombre</th>
									<th>Precio de Compra</th>
									<th>Precio de Venta</th>
									<th>Precio Preferencial</th>
									<th>Stock</th>
									<th>Tipo</th>
									<th className='trailing-row'>Opciones</th>
								</tr>
							</thead>
							<tbody className='table-group-divider'>
								{products.map(product =>
									<tr key={product.id}>
										<td className='leading-row'>{product.nombre}</td>
										<td>${product.precioCompra}</td>
										<td>${product.precioVenta}</td>
										<td>${product.precioPreferencial}</td>
										<td>{product.stock}</td>
										<td>{product.tipo}</td>
										<td className='trailing-row'>
											<button
												type='button'
												className='btn-opciones p-1'
												onClick={() => {
													setSelectedProduct(product)
													setIsShowingModal(true)
												}}
											>
												<i className='fa-solid fa-pen-to-square'></i>
											</button>
											<button
												type='button'
												className='btn-opciones p-1'
												onClick={() => {
													onDeleteButtonClicked(product.id)
												}}
											>
												<i className='fa-solid fa-trash'></i>
											</button>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</>
			}

			<Modal
				title={`${selectedProduct ? 'Actualizar' : 'Registrar Nuevo'} Producto`}
				isShowing={isShowingModal}
				setIsShowing={setIsShowingModal}
				onClose={() => {
					setSelectedProduct(null)
				}}
			>
				<ProductForm
					cancelAction={() => {
						setSelectedProduct(null)
						setIsShowingModal(null)
					}}
					productUpdate={selectedProduct}
				/>
			</Modal>

		</>
	)
}

export default Products