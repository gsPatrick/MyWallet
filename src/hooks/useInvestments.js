'use client';

import { useState, useCallback, useEffect } from 'react';
import { investmentsAPI, financialProductsAPI } from '@/services/api';

export function useInvestments() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        summary: null,
        positions: [],
        allocation: { byType: [], bySector: [] },
        financialProducts: [],
    });

    // Fetch all investment data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Parallel fetch for B3 portfolio and Manual Financial Products
            const [portfolioRes, productsRes] = await Promise.all([
                investmentsAPI.getPortfolio(),
                financialProductsAPI.list()
            ]);

            const portfolioData = portfolioRes.data || portfolioRes;
            const productsData = productsRes.data || productsRes;

            // Normalize B3 positions
            const positions = portfolioData.positions || [];

            // Normalize Financial Products
            const financialProducts = Array.isArray(productsData) ? productsData : [];

            setData({
                summary: portfolioData.summary,
                positions: positions,
                allocation: portfolioData.allocation || { byType: [], bySector: [] },
                financialProducts: financialProducts,
                // Pass through other useful metrics if needed by InvestorSummary
                dividends: portfolioData.dividends,
                concentration: portfolioData.concentration,
                rankings: portfolioData.rankings,
                indicators: portfolioData.indicators
            });

        } catch (err) {
            console.error('Error fetching investments:', err);
            setError(err.message || 'Failed to load investments');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Calculate total patrimony
    const totalPatrimony = (data.summary?.totalCurrentBalance || 0) +
        data.financialProducts.reduce((sum, p) => sum + (Number(p.currentValue) || 0), 0);

    // Get position by ticker
    const getPosition = useCallback((ticker) => {
        return data.positions.find(p => p.ticker === ticker);
    }, [data.positions]);

    // Register buy operation
    const registerBuy = useCallback(async (ticker, quantity, price, date) => {
        setIsLoading(true);
        try {
            await investmentsAPI.registerOperation({
                ticker,
                type: 'BUY',
                quantity: Number(quantity),
                price: Number(price),
                date
            });
            await fetchData(); // Refresh data
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [fetchData]);

    // Register sell operation
    const registerSell = useCallback(async (ticker, quantity, price, date) => {
        setIsLoading(true);
        try {
            await investmentsAPI.registerOperation({
                ticker,
                type: 'SELL',
                quantity: Number(quantity),
                price: Number(price),
                date
            });
            await fetchData(); // Refresh data
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [fetchData]);

    // Add financial product
    const addFinancialProduct = useCallback(async (productData) => {
        setIsLoading(true);
        try {
            await financialProductsAPI.create(productData);
            await fetchData(); // Refresh data
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [fetchData]);

    return {
        isLoading,
        error,
        summary: data.summary,
        positions: data.positions,
        allocation: data.allocation,
        financialProducts: data.financialProducts,
        totalPatrimony,
        dividends: data.dividends,
        concentration: data.concentration,
        rankings: data.rankings,
        indicators: data.indicators,
        refresh: fetchData, // Expose refresh method
        getPosition,
        registerBuy,
        registerSell,
        addFinancialProduct,
    };
}

export default useInvestments;
