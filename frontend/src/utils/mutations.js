import { toast } from "react-toastify";
import {
    createIncome,
    deleteIncome,
    updateIncome
} from "../data-access/incomesDataAccess";
import {
    createOutcome,
    deleteOutcome,
    updateOutcome
} from "../data-access/outcomesDataAccess";
import {
    createProduct,
    deleteProduct,
    updateProduct
} from "../data-access/productsDataAccess";
import {
    createUser,
    deleteUser,
    updateUser
} from "../data-access/usersDataAccess";
import {
    createProveedor,
    updateProveedor,
    deleteProveedor
} from "../data-access/proveedoresDataAccess";

export const CREATE_MUTATION_OPTIONS = {
    onMutate: async () => {
        toast("Guardando...", {
            type: "info"
        });
    },
    onSuccess: () => {
        toast("Guardado!", {
            type: "success"
        });
    },
    onError: (error) => {
        console.error(error);
        toast("Error", {
            type: "error"
        });
    }
};

export const UPDATE_MUTATION_OPTIONS = {
    onMutate: async () => {
        toast("Actualizando... 💾", {
            type: "info"
        });
    },
    onSuccess: () => {
        toast("Actualizado! ✅", {
            type: "success"
        });
    },
    onError: (error) => {
        toast("Error ❌", {
            type: "error"
        });
    }
};

export const DELETE_MUTATION_OPTIONS = {
    onMutate: async () => {
        toast("Eliminando... 🗑️", {
            type: "info"
        });
    },
    onSuccess: () => {
        toast("Eliminado! ✅", {
            type: "success"
        });
    },
    onError: (error) => {
        console.error(error);
        toast("Error ❌", {
            type: "error"
        });
    }
};

// Outcome Mutations
export const createOutcomeMutation = (outcome) => {
    createOutcome(outcome);
};

export const updateOutcomeMutation = (outcome) => {
    updateOutcome(outcome);
};

export const deleteOutcomeMutation = (id) => {
    deleteOutcome(id);
};

// User Mutations
export const createUserMutation = async (user) => {
    return await createUser(user);
};

export const updateUserMutation = async (user) => {
    return await updateUser(user);
};

export const deleteUserMutation = async (id) => {
    return await deleteUser(id);
};

// Income Mutations
export const createIncomeMutation = (income) => {
    createIncome(income);
};

export const updateIncomeMutation = (income) => {
    updateIncome(income);
};

export const deleteIncomeMutation = (id) => {
    deleteIncome(id);
};

// Product Mutations
export const createProductMutation = async (product) => {
    return await createProduct(product);
};

export const updateProductMutation = async (product) => {
    return await updateProduct(product);
};

export const deleteProductMutation = async (id) => {
    return await deleteProduct(id);
};

// Proveedor Mutations
export const createProveedorMutation = async (proveedor) => {
    return await createProveedor(proveedor);
};

export const updateProveedorMutation = async (proveedor) => {
    return await updateProveedor(proveedor);
};

export const deleteProveedorMutation = async (id) => {
    return await deleteProveedor(id);
};
