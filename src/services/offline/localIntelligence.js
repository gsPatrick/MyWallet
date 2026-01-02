/**
 * Local Intelligence Service
 * ============================
 * Processes messages locally using cached data and brand detection.
 * Used for offline transaction parsing and balance queries.
 */

import { detectBrand } from '@/utils/brandDetection';

// Cache keys matching prefetch.js
const CACHE_KEYS = {
    BANKS: 'mywallet_banks_cache',
    CARDS: 'mywallet_cards_cache',
    SUBSCRIPTIONS: 'mywallet_subscriptions_cache',
    CATEGORIES: 'mywallet_categories_cache',
    DASHBOARD_SUMMARY: 'mywallet_dashboard_cache'
};

/**
 * Safe localStorage access
 */
const getCached = (key) => {
    if (typeof window === 'undefined') return null;
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
};

/**
 * Transaction regex patterns
 */
const TRANSACTION_PATTERNS = {
    // "Gastei 50 no Uber" / "gastei R$50,00 em uber"
    EXPENSE: /^(?:gastei|paguei|comprei|gastar)\s+(?:r\$?\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|r\$)?\s*(?:no|na|em|de|com)\s+(.+)$/i,
    // "Recebi 500 do freelance" / "ganhei R$1000 de salário"  
    INCOME: /^(?:recebi|ganhei|entrou|receber)\s+(?:r\$?\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|r\$)?\s*(?:do|da|de|por)?\s*(.+)?$/i
};

/**
 * Query patterns for balance/cards/subscriptions
 */
const QUERY_PATTERNS = {
    BALANCE: /^(?:saldo|meu saldo|qual (?:é |e )?(?:o )?(?:meu )?saldo|quanto (?:eu )?tenho)/i,
    CARDS: /^(?:fatura|faturas|cart[aã]o|cart[oõ]es|limite|meus cart[oõ]es)/i,
    SUBSCRIPTIONS: /^(?:assinatura|assinaturas|minhas assinaturas|mensalidades)/i
};

/**
 * Parse transaction from text
 * @param {string} text - User message
 * @returns {Object|null} - Parsed transaction with brand info or null
 */
export const parseTransaction = (text) => {
    if (!text) return null;

    const normalizedText = text.trim().toLowerCase();

    // Try expense pattern
    const expenseMatch = normalizedText.match(TRANSACTION_PATTERNS.EXPENSE);
    if (expenseMatch) {
        const amount = parseFloat(expenseMatch[1].replace(',', '.'));
        const description = expenseMatch[2].trim();
        const brand = detectBrand(description);

        return {
            type: 'EXPENSE',
            amount,
            description: brand?.name || description,
            originalDescription: description,
            brand: brand || null,
            icon: brand?.icon || null,
            category: brand?.category || 'OUTROS',
            color: brand?.color || '#6366f1'
        };
    }

    // Try income pattern
    const incomeMatch = normalizedText.match(TRANSACTION_PATTERNS.INCOME);
    if (incomeMatch) {
        const amount = parseFloat(incomeMatch[1].replace(',', '.'));
        const description = incomeMatch[2]?.trim() || 'Receita';
        const brand = detectBrand(description);

        return {
            type: 'INCOME',
            amount,
            description: brand?.name || description,
            originalDescription: description,
            brand: brand || null,
            icon: brand?.icon || null,
            category: brand?.category || 'RECEITA',
            color: brand?.color || '#22c55e'
        };
    }

    return null;
};

/**
 * Get balance from cached banks
 * @returns {Object} - Balance info with breakdown
 */
export const getCachedBalance = () => {
    const banks = getCached(CACHE_KEYS.BANKS) || [];

    if (banks.length === 0) {
        return {
            success: false,
            message: 'Nenhuma conta encontrada em cache.'
        };
    }

    const totalBalance = banks.reduce((sum, bank) => {
        const balance = parseFloat(bank.balance || bank.currentBalance || 0);
        return sum + balance;
    }, 0);

    return {
        success: true,
        type: 'BALANCE',
        totalBalance,
        banks: banks.map(b => ({
            name: b.name || b.bankName,
            balance: parseFloat(b.balance || b.currentBalance || 0)
        }))
    };
};

/**
 * Get cards info from cache
 * @returns {Object} - Cards info with limits
 */
export const getCachedCards = () => {
    const cards = getCached(CACHE_KEYS.CARDS) || [];

    if (cards.length === 0) {
        return {
            success: false,
            message: 'Nenhum cartão encontrado em cache.'
        };
    }

    const totalLimit = cards.reduce((sum, c) => sum + (parseFloat(c.limit) || 0), 0);
    const totalUsed = cards.reduce((sum, c) => sum + (parseFloat(c.used || c.usedLimit) || 0), 0);
    const totalAvailable = totalLimit - totalUsed;

    return {
        success: true,
        type: 'CARDS_LIST',
        totalLimit,
        totalUsed,
        totalAvailable,
        cards: cards.map(c => ({
            name: c.name || c.cardName,
            limit: parseFloat(c.limit) || 0,
            used: parseFloat(c.used || c.usedLimit) || 0,
            available: (parseFloat(c.limit) || 0) - (parseFloat(c.used || c.usedLimit) || 0)
        }))
    };
};

/**
 * Get subscriptions from cache
 * @returns {Object} - Subscriptions list
 */
export const getCachedSubscriptions = () => {
    const subscriptions = getCached(CACHE_KEYS.SUBSCRIPTIONS) || [];

    if (subscriptions.length === 0) {
        return {
            success: false,
            message: 'Nenhuma assinatura encontrada em cache.'
        };
    }

    const totalMonthly = subscriptions.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

    return {
        success: true,
        type: 'SUBSCRIPTIONS',
        totalMonthly,
        subscriptions: subscriptions.map(s => ({
            name: s.name || s.description,
            amount: parseFloat(s.amount) || 0,
            icon: s.icon || null
        }))
    };
};

/**
 * Process message locally - main entry point
 * @param {string} text - User message
 * @returns {Object} - Response with type (transaction, balance, etc)
 */
export const processLocalMessage = (text) => {
    if (!text?.trim()) return null;

    const normalizedText = text.trim().toLowerCase();

    // Check for balance query
    if (QUERY_PATTERNS.BALANCE.test(normalizedText)) {
        return getCachedBalance();
    }

    // Check for cards query
    if (QUERY_PATTERNS.CARDS.test(normalizedText)) {
        return getCachedCards();
    }

    // Check for subscriptions query
    if (QUERY_PATTERNS.SUBSCRIPTIONS.test(normalizedText)) {
        return getCachedSubscriptions();
    }

    // Try to parse as transaction
    const transaction = parseTransaction(text);
    if (transaction) {
        return {
            success: true,
            type: 'TRANSACTION',
            transaction
        };
    }

    // Unknown command
    return null;
};

export default {
    processLocalMessage,
    parseTransaction,
    getCachedBalance,
    getCachedCards,
    getCachedSubscriptions
};
