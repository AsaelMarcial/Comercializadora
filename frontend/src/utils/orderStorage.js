const STORAGE_KEY = 'ventas.order';

const isBrowserEnvironment = () => typeof window !== 'undefined';

export const loadOrder = () => {
    if (!isBrowserEnvironment()) return [];
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('No se pudo leer el carrito almacenado', error);
        return [];
    }
};

export const saveOrder = (order) => {
    if (!isBrowserEnvironment()) return;
    try {
        if (!order?.length) {
            window.localStorage.removeItem(STORAGE_KEY);
            return;
        }

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch (error) {
        console.error('No se pudo guardar el carrito', error);
    }
};

export const clearOrderStorage = () => {
    if (!isBrowserEnvironment()) return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('No se pudo limpiar el carrito almacenado', error);
    }
};

export const ORDER_STORAGE_KEY = STORAGE_KEY;
