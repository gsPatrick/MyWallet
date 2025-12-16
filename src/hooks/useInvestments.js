'use client';

import { useState, useCallback, useMemo } from 'react';
import { mockPortfolio, mockFinancialProducts } from '@/utils/mockData';

export function useInvestments() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Combine B3 assets and financial products
    const portfolio = useMemo(() => mockPortfolio, []);
    const financialProducts = useMemo(() => mockFinancialProducts, []);

    const summary = useMemo(() => portfolio.summary, [portfolio]);
    const positions = useMemo(() => portfolio.positions, [portfolio]);
    const allocation = useMemo(() => portfolio.allocation, [portfolio]);

    // Calculate total patrimony including financial products
    const totalPatrimony = useMemo(() => {
        const b3Total = positions.reduce((sum, p) => sum + p.currentValue, 0);
        const productsTotal = financialProducts.reduce((sum, p) => sum + p.currentValue, 0);
        return b3Total + productsTotal;
    }, [positions, financialProducts]);

    // Get position by ticker
    const getPosition = useCallback((ticker) => {
        return positions.find(p => p.ticker === ticker);
    }, [positions]);

    // Register buy operation (mock)
    const registerBuy = useCallback(async (ticker, quantity, price, date) => {
        setIsLoading(true);
        setError(null);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Buy registered:', { ticker, quantity, price, date });
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Register sell operation (mock)
    const registerSell = useCallback(async (ticker, quantity, price, date) => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Sell registered:', { ticker, quantity, price, date });
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Add financial product (mock)
    const addFinancialProduct = useCallback(async (productData) => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Financial product added:', productData);
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
        summary,
        positions,
        allocation,
        financialProducts,
        totalPatrimony,
        getPosition,
        registerBuy,
        registerSell,
        addFinancialProduct,
    };
}

export default useInvestments;
