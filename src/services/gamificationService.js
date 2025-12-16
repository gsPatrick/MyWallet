/**
 * Gamification API Service
 * Frontend service for gamification endpoints
 */

import api from './api';

const gamificationService = {
    /**
     * Get user profile with stats
     */
    getProfile: async () => {
        const response = await api.get('/gamification/profile');
        return response;
    },

    /**
     * Update user profile (avatar, name)
     */
    updateProfile: async (data) => {
        const response = await api.put('/gamification/profile', data);
        return response;
    },

    /**
     * Change user password
     */
    changePassword: async (currentPassword, newPassword) => {
        const response = await api.put('/gamification/password', {
            currentPassword,
            newPassword
        });
        return response;
    },

    /**
     * Get user stats
     */
    getStats: async () => {
        const response = await api.get('/gamification/stats');
        return response;
    },

    /**
     * Get all medals with user progress
     */
    getMedals: async () => {
        const response = await api.get('/gamification/medals');
        return response;
    },

    /**
     * Check and unlock new medals
     */
    checkMedals: async () => {
        const response = await api.post('/gamification/medals/check');
        return response;
    },

    /**
     * Get unnotified new medals
     */
    getNewMedals: async () => {
        const response = await api.get('/gamification/medals/new');
        return response;
    },

    /**
     * Mark medal as notified
     */
    markMedalNotified: async (medalId) => {
        const response = await api.post(`/gamification/medals/${medalId}/notify`);
        return response;
    },

    /**
     * Register user activity (for streak)
     */
    registerActivity: async () => {
        const response = await api.post('/gamification/activity');
        return response;
    },

    /**
     * Update featured medals (max 5)
     */
    updateFeaturedMedals: async (medalIds) => {
        const response = await api.put('/gamification/profile/featured-medals', { medalIds });
        return response;
    }
};

export default gamificationService;
