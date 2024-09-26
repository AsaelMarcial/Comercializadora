import React, { useMemo } from 'react'
import { useQuery } from 'react-query'
import { readAllIncomes } from '../data-access/incomesDataAccess'
import { readAllOutcomes } from '../data-access/outcomesDataAccess'
import CanvaJSReact from '../utils/canvasjs.react'
import { QUERY_OPTIONS } from '../utils/useQuery'
const { CanvasJSChart } = CanvaJSReact

const IncomesOutcomesChart = () => {
	const { data: incomes = [] } = useQuery({
		...QUERY_OPTIONS,
		queryKey: 'incomes',
		queryFn: readAllIncomes,
	})
	const { data: outcomes = [] } = useQuery({
		...QUERY_OPTIONS,
		queryKey: 'outcomes',
		queryFn: readAllOutcomes,
	})

	const options = useMemo(() => {
		let totalIncomes = incomes.lenght != 0 ? incomes.reduce((total, actual) => total + actual.monto, 0) : 0
		let totalOutcomes = outcomes.lenght != 0 ? outcomes.reduce((total, actual) => total + actual.total, 0) : 0

		return {
			animationEnabled: true,
			exportEnabled: true,
			theme: "light2",
			title: {
				text: "Ingresos - Egresos"
			},
			axisY: {
				minimum: 0,
				maximum: Math.max(totalIncomes, totalOutcomes)
			},
			data: [{
				type: "bar", //change type to bar, line, area, pie, etc
				indexLabel: "{y}", //Shows y value on all Data Points
				indexLabelFontColor: "#70768c",
				indexLabelPlacement: "auto",
				dataPoints: [
					{
						label: 'Ingresos',
						y: totalIncomes
					},
					{
						label: 'Egresos',
						y: totalOutcomes
					},
				]
			}]
		}
	}, [incomes, outcomes])

	return (
		<CanvasJSChart options={options} />
	)
}

export default IncomesOutcomesChart