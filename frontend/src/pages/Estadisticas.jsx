import React, { useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import NavigationTitle from '../components/NavigationTitle'
import { getAllCotizaciones } from '../data-access/cotizacionesDataAccess'
import { readAllUsers } from '../data-access/usersDataAccess'
import CanvaJSReact from '../utils/canvasjs.react'
import { QUERY_OPTIONS } from '../utils/useQuery'
import '../css/estadisticas.css'

const { CanvasJSChart } = CanvaJSReact

const Estadisticas = () => {
        const { data: cotizaciones = [] } = useQuery({
                ...QUERY_OPTIONS,
                queryKey: 'cotizaciones',
                queryFn: getAllCotizaciones,
        })

        const { data: users = [] } = useQuery({
                ...QUERY_OPTIONS,
                queryKey: 'users',
                queryFn: readAllUsers,
        })

        useEffect(() => {
                document.title = 'Orza - Estadísticas'
        }, [])

        const userLabels = useMemo(() => {
                if (!users) return {}

                return users.reduce((acc, user) => {
                        acc[user.id] = user.nombre || user.email || `Usuario ${user.id}`
                        return acc
                }, {})
        }, [users])

        const quotesPerUser = useMemo(() => {
                if (!cotizaciones || !cotizaciones.length) return []

                const totals = cotizaciones.reduce((acc, cotizacion) => {
                        const userId = cotizacion.usuario_id ?? 'sin-asignar'
                        acc[userId] = (acc[userId] || 0) + 1
                        return acc
                }, {})

                return Object.entries(totals).map(([userId, total]) => ({
                        label: userLabels[userId] || (userId === 'sin-asignar' ? 'Sin asignar' : `Usuario ${userId}`),
                        y: total,
                }))
        }, [cotizaciones, userLabels])

        const cotizacionesChartOptions = useMemo(() => ({
                animationEnabled: true,
                exportEnabled: true,
                theme: 'light2',
                title: {
                        text: 'Cotizaciones por persona',
                },
                axisY: {
                        title: 'Total de cotizaciones',
                        includeZero: true,
                        interval: 1,
                },
                data: [
                        {
                                type: 'column',
                                indexLabel: '{y}',
                                indexLabelFontColor: '#70768c',
                                dataPoints: quotesPerUser.length ? quotesPerUser : [{ label: 'Sin datos', y: 0 }],
                        },
                ],
        }), [quotesPerUser])

        return (
                <div className='estadisticas'>
                        <NavigationTitle menu='Inicio' submenu='Estadísticas' />

                        <div className='estadisticas__grid'>
                                <div className='estadisticas__card estadisticas__card--chart'>
                                        <div className='estadisticas__card-header'>
                                                <h2>Cotizaciones por persona</h2>
                                                <p>Visualiza el total de solicitudes generadas por cada usuario.</p>
                                        </div>
                                        <div className='estadisticas__chart'>
                                                <CanvasJSChart options={cotizacionesChartOptions} />
                                        </div>
                                </div>

                                <div className='estadisticas__card estadisticas__card--placeholder'>
                                        <div className='estadisticas__card-header'>
                                                <h2>Ventas</h2>
                                                <p>Seguimiento gráfico en desarrollo.</p>
                                        </div>
                                        <div className='estadisticas__placeholder'>
                                                <div className='estadisticas__placeholder-icon' aria-hidden='true'>
                                                        <i className='fa-solid fa-screwdriver-wrench'></i>
                                                </div>
                                                <p className='estadisticas__placeholder-title'>Módulo en construcción</p>
                                                <p className='estadisticas__placeholder-text'>Pronto podrás explorar el desempeño de ventas desde aquí.</p>
                                        </div>
                                </div>
                        </div>
                </div>
        )
}

export default Estadisticas
