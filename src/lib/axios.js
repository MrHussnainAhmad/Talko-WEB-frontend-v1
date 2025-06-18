import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "/api", // Using proxy
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 seconds should be enough
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
    (config) => {
        console.log('Making request to:', config.url);
        console.log('Full URL will be:', window.location.origin + config.baseURL + config.url);
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
    (response) => {
        console.log('Response received:', response.status, response.data);
        return response;
    },
    (error) => {
        console.error('Response error:', error.response?.data || error.message);
        if (error.code === 'ECONNABORTED') {
            console.error('Request timed out - check proxy configuration');
        }
        return Promise.reject(error);
    }
);