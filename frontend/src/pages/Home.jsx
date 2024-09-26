import { useState, useEffect, useRef } from 'react'
import { Player } from '@lottiefiles/react-lottie-player'
import '../css/home.css'
import NavigationTitle from '../components/NavigationTitle'

const Home = () => {
	const [currentDate, setcurrentDate] = useState(new Date())
	const phrases = [
		'"Cocinar con amor te alimenta el alma 🧡"',
		'"En esta cocina pasan cosas mágicas ✨"',
		'"La cocina es el corazón de la casa ☕️"',
		'"Hoy me comeré la vida a mordisquitos 🌮"',
		'"Barriga llena, corazón contento 💖"',
		'"Si algo te hace feliz cómete el doble 😋"',
		'"Llena la vida con los mejores ingredientes 🍲"',
	]
	const randomIndex = useRef(Math.floor(Math.random() * (phrases.length - 1)))
	const randomPhrase = phrases[randomIndex.current]

	useEffect(() => {
		document.title = 'ComedorUV'
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
			<div className='contenedor-inicio'>
				<div className='animacion-inicio'>
					<Player
						autoplay
						loop
						background='transparent'
						src='https://assets3.lottiefiles.com/packages/lf20_jbt4j3ea.json'
						renderer='svg'
					></Player>
				</div>
				<div className='informacion-inicio'>
					<span className='texto-fecha'>
						{currentDate.toLocaleDateString()} <br />
					</span>
					<span className='texto-fecha'>
						{currentDate.toLocaleTimeString()} <br />
					</span>
					<span className='texto-inicio'>
						Personas beneficiadas: <br />
					</span>
					<span className='texto-frases'>
						{randomPhrase}
					</span>
				</div>
			</div>
		</>
	)
}

export default Home