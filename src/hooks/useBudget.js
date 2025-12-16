'use client';

import { useState, useCallback, useMemo } from 'react';
import { mockBudget } from '@/utils/mockData';

export function useBudget() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Current month budget
    const budget = useMemo(() => mockBudget, []);

    // Calculate spending progress
    const spendingProgress = useMemo(() => {
        return (budget.actualExpenses / budget.spendingLimit) * 100;
    }, [budget]);

    // Calculate income progress
    const incomeProgress = useMemo(() => {
        return (budget.incomeActual / budget.incomeExpected) * 100;
    }, [budget]);

    // Available to spend
    const availableToSpend = useMemo(() => {
        return budget.spendingLimit - budget.actualExpenses;
    }, [budget]);

    // Update budget settings (mock)
    const updateBudget = useCallback(async (budgetData) => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Budget updated:', budgetData);
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
        budget,
        spendingProgress,
        incomeProgress,
        availableToSpend,
        updateBudget,
    };
}

export default useBudget;
