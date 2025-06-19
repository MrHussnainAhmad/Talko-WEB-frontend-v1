import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "https://talko-private-chat.up.railway.app/api",
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

// Custom method for DELETE requests with body
axiosInstance.deleteWithBody = async (url, data, config = {}) => {
  return axiosInstance({
    method: 'delete',
    url,
    data,
    ...config
  });
};

axiosInstance.interceptors.request.use(
    (config) => {
        console.log('Making request to:', config.url);
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('Response error:', error.response?.data || error.message);
        if (error.code === 'ECONNABORTED') {
            console.error('Request timed out');
            return Promise.reject(new Error('Request timed out. Please try again.'));
        }
        
        // Handle 401 Unauthorized (e.g., token expired)
        if (error.response?.status === 401) {
            console.log('Unauthorized access - redirecting to login');
            // Optionally: Clear user session and redirect
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;