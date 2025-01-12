import React, {useEffect, useState} from 'react';
import { useMutation } from 'react-query';
import { uploadProductImage } from '../data-access/productsDataAccess';

const UploadImageModal = ({ productId, closeModal }) => {
    const [imageFile, setImageFile] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    useEffect(() => {
        console.log('UploadImageModal montado con productId:', productId);
    }, [productId]);

    // Mutation para subir la imagen
    const uploadImageMutation = useMutation(uploadProductImage, {
        onSuccess: () => {
            alert('Imagen subida correctamente');
            closeModal(); // Cierra el modal después de subir la imagen
        },
        onError: (error) => {
            setErrorMessage(`Error al subir la imagen: ${error.message}`);
        },
    });

    // Manejar cambio de archivo
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const allowedExtensions = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedExtensions.includes(file.type)) {
            setErrorMessage('Solo se permiten imágenes en formato JPG o PNG.');
            setImageFile(null);
            return;
        }

        setImageFile(file);
        setErrorMessage(null); // Limpia errores previos
    };

    // Manejar subida de imagen
    const handleUpload = async () => {
        if (!imageFile) {
            setErrorMessage('Por favor selecciona una imagen antes de continuar.');
            return;
        }

        if (!productId || typeof productId !== 'number') {
            setErrorMessage('El ID del producto no es válido.');
            return;
        }

        try {
            console.log('Subiendo imagen para el producto:', productId);
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
