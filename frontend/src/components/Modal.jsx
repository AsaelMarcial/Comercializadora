import React from 'react'
import '../css/modal.css'

const Modal = ({ 
	children, 
	isShowing, 
	setIsShowing, 
	title, 
	onClose 
}) => {

	function closeModal() {
		onClose && onClose()
		setIsShowing(false)
	}

	return (
		<>
			{isShowing &&
				<div id='overlay' className='overlay' onClick={(e) => {
					e.target.id === 'overlay' && closeModal()
				}}>
					<div className='modal-content' >
						<div className='modal-header'>
							<h2>{ title }</h2>
						</div>
						<div className='close-button' onClick={() => {closeModal()}}>
							<i className='bi bi-x'></i>
						</div>
						{ children }
					</div>
				</div>
			}
		</>
	)
}

export default Modal