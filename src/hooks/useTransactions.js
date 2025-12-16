'use client';

import { useState, useCallback, useMemo } from 'react';
import { mockTransactions } from '@/utils/mockData';

export function useTransactions() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        type: 'ALL',
        category: 'ALL',
        source: 'ALL',
        startDate: null,
        endDate: null,
    });

    // Get all transactions
    const allTransactions = useMemo(() => mockTransactions, []);

    // Filter transactions based on current filters
    const transactions = useMemo(() => {
        return allTransactions.filter(tx => {
            if (filters.type !== 'ALL' && tx.type !== filters.type) return false;
            if (filters.category !== 'ALL' && tx.category !== filters.category) return false;
            if (filters.source !== 'ALL' && tx.source !== filters.source) return false;
            if (filters.startDate && new Date(tx.date) < new Date(filters.startDate)) return false;
            if (filters.endDate && new Date(tx.date) > new Date(filters.endDate)) return false;
            return true;
        });
    }, [allTransactions, filters]);

    // Calculate totals
    const totals = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            if (tx.type === 'INCOME') {
                acc.income += tx.amount;
            } else {
                acc.expense += tx.amount;
            }
            return acc;
        }, { income: 0, expense: 0, balance: 0 });
    }, [transactions]);

    totals.balance = totals.income - totals.expense;

    // Get unique categories
    const categories = useMemo(() => {
        return [...new Set(allTransactions.map(tx => tx.category))];
    }, [allTransactions]);

    // Update filters
    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    // Clear filters
    const clearFilters = useCallback(() => {
        setFilters({
            type: 'ALL',
            category: 'ALL',
            source: 'ALL',
            startDate: null,
            endDate: null,
        });
    }, []);

    // Create transaction (mock)
    const createTransaction = useCallback(async (transactionData) => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Transaction created:', transactionData);
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Update transaction (mock)
    const updateTransaction = useCallback(async (id, transactionData) => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Transaction updated:', { id, ...transactionData });
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Delete transaction (mock)
    const deleteTransaction = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Transaction deleted:', id);
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        transactions,
        allTransactions,
        totals,
        categories,
        filters,
        updateFilters,
        clearFilters,
        createTransaction,
        updateTransaction,
        deleteTransaction,
    };
}

export default useTransactions;
