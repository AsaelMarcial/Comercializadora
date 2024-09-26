import React from 'react'

const NavigationTitle = ({menu, submenu}) => {
  return (
	<nav aria-label='breadcrumb' style={{marginLeft: '20px'}}>
		<ol className='breadcrumb bg-transparent p-0'>
			<li className='breadcrumb-item active' aria-current='page'>{menu}</li>
			{submenu && <li className='breadcrumb-item active' aria-current='page'>{submenu}</li>}
		</ol>
	</nav>
  )
}

export default NavigationTitle