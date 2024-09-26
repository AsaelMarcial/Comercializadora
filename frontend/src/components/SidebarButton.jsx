import React from 'react'
import { Link } from 'react-router-dom'

const SidebarButton = ({to, iconClasses, label}) => {
	return (
		<li>
			<Link to={to}>
				<i className={iconClasses}></i>
				<span className='links_nombre'>{label}</span>
			</Link>
			<span className='tooltip'>{label}</span>
		</li>
	)
}

export default SidebarButton