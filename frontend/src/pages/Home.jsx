import { useState, useEffect, useRef } from 'react'
import '../css/home.css'
import NavigationTitle from '../components/NavigationTitle'

const Home = () => {
	const [currentDate, setcurrentDate] = useState(new Date())
	useEffect(() => {
		document.title = 'Comercializadora ORZA'
		const timerId = setInterval(refreshClock, 1000)

		return () => {
			clearInterval(timerId)
		}
	}, [])

	function refreshClock() {
		setcurrentDate(new Date())
	}


	return (
		<>
			<NavigationTitle menu="Inicio"/>
			<div className='contenedor-inicio' style={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100%',
				width: '100%',
				textAlign: 'center'
			}}>
				<div>
					<img 
						src="\Logo DISTRIBUIDORA Orza FONDO AZUL.png" 
						alt="Logo DISTRIBUIDORA Orza"
						style={{ 
							width: '100%', 
							maxWidth: '300px', 
							height: 'auto',
							marginBottom: '20px' // Añade espacio entre la imagen y el texto
						}} 
					/>
				</div>
				<div className='informacion-inicio'>
					<span className='texto-fecha'>
						{currentDate.toLocaleDateString()} <br />
					</span>
					<span className='texto-fecha'>
						{currentDate.toLocaleTimeString()} <br />
					</span>
					<span className='texto-inicio'>
						Bienvenido: <br />
					</span>
					<span className='texto-frases'>
						Asael
					</span>
				</div>
			</div>
		</>
	)
}

export default Home