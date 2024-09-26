import React, { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import NavigationTitle from '../components/NavigationTitle'
import { readAllProducts } from '../data-access/productsDataAccess'
import { QUERY_OPTIONS } from '../utils/useQuery'
import '../css/menu.css'
import '../utils/formatting'
import FormField from '../components/FormField'
import TextInput from 'react-autocomplete-input'
import { readAllInterns } from '../data-access/internsDataAccess'


const Menu = () => {
	const [selectedCategory, setSelectedCategory] = useState('Alimentos')
	const [order, setOrder] = useState([])
	const { data: products, isLoading } = useQuery({
		...QUERY_OPTIONS,
		queryKey: 'products',
		queryFn: readAllProducts,
	})

	const { data: interns } = useQuery({
		...QUERY_OPTIONS,
		queryKey: 'interns',
		queryFn: readAllInterns,
	})

	const [orderDetails, setOrderDetails] = useState({
		nombre: '',
		notas: '',
		imprimirTicket: false,
		esBecario: false,
		nombreBecario: '',
	})

	const internsNames = useMemo(() => {
		return interns ? interns.map((intern) => {
			return `${intern.firstName} ${intern.lastName}`
		}) : []
	})

	const total = useMemo(() => {
		return order.reduce((total, actual) => total + (actual.cantidad * actual.producto.precioVenta), 0
		)
	}, [order])

	const filteredProducts = useMemo(() => {
		return products ? products.filter(product => product.tipo === selectedCategory) : []
	}, [products, selectedCategory])

	function onTabElementClicked(event) {
		setSelectedCategory(event.target.innerHTML)
	}

	function addToOrder(producto) {
		let found = order.find(orderItem => orderItem.producto.id === producto.id)
		if (!found) {
			setOrder(prevOrder => {
				return [
					...prevOrder,
					{
						producto: producto,
						cantidad: 1
					}
				]
			})
			return
		}
		setOrder(prevOrder => {
			let newOrder = prevOrder.filter(orderItem => orderItem !== found)
			newOrder.push({
				...found,
				cantidad: found.cantidad + 1
			})
			return newOrder
		})
	}

	function removeFromOrder(producto) {
		let found = order.find(orderItem => orderItem.producto.id === producto.id)
		if (!found) return
		setOrder(prevOrder => {
			let newOrder = prevOrder.filter(orderItem => orderItem !== found)
			if (found.cantidad > 1) {
				newOrder.push({
					...found,
					cantidad: found.cantidad - 1
				})
			}
			return newOrder
		})
	}

	function handleInputChange(event) {
		setOrderDetails(prevOrderDetails => {
			return {
				...prevOrderDetails,
				[event.target.name]: event.target.value
			}
		})
	}

	return (
		<div className='contenedor-tabla'>
			<NavigationTitle
				menu='Inicio'
				submenu='Menu'
			/>
			<div className='tab-bar'>
				<h3 className={`tab-element ${selectedCategory === 'Alimentos' && 'active'}`} onClick={onTabElementClicked} >Alimentos</h3>
				<h3>|</h3>
				<h3 className={`tab-element ${selectedCategory === 'Dulcería' && 'active'}`} onClick={onTabElementClicked} >Dulcería</h3>
				<h3>|</h3>
				<h3 className={`tab-element ${selectedCategory === 'Bebidas' && 'active'}`} onClick={onTabElementClicked} >Bebidas</h3>
			</div>
			<div className='main-container'>
				<div className='products-container'>
					{isLoading ? 'Loading' :
						filteredProducts.map(product => {
							return (
								<div key={product.id} className='menu-item'>
									<img className='menu-item-image' src="https://upload.wikimedia.org/wikipedia/commons/e/ee/Empanadas_de_Queso.jpg" alt="empanadas" />
									<div className='menu-item-content'>
										<p className='menu-item-nombre'>{product.nombre}</p>
										<p className='menu-item-precio'>${product.precioVenta}</p>
									</div>
									<div className='stepper-container'>
										<i
											className='fa-solid fa-minus stepper-button'
											onClick={() => {
												removeFromOrder(product)
											}}
										></i>
										<div className='stepper-count'></div>
										<i
											className='fa-solid fa-plus stepper-button'
											onClick={() => {
												addToOrder(product)
											}}
										></i>
									</div>
								</div>
							)
						})
					}
				</div>
				<div className='order-card'>
					<h4>Detalles de la Orden</h4>
					<div className='table-productos'>
						{order.length > 0 ?
							<table>
								<thead>
									<tr>
										<td>Cantidad</td>
										<td>Descripción</td>
										<td>Subtotal</td>
									</tr>
								</thead>
								<tbody>
									{order.map(orderItem => {
										return (
											<tr key={orderItem.producto.id}>
												<td>{orderItem.cantidad}</td>
												<td>{orderItem.producto.nombre}</td>
												<td>${(orderItem.producto.precioVenta * orderItem.cantidad).priceFormat()}</td>
											</tr>
										)
									})}
									<tr>
										<td className='blank-td'></td>
										<td className='blank-td'>Total</td>
										<td className='blank-td'>${total.priceFormat()}</td>
									</tr>
								</tbody>
							</table>
							:
							'Aún no ha agregado ningún producto a la orden'
						}
					</div>

					<div className='ticket-toggle'>
						<label className="form-check-label" >Imprimir ticket</label>
						<label className="switch">
							<input type="checkbox" checked={orderDetails.imprimirTicket} onChange={() => {
								setOrderDetails(prevOrderDetails => {
									return {
										...prevOrderDetails,
										imprimirTicket: !prevOrderDetails.imprimirTicket
									}
								})
							}} />
							<span className="slider round"></span>
						</label>
					</div>
					<div className='ticket-toggle'>
						<label className="form-check-label" >Es Becario</label>
						<label className="switch">
							<input type="checkbox" checked={orderDetails.esBecario} onChange={() => {
								setOrderDetails(prevOrderDetails => {
									return {
										...prevOrderDetails,
										esBecario: !prevOrderDetails.esBecario
									}
								})
							}} />
							<span className="slider round"></span>
						</label>
					</div>

					{orderDetails.esBecario ?
						<TextInput
							rows={1}
							className='becario-input'
							placeholder='Nombre del becario'
							trigger={['']}
							options={internsNames}
							value={orderDetails.nombreBecario}
							onChange={(value) => {
								setOrderDetails(prevOrderDetails => {
									return {
										...prevOrderDetails,
										nombreBecario: value
									}
								})
							}}
						/>
						:
						<FormField
							name='nombre'
							inputType='text'
							iconClasses='fa-solid fa-user'
							placeholder='Nombre'
							value={orderDetails.nombre}
							onChange={handleInputChange}
						/>
					}




					<textarea
						name="notas"
						cols="30"
						rows="5"
						placeholder='Notas'
						value={orderDetails.notas}
						onChange={handleInputChange}
					></textarea>

					<div className='modal-footer'>
						<button
							type='button'
							className='btn btn-danger'
							onClick={() => { }}
						>
							Cancelar
						</button>
						<button
							type='button'
							className='btn btn-primary'
							onClick={() => { }}
						>
							Continuar
						</button>
					</div>
				</div>

			</div>
		</div>
	)
}

export default Menu