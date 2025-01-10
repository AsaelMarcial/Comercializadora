import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { uploadProductImage } from '../data-access/productsDataAccess';

const UploadImageModal = ({ productId, closeModal }) => {
    const [imageFile, setImageFile] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    const uploadImageMutation = useMutation(uploadProductImage, {
        onSuccess: () => {
            alert('Imagen subida correctamente');
            closeModal(); // Cierra el modal después de subir la imagen
        },
        onError: (error) => {
            setErrorMessage(`Error al subir la imagen: ${error.message}`);
        },
    });

    const handleImageChange = (event) => {
        setImageFile(event.target.files[0]);
        setErrorMessage(null); // Limpia errores previos
    };

    const handleUpload = async () => {
        if (!imageFile) {
            setErrorMessage('Por favor selecciona una imagen antes de continuar.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('imagen', imageFile);
            await uploadImageMutation.mutateAsync({ productId, file: formData });
        } catch (error) {
            console.error('Error al subir la imagen:', error);
        }
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <h3>Cargar Imagen del Producto</h3>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                />
                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={closeModal}>
                        Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={handleUpload}>
                        Subir Imagen
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadImageModal;
