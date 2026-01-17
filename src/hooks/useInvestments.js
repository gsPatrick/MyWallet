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

    // CACHE BUSTER: Force fresh fetch on mount
    const fetchFreshData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('[useInvestments] Fetching FRESH data...');

            // Add timestamp to bypass api.js cache
            const timestamp = Date.now();

            // Parallel fetch
            const [portfolioRes, productsRes] = await Promise.all([
                investmentsAPI.getPortfolio({ _t: timestamp }),
                financialProductsAPI.list()
            ]);

            const portfolioData = portfolioRes.data || portfolioRes;
            const productsData = productsRes.data || productsRes;

            console.log('[useInvestments] Portfolio Data:', portfolioData);

            // Handle different response structures
            // Option 1: Standard { summary, positions: [...] }
            // Option 2: Array only [ ... ] (if API changed to return just positions)

            let positions = [];
            let summary = null;
            let allocation = { byType: [], bySector: [] };

            // Handle various API response structures
            // Case 1: Direct Array [ ... ]
            if (Array.isArray(portfolioData)) {
                positions = portfolioData;
            }
            // Case 2: Nested { data: { assets: [...] } } (User's JSON case)
            else if (portfolioData?.data?.assets && Array.isArray(portfolioData.data.assets)) {
                positions = portfolioData.data.assets;
                // If summary is missing, calculate it
                if (!summary) {
                    const total = positions.reduce((sum, p) => sum + (p.totalValue || (p.quantity * p.price) || 0), 0);
                    summary = {
                        totalInvested: total,
                        totalCurrentBalance: total,
                        totalProfit: 0,
                        totalProfitPercent: 0
                    };
                }
            }
            // Case 3: Nested { data: [...] }
            else if (Array.isArray(portfolioData?.data)) {
                positions = portfolioData.data;
            }
            // Case 4: Standard { positions: [...], summary: ... }
            else if (portfolioData && typeof portfolioData === 'object') {
                positions = portfolioData.positions || [];
                summary = portfolioData.summary;
                allocation = portfolioData.allocation || allocation;
            }

            // Normalize Financial Products
            const financialProducts = Array.isArray(productsData) ? productsData : [];

            setData({
                summary,
                positions,
                allocation,
                financialProducts,
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
        // Clear old localStorage cache for investments just in case
        try {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('cache_/investments/portfolio');
            }
        } catch (e) {
            console.warn('Failed to clear cache', e);
        }

        fetchFreshData();
    }, [fetchFreshData]);

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
            await fetchFreshData();
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [fetchFreshData]);

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
            await fetchFreshData();
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [fetchFreshData]);

    // Add financial product
    const addFinancialProduct = useCallback(async (productData) => {
        setIsLoading(true);
        try {
            await financialProductsAPI.create(productData);
            await fetchFreshData();
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [fetchFreshData]);

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
        refresh: fetchFreshData,
        getPosition,
        registerBuy,
        registerSell,
        addFinancialProduct,
    };
}

export default useInvestments;
