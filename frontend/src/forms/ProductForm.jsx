import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import FormField from '../components/FormField';
import {
    createProductMutation,
    updateProductMutation,
    CREATE_MUTATION_OPTIONS,
    UPDATE_MUTATION_OPTIONS
} from '../utils/mutations';
import { readAllProveedores } from '../data-access/proveedoresDataAccess';

const ProductForm = ({ cancelAction, productUpdate, currentUserId, openImageModal }) => {
    const [product, setProduct] = useState(productUpdate ?? {
        codigo: '',
        nombre: '',
        formato: '',
        unidad_venta: '',
        piezas_caja: '',
        peso_pieza_kg: '',
        peso_caja_kg: '',
        m2_caja: '',
        precio_caja: '',
        precio_pieza: '',
        precio_m2: '',
        incluye_iva: true,
        color: '',
        material: '',
        es_externo: false,
        proveedor_id: null, // Campo nuevo para el proveedor
    });

    const { data: proveedores, isLoading: loadingProveedores } = useQuery('proveedores', readAllProveedores);
    const IVA_RATE = 0.16;
    const queryClient = useQueryClient();

    const createMutation = useMutation(createProductMutation, {
        ...CREATE_MUTATION_OPTIONS,
        onSuccess: () => {
            queryClient.invalidateQueries('products');
            cancelAction();
        },
    });

    const updateMutation = useMutation(updateProductMutation, {
        ...UPDATE_MUTATION_OPTIONS,
        onSuccess: () => {
            queryClient.invalidateQueries('products');
            cancelAction();
        },
    });

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        setProduct((prevProduct) => ({
            ...prevProduct,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const calculatePrices = () => {
        const { incluye_iva, precio_caja, precio_pieza, precio_m2 } = product;

        const calculate = (price) => {
            if (!price) return { withIva: 0, withoutIva: 0 };

            const parsedPrice = parseFloat(price);

            if (incluye_iva) {
                return {
                    withIva: parsedPrice.toFixed(2),
                    withoutIva: (parsedPrice / (1 + IVA_RATE)).toFixed(2),
                };
            } else {
                return {
                    withIva: (parsedPrice * (1 + IVA_RATE)).toFixed(2),
                    withoutIva: parsedPrice.toFixed(2),
                };
            }
        };

        return {
            precio_caja: calculate(precio_caja),
            precio_pieza: calculate(precio_pieza),
            precio_m2: calculate(precio_m2),
        };
    };

    const submitProduct = async () => {
        try {
            const prices = calculatePrices();
            const payload = {
                ...product,
                precio_caja_con_iva: prices.precio_caja.withIva,
                precio_caja_sin_iva: prices.precio_caja.withoutIva,
                precio_pieza_con_iva: prices.precio_pieza.withIva,
                precio_pieza_sin_iva: prices.precio_pieza.withoutIva,
                precio_m2_con_iva: prices.precio_m2.withIva,
                precio_m2_sin_iva: prices.precio_m2.withoutIva,
                ultimo_usuario_id: currentUserId,
            };

            let savedProduct;
            if (product.id) {
                savedProduct = await updateMutation.mutateAsync(payload);
            } else {
                savedProduct = await createMutation.mutateAsync(payload);
            }

            if (savedProduct && savedProduct.id) {
                openImageModal(savedProduct.id);
            }
        } catch (error) {
            console.error('Error al guardar el producto:', error);
        }
    };

    return (
        <div>
            <div className="modal-header">
                <h2>{product.id ? 'Editar Producto' : 'Registrar Producto'}</h2>
                <button type="button" className="close-button" onClick={cancelAction}>
                    &times;
                </button>
            </div>
            <form>
                <div className="modal-body">
                    <FormField
                        name="codigo"
                        inputType="text"
                        iconClasses="fa-solid fa-barcode"
                        placeholder="Código del Producto"
                        value={product.codigo}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="nombre"
                        inputType="text"
                        iconClasses="fa-solid fa-i-cursor"
                        placeholder="Nombre del Producto"
                        value={product.nombre}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="color"
                        inputType="text"
                        iconClasses="fa-solid fa-palette"
                        placeholder="Color"
                        value={product.color}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="material"
                        inputType="text"
                        iconClasses="fa-solid fa-tools"
                        placeholder="Material"
                        value={product.material}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="formato"
                        inputType="text"
                        iconClasses="fa-solid fa-box"
                        placeholder="Formato"
                        value={product.formato}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="unidad_venta"
                        inputType="text"
                        iconClasses="fa-solid fa-ruler-combined"
                        placeholder="Unidad de Venta"
                        value={product.unidad_venta}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="piezas_caja"
                        inputType="number"
                        iconClasses="fa-solid fa-cubes"
                        placeholder="Piezas por Caja"
                        value={product.piezas_caja}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="peso_pieza_kg"
                        inputType="number"
                        iconClasses="fa-solid fa-weight-hanging"
                        placeholder="Peso por Pieza (kg)"
                        value={product.peso_pieza_kg}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="peso_caja_kg"
                        inputType="number"
                        iconClasses="fa-solid fa-box-open"
                        placeholder="Peso por Caja (kg)"
                        value={product.peso_caja_kg}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="m2_caja"
                        inputType="number"
                        iconClasses="fa-solid fa-ruler-horizontal"
                        placeholder="M2 por Caja"
                        value={product.m2_caja}
                        onChange={handleInputChange}
                    />
                    <div className="form-group">
                        <label htmlFor="incluye_iva">¿El precio incluye IVA?</label>
                        <input
                            type="checkbox"
                            id="incluye_iva"
                            name="incluye_iva"
                            checked={product.incluye_iva}
                            onChange={handleInputChange}
                        />
                    </div>
                    <FormField
                        name="precio_caja"
                        inputType="number"
                        iconClasses="fa-solid fa-dollar-sign"
                        placeholder="Precio por Caja"
                        value={product.precio_caja}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="precio_pieza"
                        inputType="number"
                        iconClasses="fa-solid fa-dollar-sign"
                        placeholder="Precio por Pieza"
                        value={product.precio_pieza}
                        onChange={handleInputChange}
                    />
                    <FormField
                        name="precio_m2"
                        inputType="number"
                        iconClasses="fa-solid fa-dollar-sign"
                        placeholder="Precio por M2"
                        value={product.precio_m2}
                        onChange={handleInputChange}
                    />
                    <div className="form-group">
                        <label htmlFor="proveedor_id">Proveedor</label>
                        <select
                            id="proveedor_id"
                            name="proveedor_id"
                            className="form-control"
                            value={product.proveedor_id || ''}
                            onChange={handleInputChange}
                        >
                            <option value="">Seleccione un proveedor</option>
                            {loadingProveedores ? (
                                <option>Cargando proveedores...</option>
                            ) : (
                                proveedores.map((proveedor) => (
                                    <option key={proveedor.id} value={proveedor.id}>
                                        {proveedor.nombre}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-danger" onClick={cancelAction}>
                        Cancelar
                    </button>
                    <button type="button" className="btn btn-primary" onClick={submitProduct}>
                        {`${product.id ? 'Actualizar' : 'Guardar'}`}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
