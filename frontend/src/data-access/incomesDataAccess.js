import { API_HOST, processResponse } from './dataAccessUtils';

const API_SERVICE = 'incomes';

const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const createIncome = async (income) => {
    const url = `${API_HOST}/${API_SERVICE}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        body: JSON.stringify(income),
    });
    await processResponse(response);
};

export const readAllIncomes = async () => {
    const url = `${API_HOST}/${API_SERVICE}`;
    const response = await fetch(url, {
        headers: {
            ...getAuthHeaders(),
        },
    });
    return await processResponse(response);
};

export const updateIncome = async (income) => {
    const { id } = income;
    const url = `${API_HOST}/${API_SERVICE}/${id}`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        body: JSON.stringify(income),
    });
    await processResponse(response);
};

export const deleteIncome = async (id) => {
    const url = `${API_HOST}/${API_SERVICE}/${id}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            ...getAuthHeaders(),
        },
    });
    await processResponse(response);
};
