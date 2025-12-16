'use client';

import { useState, useCallback, useMemo } from 'react';
import { mockGoals } from '@/utils/mockData';

export function useGoals() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // All goals
    const goals = useMemo(() => mockGoals, []);

    // Active goals
    const activeGoals = useMemo(() => {
        return goals.filter(g => g.status === 'ACTIVE');
    }, [goals]);

    // Completed goals
    const completedGoals = useMemo(() => {
        return goals.filter(g => g.status === 'COMPLETED');
    }, [goals]);

    // Total summary
    const summary = useMemo(() => {
        const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
        const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
        const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

        return {
            totalTarget,
            totalCurrent,
            totalRemaining: totalTarget - totalCurrent,
            overallProgress,
            activeCount: activeGoals.length,
            completedCount: completedGoals.length,
        };
    }, [goals, activeGoals, completedGoals]);

    // Get goal by ID
    const getGoal = useCallback((id) => {
        return goals.find(g => g.id === id);
    }, [goals]);

    // Create goal (mock)
    const createGoal = useCallback(async (goalData) => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Goal created:', goalData);
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Update goal (mock)
    const updateGoal = useCallback(async (id, goalData) => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Goal updated:', { id, ...goalData });
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Add contribution to goal (mock)
    const addContribution = useCallback(async (goalId, amount) => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Contribution added:', { goalId, amount });
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Delete goal (mock)
    const deleteGoal = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Goal deleted:', id);
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
        goals,
        activeGoals,
        completedGoals,
        summary,
        getGoal,
        createGoal,
        updateGoal,
        addContribution,
        deleteGoal,
    };
}

export default useGoals;
