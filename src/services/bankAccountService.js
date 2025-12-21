/**
 * Bank Account Service
 * ========================================
 * Frontend service for bank account API calls
 * ========================================
 */

import api from './api';

const bankAccountService = {
    /**
     * Create a new bank account
     * @param {object} data - Bank account data
     * @param {string} data.bankName - Bank name
     * @param {string} data.nickname - Account nickname
     * @param {string} data.color - Bank color
     * @param {string} data.icon - Bank icon URL
     * @param {string} data.type - Account type
     * @param {number} data.initialBalance - Initial balance
     */
    async create(data) {
        const response = await api.post('/bank-accounts', data);
        return response.data;
    },

    /**
     * List all bank accounts for active profile
     * @param {object} options - Query options
     */
    async list(options = {}) {
        const response = await api.get('/bank-accounts', { params: options });
        return response.data;
    },

    /**
     * Get a specific bank account
     * @param {string} id - Account ID
     */
    async get(id) {
        const response = await api.get(`/bank-accounts/${id}`);
        return response.data;
    },

    /**
     * Update a bank account
     * @param {string} id - Account ID
     * @param {object} data - Data to update
     */
    async update(id, data) {
        const response = await api.put(`/bank-accounts/${id}`, data);
        return response.data;
    },

    /**
     * Delete a bank account
     * @param {string} id - Account ID
     */
    async delete(id) {
        const response = await api.delete(`/bank-accounts/${id}`);
        return response.data;
    },

    /**
     * Get total balance across all accounts
     */
    async getTotalBalance() {
        const response = await api.get('/bank-accounts/balance/total');
        return response.data;
    },

    /**
     * Get balance breakdown by account
     */
    async getBalanceBreakdown() {
        const response = await api.get('/bank-accounts/balance/breakdown');
        return response.data;
    },

    /**
     * Get the default account for the active profile
     * Used for pre-filling transaction forms (Low friction UX)
     */
    async getDefault() {
        const response = await api.get('/bank-accounts/default');
        return response.data;
    },

    /**
     * Set an account as the default
     * @param {string} id - Account ID to set as default
     */
    async setDefault(id) {
        const response = await api.put(`/bank-accounts/${id}/set-default`);
        return response.data;
    },

    /**
     * Ensure profile has at least one account
     * Creates "Minha Carteira" if no accounts exist
     * @param {number} initialBalance - Optional initial balance
     */
    async ensureWallet(initialBalance = 0) {
        const response = await api.post('/bank-accounts/ensure-wallet', { initialBalance });
        return response.data;
    },

    /**
     * Create internal transfer between accounts/profiles
     * @param {object} data - Transfer data
     * @param {string} data.fromBankAccountId - Source account
     * @param {string} data.toBankAccountId - Destination account
     * @param {number} data.amount - Amount to transfer
     * @param {string} data.date - Transfer date
     * @param {string} data.description - Optional description
     */
    async createInternalTransfer(data) {
        const response = await api.post('/transactions/internal-transfer', data);
        return response.data;
    }
};

export default bankAccountService;

