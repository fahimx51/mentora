import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

// Axios Instance
export const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach Token Automatically to Authorized Requests
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = Cookies.get('jwt');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================
export const registerUserApi = async (data: { username: string; email: string; password: string }) => {
    const response = await api.post('/auth/local/register', data);
    return response.data; // returns { jwt, user }
};

export const loginUserApi = async (data: { identifier: string; password: string }) => {
    const response = await api.post('/auth/local', data);
    return response.data; // returns { jwt, user }
};

export const getMeApi = async () => {
    const response = await api.get('/users/me');
    return response.data; // returns user profile
};

// ==========================================
// 2. COURSES ENDPOINTS (For Later)
// ==========================================
export const getCoursesApi = async () => {
    const response = await api.get('/courses?populate=*');
    return response.data;
};

export const getCourseBySlugApi = async (slug: string) => {
    const response = await api.get(`/courses?filters[slug][$eq]=${slug}&populate=*`);
    return response.data;
};

// ==========================================
// 3. BLOGS ENDPOINTS (For Later)
// ==========================================
export const getBlogsApi = async () => {
    const response = await api.get('/blogs?populate=*');
    return response.data;
};