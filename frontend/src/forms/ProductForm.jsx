import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import FormField from '../components/FormField';
import {
    createProductMutation,
    updateProductMutation,
    CREATE_MUTATION_OPTIONS,
    UPDATE_MUTATION_OPTIONS
} from '../utils/mutations';
import { readAllProveedores } from '../data-access/proveedoresDataAccess';

const emptyProduct = {
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
    proveedor_id: null,
};

const ProductForm = ({ cancelAction, productUpdate, currentUserId, openImageModal }) => {
    const [product, setProduct] = useState(productUpdate ?? emptyProduct);

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
        onSuccess: (...args) => {
            UPDATE_MUTATION_OPTIONS.onSuccess?.(...args);
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

    useEffect(() => {
        if (!productUpdate) {
            setProduct(emptyProduct);
            return;
        }

        const mapPriceField = (field) => {
            const baseValue = productUpdate[field];
            if (baseValue !== undefined && baseValue !== null && baseValue !== '') return baseValue;

            const withIvaKey = `${field}_con_iva`;
            const withoutIvaKey = `${field}_sin_iva`;

            if (productUpdate.incluye_iva && productUpdate[withIvaKey] !== undefined) {
                return productUpdate[withIvaKey];
            }

            if (!productUpdate.incluye_iva && productUpdate[withoutIvaKey] !== undefined) {
                return productUpdate[withoutIvaKey];
            }

            return productUpdate[withIvaKey] ?? productUpdate[withoutIvaKey] ?? '';
        };

        setProduct({
            ...emptyProduct,
            ...productUpdate,
            precio_caja: mapPriceField('precio_caja'),
            precio_pieza: mapPriceField('precio_pieza'),
            precio_m2: mapPriceField('precio_m2'),
        });
    }, [productUpdate]);

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
        <div className="product-modal">
            <div className="modal-header product-modal__header">
                <div className="product-modal__title">
                    <span className="product-modal__eyebrow">Gestión de productos</span>
                    <h2>{product.id ? 'Editar Producto' : 'Registrar Producto'}</h2>
                </div>
                <button type="button" className="close-button" onClick={cancelAction}>
                    &times;
                </button>
            </div>
            <form className="product-form">
                <div className="modal-body product-form__body">
                    <section className="product-form__section">
                        <div className="product-form__section-header">
                            <div>
                                <p className="product-form__section-eyebrow">Información general</p>
                                <h3>Datos generales</h3>
                                <p className="product-form__section-helper">
                                    Define la identificación y presentación básica del producto.
                                </p>
                            </div>
                            <i className="fa-solid fa-layer-group" aria-hidden="true"></i>
                        </div>
                        <div className="product-form__section-grid">
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
                        </div>
                    </section>

                    <section className="product-form__section">
                        <div className="product-form__section-header">
                            <div>
                                <p className="product-form__section-eyebrow">Logística</p>
                                <h3>Pesos y contenido</h3>
                                <p className="product-form__section-helper">
                                    Ajusta la cantidad y peso para cálculo de envíos y almacenaje.
                                </p>
                            </div>
                            <i className="fa-solid fa-dolly" aria-hidden="true"></i>
                        </div>
                        <div className="product-form__section-grid">
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
                        </div>
                    </section>

                    <section className="product-form__section">
                        <div className="product-form__section-header">
                            <div>
                                <p className="product-form__section-eyebrow">Comercial</p>
                                <h3>Precios</h3>
                                <p className="product-form__section-helper">
                                    Ingresa los precios base que se usarán para los cálculos de IVA.
                                </p>
                            </div>
                            <i className="fa-solid fa-sack-dollar" aria-hidden="true"></i>
                        </div>
                        <div className="product-form__section-grid product-form__section-grid--prices">
                            <div className="product-form__field product-form__field--full">
                                <label className="product-form__field-label">IVA aplicado en precios</label>
                                <div className="product-form__iva-toggle" role="group" aria-label="Selección de IVA">
                                    <button
                                        type="button"
                                        className={`chip ${product.incluye_iva ? 'chip--active' : ''}`}
                                        onClick={() => setProduct((prev) => ({ ...prev, incluye_iva: true }))}
                                    >
                                        <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
                                        Precios con IVA
                                    </button>
                                    <button
                                        type="button"
                                        className={`chip ${!product.incluye_iva ? 'chip--active' : ''}`}
                                        onClick={() => setProduct((prev) => ({ ...prev, incluye_iva: false }))}
                                    >
                                        <i className="fa-solid fa-receipt" aria-hidden="true"></i>
                                        Precios sin IVA
                                    </button>
                                </div>
                                <p className="product-form__field-helper">
                                    Define cómo interpretar los montos capturados para cálculos con impuesto.
                                </p>
                            </div>
                            <div className="product-form__field">
                                <label className="product-form__field-label" htmlFor="precio_caja">
                                    Precio por Caja
                                </label>
                                <div className="input-group mb-0">
                                    <span className="input-group-text">
                                        <i className="fa-solid fa-dollar-sign" aria-hidden="true"></i>
                                    </span>
                                    <input
                                        id="precio_caja"
                                        name="precio_caja"
                                        type="number"
                                        className="form-control"
                                        placeholder="Ingresa el precio por caja"
                                        onChange={handleInputChange}
                                        value={product.precio_caja}
                                    />
                                </div>
                            </div>
                            <div className="product-form__field">
                                <label className="product-form__field-label" htmlFor="precio_pieza">
                                    Precio por Pieza
                                </label>
                                <div className="input-group mb-0">
                                    <span className="input-group-text">
                                        <i className="fa-solid fa-dollar-sign" aria-hidden="true"></i>
                                    </span>
                                    <input
                                        id="precio_pieza"
                                        name="precio_pieza"
                                        type="number"
                                        className="form-control"
                                        placeholder="Ingresa el precio por pieza"
                                        onChange={handleInputChange}
                                        value={product.precio_pieza}
                                    />
                                </div>
                            </div>
                            <div className="product-form__field">
                                <label className="product-form__field-label" htmlFor="precio_m2">
                                    Precio por M2
                                </label>
                                <div className="input-group mb-0">
                                    <span className="input-group-text">
                                        <i className="fa-solid fa-dollar-sign" aria-hidden="true"></i>
                                    </span>
                                    <input
                                        id="precio_m2"
                                        name="precio_m2"
                                        type="number"
                                        className="form-control"
                                        placeholder="Ingresa el precio por m2"
                                        onChange={handleInputChange}
                                        value={product.precio_m2}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="product-form__section">
                        <div className="product-form__section-header">
                            <div>
                                <p className="product-form__section-eyebrow">Relaciones</p>
                                <h3>Proveedor</h3>
                                <p className="product-form__section-helper">
                                    Asocia el producto con el proveedor correspondiente.
                                </p>
                            </div>
                            <i className="fa-solid fa-handshake" aria-hidden="true"></i>
                        </div>
                        <div className="product-form__section-grid">
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
                    </section>
                </div>
                <div className="modal-footer product-modal__footer">
                    <button type="button" className="btn btn-secondary" onClick={cancelAction}>
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
