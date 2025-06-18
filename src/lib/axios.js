import axios from "axios";

// Use proxy in development, direct URL in production
const getBaseURL = () => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    return "/api"; // Use proxy in development
  }
  // In production, use the actual backend URL
  return "https://talko.up.railway.app/api";
};

export const axiosInstance = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
    (config) => {
        console.log('Making request to:', config.url);
        console.log('Base URL:', config.baseURL);
        console.log('Environment:', import.meta.env.DEV ? 'Development' : 'Production');
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
        console.log('Response received:', response.status);
        return response;
    },
    (error) => {
        console.error('Response error:', error.response?.data || error.message);
        if (error.code === 'ECONNABORTED') {
            console.error('Request timed out');
        }
        return Promise.reject(error);
    }
);