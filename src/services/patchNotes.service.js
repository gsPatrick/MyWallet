import api from './api';

export const patchNotesService = {
    // Public
    listPatchNotes: async (page = 1, limit = 10) => {
        const response = await api.get(`/patch-notes?page=${page}&limit=${limit}`);
        return response; // Interceptor already returns response.data (the body)
    },

    getLatestPatchNote: async () => {
        const response = await api.get('/patch-notes/latest');
        return response;
    },

    getPatchNoteById: async (id) => {
        const response = await api.get(`/patch-notes/${id}`);
        return response;
    },

    // Admin
    createPatchNote: async (data) => {
        const response = await api.post('/patch-notes', data);
        return response;
    },

    updatePatchNote: async (id, data) => {
        const response = await api.put(`/patch-notes/${id}`, data);
        return response;
    },

    deletePatchNote: async (id) => {
        await api.delete(`/patch-notes/${id}`);
    }
};
