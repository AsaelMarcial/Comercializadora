export const API_HOST = 'http://147.93.47.106:8000'

// dataAccessUtils.js
export const processResponse = async (response) => {
    console.log("Response status:", response.status); // Imprime el código de estado

    if (!response.ok) {
        const errorMessage = await response.text(); // Obtén el cuerpo de la respuesta
        console.error("Response error:", errorMessage); // Imprime el error
        throw new Error(`Network response was not ok: ${response.status} - ${errorMessage}`);
    }

    try {
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("JSON parse error:", error); // Imprime el error de análisis JSON
        throw new Error(`Failed to parse JSON: ${error.message}`);
    }
};
