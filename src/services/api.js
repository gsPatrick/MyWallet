import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://geral-mywallet-api.r954jc.easypanel.host/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================
// OFFLINE CACHE HELPERS
// ============================================
const CACHE_PREFIX = 'cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const getCacheKey = (url) => `${CACHE_PREFIX}${url}`;

const saveToCache = (url, data) => {
    try {
        const cacheEntry = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(getCacheKey(url), JSON.stringify(cacheEntry));
    } catch (e) {
        console.warn('Cache write failed:', e);
    }
};

const getFromCache = (url) => {
    try {
        const cached = localStorage.getItem(getCacheKey(url));
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);

        // Check if cache is still valid
        if (Date.now() - timestamp > CACHE_TTL) {
            localStorage.removeItem(getCacheKey(url));
            return null;
        }

        return data;
    } catch (e) {
        return null;
    }
};

// Check if we're truly online (with heartbeat validation)
let isNetworkOnline = true;
if (typeof window !== 'undefined') {
    window.addEventListener('mywalletNetworkStatus', (e) => {
        isNetworkOnline = e.detail.isOnline;
    });
}

// Request interceptor to add auth token AND profile context
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            // Add auth token
            const token = localStorage.getItem('investpro_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // ✅ PROFILE ISOLATION: Add x-profile-id header
            const profileId = localStorage.getItem('investpro_profile_id');
            if (profileId) {
                config.headers['x-profile-id'] = profileId;
            }

            // OFFLINE CACHING: For GET requests when offline, return cached data
            if (config.method === 'get' && !isNetworkOnline) {
                const cachedData = getFromCache(config.url);
                if (cachedData) {
                    console.log('[Offline] Serving cached data for:', config.url);
                    // Cancel the actual request and resolve with cached data
                    const source = axios.CancelToken.source();
                    config.cancelToken = source.token;
                    source.cancel({ __cached: true, data: cachedData });
                }
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling AND cache write
api.interceptors.response.use(
    (response) => {
        // Cache successful GET responses
        if (response.config.method === 'get' && response.status === 200) {
            saveToCache(response.config.url, response.data);
        }
        return response.data;
    },
    (error) => {
        // Handle our custom cache cancellation
        if (axios.isCancel(error) && error.message?.__cached) {
            return Promise.resolve(error.message.data);
        }

        const url = error.config?.url || '';
        const isAuthEndpoint = url.includes('/auth/');
        const isGamificationEndpoint = url.includes('/gamification/');

        // Only redirect to login for 401 if NOT on auth/gamification endpoints
        if (error.response?.status === 401 && !isAuthEndpoint && !isGamificationEndpoint) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('investpro_token');
                localStorage.removeItem('investpro_user');
                window.location.href = '/login';
            }
        }

        // OFFLINE FALLBACK: If network error on GET, try cache
        if (!error.response && error.config?.method === 'get') {
            const cachedData = getFromCache(error.config.url);
            if (cachedData) {
                console.log('[Offline Fallback] Serving stale cache for:', error.config.url);
                return Promise.resolve(cachedData);
            }
        }

        return Promise.reject(error.response?.data || error.message);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (name, email, password, salary, salaryDay) => api.post('/auth/register', { name, email, password, salary, salaryDay }),
    me: () => api.get('/auth/me'),
    refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
    updateProfile: (data) => api.put('/auth/me', data),
    changePassword: (currentPassword, newPassword) =>
        api.put('/auth/change-password', { currentPassword, newPassword }),
};

// Dashboard API
// Dashboard API
export const dashboardAPI = {
    getSummary: () => api.get('/dashboard/summary'),
    getAlerts: () => api.get('/dashboard/alerts'),
    getActivities: () => api.get('/dashboard/activities'),
    getRecentTransactions: () => api.get('/dashboard/recent-transactions'),
};

// Investments API
// Investments API
export const investmentsAPI = {
    list: (params) => api.get('/investments', { params }),
    getPortfolio: (brokerId) => api.get('/investments/portfolio', { params: brokerId ? { brokerId } : {} }),
    getPosition: (ticker) => api.get(`/investments/position/${ticker}`),
    getHistory: (ticker) => api.get(`/investments/history/${ticker}`),
    registerOperation: (data) => api.post('/investments', data),
    getAssets: (search = '', page = 1, type = '') => api.get('/investments/assets', {
        params: { search, page, limit: 50, type }
    }),
    getDividends: () => api.get('/investments/dividends'),
    getEvolution: (months = 12) => api.get('/investments/evolution', { params: { months } }),
    // Health Diagnostics
    getHealthDiagnostics: () => api.get('/investments/health/diagnostics'),
    testHealthService: (service) => api.get(`/investments/health/test/${service}`),
};

// Investment Dashboard API (Analytics)
export const investmentDashboardAPI = {
    getSummary: () => api.get('/investment-dashboard/summary'),
    getPerformance: () => api.get('/investment-dashboard/performance'),
    getAllocation: () => api.get('/investment-dashboard/allocation'),
    getEvolution: (months = 12) => api.get('/investment-dashboard/evolution', { params: { months } }),
    getDividends: (year, month) => api.get('/investment-dashboard/dividends', { params: { year, month } }),
    getAlerts: () => api.get('/investment-dashboard/alerts'),
};

// Brokers API (Corretoras)
export const brokersAPI = {
    list: () => api.get('/brokers'),
    get: (id) => api.get(`/brokers/${id}`),
    create: (data) => api.post('/brokers', data),
    createFromDictionary: (code) => api.post('/brokers/from-dictionary', { code }),
    update: (id, data) => api.put(`/brokers/${id}`, data),
    delete: (id) => api.delete(`/brokers/${id}`),
    getAvailable: () => api.get('/brokers/available'),
};

// Financial Products API
export const financialProductsAPI = {
    list: () => api.get('/financial-products'),
    get: (id) => api.get(`/financial-products/${id}`),
    create: (data) => api.post('/financial-products', data),
    update: (id, data) => api.put(`/financial-products/${id}`, data),
    delete: (id) => api.delete(`/financial-products/${id}`),
};

// Transactions API
export const transactionsAPI = {
    list: (params) => api.get('/transactions', { params }),
    get: (id) => api.get(`/transactions/${id}`),
    create: (data) => api.post('/transactions/manual', data),
    update: (id, data) => api.put(`/transactions/${id}`, data),
    delete: (id) => api.delete(`/transactions/${id}`),
    updateMetadata: (id, data) => api.put(`/transactions/${id}/metadata`, data),
    getCategories: () => api.get('/transactions/categories'),
    internalTransfer: (data) => api.post('/transactions/internal-transfer', data),
};

// Budgets API
export const budgetsAPI = {
    getCurrent: () => api.get('/budgets/current'),
    get: (year, month) => api.get(`/budgets/${year}/${month}`),
    update: (year, month, data) => api.put(`/budgets/${year}/${month}`, data),
    getRecommendations: () => api.get('/budgets/recommendations'),
    // Budget Allocations
    getCurrentAllocations: () => api.get('/budgets/allocations/current'),
    getAllocations: (month, year) => api.get('/budgets/allocations', { params: { month, year } }),
    create: (data) => api.post('/budgets/allocations', data),
};

// Cards API
export const cardsAPI = {
    list: () => api.get('/manual-cards'),
    get: (id) => api.get(`/manual-cards/${id}`),
    create: (data) => api.post('/manual-cards', data),
    update: (id, data) => api.put(`/manual-cards/${id}`, data),
    deactivate: (id) => api.delete(`/manual-cards/${id}`),
    getSummary: () => api.get('/manual-cards/summary'),
};

// Subscriptions API
// Subscriptions API
export const subscriptionsAPI = {
    list: () => api.get('/subscriptions'),
    get: (id) => api.get(`/subscriptions/${id}`),
    create: (data) => api.post('/subscriptions', data),
    update: (id, data) => api.put(`/subscriptions/${id}`, data),
    cancel: (id, deleteTransaction = false) => api.delete(`/subscriptions/${id}?deleteTransaction=${deleteTransaction}`),
    getSummary: () => api.get('/subscriptions/summary'),
    getUpcoming: () => api.get('/subscriptions/upcoming'),
    markPaid: (id, date) => api.post(`/subscriptions/${id}/pay`, { date }),
};

// Notifications API
export const notificationsAPI = {
    list: (page = 1) => api.get('/notifications', { params: { page } }),
    getPending: () => api.get('/notifications/pending'),
    markRead: (id) => api.put(`/notifications/${id}/read`),
    markAllRead: () => api.put('/notifications/read-all'),
};

// Open Finance API
export const openFinanceAPI = {
    listConsents: () => api.get('/open-finance/consents'),
    requestConsent: (institutionId, permissions) =>
        api.post('/open-finance/consents', { institutionId, permissions }), // Fixed: plural consents
    revokeConsent: (consentId) => api.delete(`/open-finance/consents/${consentId}`), // Fixed: plural consents
    syncAccounts: () => api.post('/open-finance/import/accounts'), // Fixed: matches /import/accounts
    syncTransactions: () => api.post('/open-finance/import/transactions'), // Fixed: matches /import/transactions
    syncCards: () => api.post('/open-finance/import/cards'), // Added cards sync
    listAccounts: () => api.get('/open-finance/accounts'),
    listCards: () => api.get('/open-finance/cards'),
};

// Import API (Files)
export const importAPI = {
    previewOFX: (content) => api.post('/import/ofx/preview', { content }),
    confirmImport: (data) => api.post('/import/ofx/confirm', { data })
};

// Goals API
export const goalsAPI = {
    list: () => api.get('/goals'),
    create: (data) => api.post('/goals', data),
    update: (id, data) => api.put(`/goals/${id}`, data),
    delete: (id) => api.delete(`/goals/${id}`),
    transaction: (id, data) => api.post(`/goals/${id}/transaction`, data),
    getHistory: (id) => api.get(`/goals/${id}/history`),
};

// Messages API
export const messagesAPI = {
    list: () => api.get('/messages'),
    create: (data) => api.post('/messages', data),
    markAsRead: (id) => api.put(`/messages/${id}/read`),
    getUnreadCount: () => api.get('/messages/unread-count'),
};

// Reports API
export const reportsAPI = {
    getPortfolio: (brokerId) => api.get('/reports/portfolio', { params: brokerId ? { brokerId } : {} }),
    getEvolution: () => api.get('/reports/evolution'),
    getDividends: () => api.get('/reports/dividends'),
    // Statement (Extrato Financeiro)
    getStatement: (year, month) => api.get('/reports/statement', { params: { year, month } }),
    getStatementYears: () => api.get('/reports/statement/years'),
};

// WhatsApp Bot API
export const whatsappAPI = {
    connect: () => api.post('/whatsapp/connect'),
    getStatus: () => api.get('/whatsapp/status'),
    disconnect: () => api.post('/whatsapp/disconnect'),
};

// Profiles API (Multi-Context)
export const profilesAPI = {
    list: () => api.get('/profiles'),
    get: (id) => api.get(`/profiles/${id}`),
    getDefault: () => api.get('/profiles/default'),
    check: () => api.get('/profiles/check'),
    setup: (data) => api.post('/profiles/setup', data),
    create: (data) => api.post('/profiles', data),
    update: (id, data) => api.put(`/profiles/${id}`, data),
    switchProfile: (id) => api.put(`/profiles/${id}/switch`),
};

// DAS API (Central do DAS - Business Only)
export const dasAPI = {
    generateGuides: (year) => api.post('/das/generate', { year }),
    listGuides: (year) => api.get(`/das/guides/${year}`),
    payGuide: (guideId, data) => api.post(`/das/pay/${guideId}`, data),
    getSummary: () => api.get('/das/summary'),
    ensureGuides: () => api.post('/das/ensure'),
};

// Bank Accounts API
export const bankAccountsAPI = {
    list: () => api.get('/bank-accounts'),
    get: (id) => api.get(`/bank-accounts/${id}`),
    create: (data) => api.post('/bank-accounts', data),
    update: (id, data) => api.put(`/bank-accounts/${id}`, data),
    delete: (id) => api.delete(`/bank-accounts/${id}`),
};

// Settings API
export const settingsAPI = {
    // Profile
    getProfile: () => api.get('/settings/profile'),
    updateProfile: (data) => api.put('/settings/profile', data),
    changePassword: (currentPassword, newPassword) =>
        api.put('/settings/password', { currentPassword, newPassword }),

    // Devices
    listDevices: () => api.get('/settings/devices'),
    revokeDevice: (deviceId) => api.delete(`/settings/devices/${deviceId}`),

    // Notifications
    getNotificationPreferences: () => api.get('/settings/notifications'),
    updateNotificationPreferences: (preferences) => api.put('/settings/notifications', preferences),

    // Privacy
    getPrivacySettings: () => api.get('/settings/privacy'),
    updatePrivacySettings: (settings) => api.put('/settings/privacy', settings),

    // Account
    deleteAccount: (password, reason) => api.delete('/settings/account', { data: { password, reason } }),

    // Plans
    getPlanInfo: () => api.get('/settings/plan'),

    // Payment Methods
    listPaymentMethods: () => api.get('/settings/payment-methods'),
    addPaymentMethod: (data) => api.post('/settings/payment-methods', data),
    removePaymentMethod: (id) => api.delete(`/settings/payment-methods/${id}`),
    setDefaultPaymentMethod: (id) => api.put(`/settings/payment-methods/${id}/default`),

    // LGPD Export
    exportData: () => api.get('/settings/export-data'),
};

export default api;
