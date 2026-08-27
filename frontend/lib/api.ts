import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

export const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = Cookies.get('jwt');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = Cookies.get('refreshToken');

            if (!refreshToken) {
                Cookies.remove('jwt', { path: '/' });
                Cookies.remove('refreshToken', { path: '/' });
                if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve) => {
                    refreshQueue.push((newToken: string) => {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        resolve(api(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                // Correct Strapi v5 plugin refresh route
                const { data } = await axios.post(`${API_URL}/api/users-permissions/refresh`, {
                    refreshToken,
                });

                const newJwt = data.jwt || data.token;
                const newRefreshToken = data.refreshToken;

                Cookies.set('jwt', newJwt, { expires: 7, path: '/', sameSite: 'lax' });
                if (newRefreshToken) {
                    Cookies.set('refreshToken', newRefreshToken, { expires: 30, path: '/', sameSite: 'lax' });
                }

                refreshQueue.forEach((cb) => cb(newJwt));
                refreshQueue = [];

                originalRequest.headers.Authorization = `Bearer ${newJwt}`;
                return api(originalRequest);
            } catch (refreshError) {
                refreshQueue = [];
                Cookies.remove('jwt', { path: '/' });
                Cookies.remove('refreshToken', { path: '/' });
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export const registerUserApi = async (data: { username: string; email: string; password: string }) => {
    const response = await api.post('/auth/local/register', data);
    return response.data;
};

export const loginUserApi = async (data: { identifier: string; password: string }) => {
    const response = await api.post('/auth/local', data);
    return response.data;
};

// lib/api.ts

export const getMeApi = async () => {
    // Populate role specifically
    const response = await api.get('/users/me?populate[role][fields][0]=name&populate[role][fields][1]=type');
    return response.data;
};

export const getCoursesApi = async () => {
    const response = await api.get('/courses?populate=*');
    return response.data;
};

export const getCourseBySlugApi = async (slug: string) => {
    const response = await api.get(`/courses?filters[slug][$eq]=${slug}&populate=*`);
    return response.data;
};

export const getBlogsApi = async () => {
    const response = await api.get('/blogs?populate=*');
    return response.data;
};