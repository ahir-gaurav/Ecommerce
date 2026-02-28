import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL?.endsWith('/') ? API_URL : `${API_URL}/`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add admin token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('🌐 Admin API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        if (error.response?.status === 401) {
            localStorage.removeItem('admin_token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Admin Auth APIs
export const adminAuthAPI = {
    login: (data) => api.post('admin/auth/login', data),
    register: (data) => api.post('admin/auth/register', data)
};

// Admin Dashboard APIs
export const adminAPI = {
    getDashboard: () => api.get('admin/dashboard'),
    getSettings: () => api.get('admin/settings'),
    updateSettings: (data) => api.put('admin/settings', data)
};

// Product APIs
export const productAPI = {
    getAll: () => api.get('products'),
    getById: (id) => api.get(`products/${id}`),
    create: (data) => api.post('products', data),
    update: (id, data) => api.put(`products/${id}`, data),
    delete: (id) => api.delete(`products/${id}`),
    uploadImages: (id, formData) => api.post(`products/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteImage: (id, imageId) => api.delete(`products/${id}/images/${imageId}`),
    addVariant: (id, data) => api.post(`products/${id}/variants`, data),
    updateVariant: (id, variantId, data) => api.put(`products/${id}/variants/${variantId}`, data)
};

// Hero Section APIs
export const heroAPI = {
    getAll: () => api.get('hero/all'),
    create: (formData) => api.post('hero', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, formData) => api.put(`hero/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => api.delete(`hero/${id}`)
};

// Order APIs
export const orderAPI = {
    getAll: () => api.get('orders/admin/all'),
    updateStatus: (id, data) => api.put(`orders/${id}/status`, data)
};

// User APIs (admin reads users directly)
export const userAPI = {
    getAll: () => api.get('admin/users')
};

// Fragrance APIs
export const fragranceAPI = {
    getAll: () => api.get('fragrances'),
    getAllAdmin: () => api.get('fragrances/all'),
    create: (data) => api.post('fragrances', data),
    update: (id, data) => api.put(`fragrances/${id}`, data),
    delete: (id) => api.delete(`fragrances/${id}`)
};

export default api;
