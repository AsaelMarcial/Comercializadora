import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import '../css/home.css'
import NavigationTitle from '../components/NavigationTitle'

const Home = () => {
        const [currentDate, setCurrentDate] = useState(new Date())

        useEffect(() => {
                document.title = 'Comercializadora ORZA'
                const timerId = setInterval(() => {
                        setCurrentDate(new Date())
                }, 1000)

                return () => {
                        clearInterval(timerId)
                }
        }, [])

        const greeting = useMemo(() => {
                const hours = currentDate.getHours()

                if (hours < 12) return 'Buenos días'
                if (hours < 19) return 'Buenas tardes'
                return 'Buenas noches'
        }, [currentDate])

        const formattedDate = useMemo(() => {
                const formatter = new Intl.DateTimeFormat('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                })
                const rawDate = formatter.format(currentDate)
                return rawDate.charAt(0).toUpperCase() + rawDate.slice(1)
        }, [currentDate])

        const formattedTime = useMemo(
                () =>
                        currentDate.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                        }),
                [currentDate]
        )

        const highlightCards = useMemo(
                () => [
                        {
                                title: 'Ventas en curso',
                                description:
                                        'Revisa las transacciones confirmadas y pendientes para mantener el flujo de ventas al día.',
                                icon: 'fa-solid fa-store'
                        },
                        {
                                title: 'Inventario actualizado',
                                description:
                                        'Consulta niveles de stock y productos destacados para responder a la demanda a tiempo.',
                                icon: 'fa-solid fa-boxes-stacked'
                        },
                        {
                                title: 'Relaciones comerciales',
                                description:
                                        'Mantén comunicación constante con clientes y proveedores clave desde un solo panel.',
                                icon: 'fa-solid fa-handshake-angle'
                        }
                ],
                []
        )

        const quickActions = useMemo(
                () => [
                        {
                                to: '/app/ventas',
                                title: 'Registrar venta',
                                description: 'Añade una nueva transacción y actualiza tus indicadores en segundos.',
                                icon: 'fa-solid fa-receipt'
                        },
                        {
                                to: '/app/products',
                                title: 'Gestionar inventario',
                                description: 'Organiza tus productos, actualiza precios y controla existencias.',
                                icon: 'fa-solid fa-box-open'
                        },
                        {
                                to: '/app/ventas/cotizaciones',
                                title: 'Crear cotización',
                                description: 'Envía propuestas profesionales y da seguimiento a oportunidades de venta.',
                                icon: 'fa-solid fa-file-signature'
                        },
                        {
                                to: '/app/reports',
                                title: 'Analizar reportes',
                                description: 'Identifica tendencias y oportunidades con informes consolidados.',
                                icon: 'fa-solid fa-chart-line'
                        }
                ],
                []
        )

        return (
                <>
                        <NavigationTitle menu="Inicio" />
                        <div className="home">
                                <section className="home__hero">
                                        <div className="home__hero-copy">
                                                <p className="home__hero-date">{formattedDate}</p>
                                                <h1 className="home__hero-title">{greeting}, equipo ORZA</h1>
                                                <p className="home__hero-subtitle">
                                                        Gestiona tus ventas, compras y reportes con una vista moderna que te ayuda a
                                                        priorizar lo importante.
                                                </p>
                                                <div className="home__hero-time">
                                                        <span className="home__hero-clock">{formattedTime}</span>
                                                        <span className="home__hero-clock-label">Hora local</span>
                                                </div>
                                        </div>
                                        <div className="home__hero-image" aria-hidden="true">
                                                <img
                                                        src="/Logo DISTRIBUIDORA Orza FONDO AZUL.png"
                                                        alt="Logo DISTRIBUIDORA Orza"
                                                />
                                        </div>
                                </section>

                                <section className="home__metrics" aria-label="Resumen del sistema">
                                        {highlightCards.map((card) => (
                                                <article className="home__metric" key={card.title}>
                                                        <div className="home__metric-icon" aria-hidden="true">
                                                                <i className={card.icon}></i>
                                                        </div>
                                                        <div className="home__metric-content">
                                                                <h2>{card.title}</h2>
                                                                <p>{card.description}</p>
                                                        </div>
                                                </article>
                                        ))}
                                </section>

                                <section className="home__quick-actions" aria-label="Accesos directos">
                                        <div className="home__section-header">
                                                <h2>Accesos directos</h2>
                                                <p>Comienza tus tareas frecuentes desde aquí y mantén el control del negocio.</p>
                                        </div>
                                        <div className="home__quick-actions-grid">
                                                {quickActions.map((action) => (
                                                        <Link className="home__quick-action" to={action.to} key={action.title}>
                                                                <div className="home__quick-action-icon" aria-hidden="true">
                                                                        <i className={action.icon}></i>
                                                                </div>
                                                                <div className="home__quick-action-content">
                                                                        <h3>{action.title}</h3>
                                                                        <p>{action.description}</p>
                                                                        <span className="home__quick-action-link">
                                                                                Ir al módulo <i className="fa-solid fa-arrow-right"></i>
                                                                        </span>
                                                                </div>
                                                        </Link>
                                                ))}
                                        </div>
                                </section>
                        </div>
                </>
        )
}

export default Home
