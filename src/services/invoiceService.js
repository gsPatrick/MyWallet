/**
 * Invoice Service
 * ========================================
 * Frontend API service for card invoice management
 */

import api from './api';

/**
 * List invoices for a specific card
 */
export const listInvoices = async (cardId, options = {}) => {
    const { limit = 12, page = 1 } = options;
    const response = await api.get(`/invoices/card/${cardId}`, {
        params: { limit, page }
    });
    return response.data;
};

/**
 * Get invoice details
 */
export const getInvoice = async (invoiceId) => {
    const response = await api.get(`/invoices/${invoiceId}`);
    return response.data;
};

/**
 * Get current invoice for a card
 */
export const getCurrentInvoice = async (cardId) => {
    const response = await api.get(`/invoices/card/${cardId}/current`);
    return response.data;
};

/**
 * Generate invoice for a specific month
 */
export const generateInvoice = async (cardId, month, year) => {
    const response = await api.post('/invoices/generate', {
        cardId,
        month,
        year
    });
    return response.data;
};

/**
 * Pay invoice
 * @param {string} invoiceId - Invoice ID
 * @param {object} data - Payment data
 * @param {number} data.amount - Payment amount (required for PARTIAL)
 * @param {string} data.paymentType - FULL | PARTIAL | MINIMUM | ADVANCE
 * @param {string} data.paymentMethod - PIX | BOLETO | DEBITO | TRANSFERENCIA | DINHEIRO | OUTRO
 * @param {string} data.bankAccountId - Optional bank account used for payment
 * @param {string} data.notes - Optional notes
 */
export const payInvoice = async (invoiceId, data) => {
    const response = await api.post(`/invoices/${invoiceId}/pay`, data);
    return response.data;
};

/**
 * Advance invoice payment (pay current invoice before closing)
 */
export const advanceInvoice = async (cardId, amount, bankAccountId = null) => {
    const response = await api.post(`/invoices/card/${cardId}/advance`, {
        amount,
        bankAccountId
    });
    return response.data;
};

/**
 * Payment types
 */
export const PAYMENT_TYPES = {
    FULL: 'FULL',
    PARTIAL: 'PARTIAL',
    MINIMUM: 'MINIMUM',
    ADVANCE: 'ADVANCE'
};

/**
 * Payment methods
 */
export const PAYMENT_METHODS = {
    PIX: 'PIX',
    BOLETO: 'BOLETO',
    DEBITO: 'DEBITO',
    TRANSFERENCIA: 'TRANSFERENCIA',
    DINHEIRO: 'DINHEIRO',
    OUTRO: 'OUTRO'
};

/**
 * Invoice statuses
 */
export const INVOICE_STATUS = {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
    PAID: 'PAID',
    PARTIAL: 'PARTIAL',
    OVERDUE: 'OVERDUE'
};

/**
 * Get status display info
 */
export const getStatusInfo = (status) => {
    const statusMap = {
        OPEN: { label: 'Aberta', color: '#3B82F6', emoji: '⏳' },
        CLOSED: { label: 'Fechada', color: '#6B7280', emoji: '📋' },
        PAID: { label: 'Paga', color: '#10B981', emoji: '✅' },
        PARTIAL: { label: 'Parcial', color: '#F59E0B', emoji: '⚠️' },
        OVERDUE: { label: 'Vencida', color: '#EF4444', emoji: '❌' }
    };
    return statusMap[status] || { label: status, color: '#6B7280', emoji: '❓' };
};

/**
 * Format invoice period
 */
export const formatInvoicePeriod = (month, year) => {
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[month - 1]} ${year}`;
};

export default {
    listInvoices,
    getInvoice,
    getCurrentInvoice,
    generateInvoice,
    payInvoice,
    advanceInvoice,
    PAYMENT_TYPES,
    PAYMENT_METHODS,
    INVOICE_STATUS,
    getStatusInfo,
    formatInvoicePeriod
};
