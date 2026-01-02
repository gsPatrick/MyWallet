/**
 * Offline Data Prefetch Service
 * Downloads and caches ALL user data for complete offline experience
 * - Banks & Accounts
 * - Cards
 * - Categories
 * - Recent Transactions
 * - User Profile
 * - Budget Allocations
 */

import { openFinanceAPI, transactionsAPI, budgetsAPI, dashboardAPI } from '../api';
import bankAccountService from '../bankAccountService';
import { manualCardAPI } from '../api';

const CACHE_KEYS = {
    BANKS: 'mywallet_banks_cache',
    CARDS: 'mywallet_cards_cache',
    CATEGORIES: 'mywallet_categories_cache',
    TRANSACTIONS: 'mywallet_transactions_cache',
    BUDGETS: 'mywallet_budgets_cache',
    USER_PROFILE: 'mywallet_user_profile_cache',
    DASHBOARD_SUMMARY: 'mywallet_dashboard_cache',
    LAST_SYNC: 'mywallet_last_sync',
    PREFETCH_COMPLETE: 'mywallet_prefetch_complete'
};

const safeJsonParse = (data, fallback = null) => {
    try {
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        return fallback;
    }
};

/**
 * Check if prefetch has been done
 */
export const isPrefetchComplete = () => {
    return localStorage.getItem(CACHE_KEYS.PREFETCH_COMPLETE) === 'true';
};

/**
 * Get cached data by key
 */
export const getCachedData = (key) => {
    const cacheKey = CACHE_KEYS[key.toUpperCase()];
    if (!cacheKey) return null;
    return safeJsonParse(localStorage.getItem(cacheKey));
};

/**
 * Save data to cache
 */
export const saveToCache = (key, data) => {
    const cacheKey = CACHE_KEYS[key.toUpperCase()];
    if (!cacheKey || !data) return;

    try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (e) {
        console.error('[OfflinePrefetch] Error saving to cache:', e);
    }
};

/**
 * Main prefetch function - downloads everything for offline
 * Should be called on first access or when user explicitly syncs
 */
export const prefetchAllData = async (onProgress) => {
    const results = {
        success: true,
        errors: [],
        cached: []
    };

    const tasks = [
        { name: 'banks', fn: fetchAndCacheBanks },
        { name: 'cards', fn: fetchAndCacheCards },
        { name: 'categories', fn: fetchAndCacheCategories },
        { name: 'transactions', fn: fetchAndCacheTransactions },
        { name: 'budgets', fn: fetchAndCacheBudgets },
        { name: 'dashboard', fn: fetchAndCacheDashboard }
    ];

    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        try {
            onProgress?.({
                current: i + 1,
                total: tasks.length,
                name: task.name,
                percent: Math.round(((i + 1) / tasks.length) * 100)
            });

            await task.fn();
            results.cached.push(task.name);
        } catch (error) {
            console.error(`[OfflinePrefetch] Error fetching ${task.name}:`, error);
            results.errors.push({ name: task.name, error: error.message });
        }
    }

    // Mark prefetch as complete
    localStorage.setItem(CACHE_KEYS.PREFETCH_COMPLETE, 'true');
    results.success = results.errors.length === 0;

    console.log('[OfflinePrefetch] Complete:', results);
    return results;
};

/**
 * Individual fetch and cache functions
 */
async function fetchAndCacheBanks() {
    // Get bank accounts from manual service
    const bankAccounts = await bankAccountService.getAll();
    const banks = bankAccounts?.data || bankAccounts || [];

    // Also try to get Open Finance accounts
    try {
        const ofAccounts = await openFinanceAPI.listAccounts();
        const ofData = ofAccounts?.data || ofAccounts || [];
        if (ofData.length > 0) {
            banks.push(...ofData.map(acc => ({
                ...acc,
                source: 'openfinance'
            })));
        }
    } catch (e) {
        // Open Finance might not be configured
    }

    saveToCache('BANKS', banks);
    return banks;
}

async function fetchAndCacheCards() {
    const cards = [];

    // Get manual cards
    try {
        const manualCards = await manualCardAPI.list();
        const manualData = manualCards?.data || manualCards || [];
        cards.push(...manualData.map(c => ({ ...c, source: 'manual' })));
    } catch (e) { }

    // Get Open Finance cards
    try {
        const ofCards = await openFinanceAPI.listCards();
        const ofData = ofCards?.data || ofCards || [];
        cards.push(...ofData.map(c => ({ ...c, source: 'openfinance' })));
    } catch (e) { }

    saveToCache('CARDS', cards);
    return cards;
}

async function fetchAndCacheCategories() {
    const { categoriesAPI } = await import('../api');
    const response = await categoriesAPI.list();
    const categories = response?.data || response || [];
    saveToCache('CATEGORIES', categories);
    return categories;
}

async function fetchAndCacheTransactions() {
    // Get last 30 days of transactions for offline reference
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const response = await transactionsAPI.list({
        startDate: thirtyDaysAgo.toISOString().split('T')[0]
    });

    const transactions = response?.data?.transactions || response?.transactions || [];
    saveToCache('TRANSACTIONS', transactions);
    return transactions;
}

async function fetchAndCacheBudgets() {
    const response = await budgetsAPI.getCurrentAllocations();
    const budgets = response?.data?.allocations || response?.allocations || [];
    saveToCache('BUDGETS', budgets);
    return budgets;
}

async function fetchAndCacheDashboard() {
    const response = await dashboardAPI.getSummary();
    const summary = response?.data || response || {};
    saveToCache('DASHBOARD_SUMMARY', summary);
    return summary;
}

/**
 * Update specific cache (call this after user actions)
 */
export const updateCache = async (type) => {
    switch (type.toLowerCase()) {
        case 'banks':
            return fetchAndCacheBanks();
        case 'cards':
            return fetchAndCacheCards();
        case 'transactions':
            return fetchAndCacheTransactions();
        case 'budgets':
            return fetchAndCacheBudgets();
        case 'dashboard':
            return fetchAndCacheDashboard();
        default:
            return null;
    }
};

/**
 * Get last sync time
 */
export const getLastSyncTime = () => {
    return localStorage.getItem(CACHE_KEYS.LAST_SYNC);
};

/**
 * Clear all cached data
 */
export const clearAllCache = () => {
    Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
};

export default {
    prefetchAllData,
    isPrefetchComplete,
    getCachedData,
    saveToCache,
    updateCache,
    getLastSyncTime,
    clearAllCache
};
