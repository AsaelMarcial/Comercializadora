import React from 'react'
import IncomesOutcomesChart from '../components/IncomesOutcomesChart'
import NavigationTitle from '../components/NavigationTitle'
import CanvaJSReact from '../utils/canvasjs.react'
const { CanvasJSChart } = CanvaJSReact

const Reports = () => {


	return (
		<div className='contenedor-tabla'>
			<NavigationTitle
				menu='Inicio'
				submenu='Reportes'
			/>
			<IncomesOutcomesChart />
		</div>
	)
}

export default Reports