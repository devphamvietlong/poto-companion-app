import axios from 'axios';
import { useUserStore } from '../store/user';
import router from '../router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/';

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true, // This is important for sending HttpOnly cookies
});

// Flag to prevent token refresh during logout
let isLoggingOut = false;

export const setLoggingOut = (value: boolean) => {
    isLoggingOut = value;
};

// Request interceptor: Attach accessToken to headers
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle token refresh
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        // If the error is 401 Unauthorized and it's not a refresh request already and we're not logging out
        // AND it's not a login or register request (where 401 is expected for wrong credentials)
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isLoggingOut &&
            !originalRequest.url.includes('/auth/login') &&
            !originalRequest.url.includes('/auth/register')
        ) {
            originalRequest._retry = true; // Mark request as retried

            try {
                const refreshRes = await axiosInstance.post('/auth/refresh');

                if (refreshRes.data.accessToken) {
                    localStorage.setItem('accessToken', refreshRes.data.accessToken);
                    // Retry the original request with the new token
                    originalRequest.headers.Authorization = `Bearer ${refreshRes.data.accessToken}`;
                    return axiosInstance(originalRequest);
                } else {
                    // If refresh token is also invalid, log out
                    const userStore = useUserStore();
                    userStore.clearUser();
                    localStorage.removeItem('accessToken');
                    // localStorage.removeItem('refreshToken'); // Removed as backend handles HttpOnly cookie
                    router.push('/login'); // Redirect to login
                }
            } catch (refreshError) {
                // Refresh failed, log out
                const userStore = useUserStore();
                userStore.clearUser();
                localStorage.removeItem('accessToken');
                // localStorage.removeItem('refreshToken'); // Removed as backend handles HttpOnly cookie
                router.push('/login'); // Redirect to login
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;

