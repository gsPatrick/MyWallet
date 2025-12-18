/**
 * Categories Service
 * API calls for category management
 */

import api from './api';

const categoriesService = {
    /**
     * List all categories (user + default)
     */
    list: async (type = null) => {
        const params = type ? { type } : {};
        const response = await api.get('/categories', { params });
        return response;
    },

    /**
     * Create a new category
     */
    create: async (data) => {
        const response = await api.post('/categories', data);
        return response;
    },

    /**
     * Update a category
     */
    update: async (id, data) => {
        const response = await api.put(`/categories/${id}`, data);
        return response;
    },

    /**
     * Delete a category
     */
    delete: async (id) => {
        const response = await api.delete(`/categories/${id}`);
        return response;
    },
};

export default categoriesService;
