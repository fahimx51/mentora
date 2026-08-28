import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

export const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach JWT to requests
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const isAuthRoute = config.url?.includes('/auth/local');

        if (!isAuthRoute) {
            const token = Cookies.get('jwt');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } else {
            delete config.headers.Authorization;
        }
    }
    return config;
});

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear invalid session token
            Cookies.remove('jwt', { path: '/' });

            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const registerUserApi = async (data: { username: string; email: string; password: string }) => {
    const response = await api.post('/auth/local/register', data);
    if (response.data?.jwt) {
        Cookies.set('jwt', response.data.jwt, { expires: 7, path: '/', sameSite: 'lax' });
    }
    return response.data;
};

export const loginUserApi = async (data: { identifier: string; password: string }) => {
    const response = await api.post('/auth/local', data);
    if (response.data?.jwt) {
        Cookies.set('jwt', response.data.jwt, { expires: 7, path: '/', sameSite: 'lax' });
    }
    return response.data;
};

export const getMeApi = async () => {
    const response = await api.get('/users/me?populate[role][fields][0]=name&populate[role][fields][1]=type');
    return response.data;
};

export const getCoursesApi = async () => {
    const response = await api.get('/courses?populate=*');
    return response.data;
};

export const deleteCourseApi = async (id: string | number) => {
    const response = await api.delete(`/courses/${id}`);
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