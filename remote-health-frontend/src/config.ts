export const API_URL = 'http://localhost:8000/api/v1';

export const API_CONFIG = {
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: false,
    timeout: 10000,
}; 