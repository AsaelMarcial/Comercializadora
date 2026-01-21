export const API_HOST = '/api'

export const UPLOADS_BASE_URL = `${API_HOST}/uploads`;

// dataAccessUtils.js
export const processResponse = async (response) => {
    console.log("Response status:", response.status);

    if (!response.ok) {
        const errorMessage = await response.text();
        console.error("Response error:", errorMessage);
        throw new Error(`Network response was not ok: ${response.status} - ${errorMessage}`);
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        const text = await response.text();
        return text || null;
    }

    try {
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("JSON parse error:", error);
        throw new Error(`Failed to parse JSON: ${error.message}`);
    }
};
