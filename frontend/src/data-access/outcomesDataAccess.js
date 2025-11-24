import { API_HOST, processResponse } from './dataAccessUtils';

const API_SERVICE = 'outcomes';

const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const createOutcome = async (outcome) => {
    const url = `${API_HOST}/${API_SERVICE}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        body: JSON.stringify(outcome),
    });
    await processResponse(response);
};

export const readAllOutcomes = async () => {
    const url = `${API_HOST}/${API_SERVICE}`;
    const response = await fetch(url, {
        headers: {
            ...getAuthHeaders(),
        },
    });
    return await processResponse(response);
};

export const updateOutcome = async (outcome) => {
    const { id } = outcome;
    const url = `${API_HOST}/${API_SERVICE}/${id}`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        body: JSON.stringify(outcome),
    });
    await processResponse(response);
};

export const deleteOutcome = async (id) => {
    const url = `${API_HOST}/${API_SERVICE}/${id}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            ...getAuthHeaders(),
        },
    });
    await processResponse(response);
};
