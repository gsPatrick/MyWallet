'use client';

import { useState, useCallback, useMemo } from 'react';
import { mockCards, mockSubscriptions } from '@/utils/mockData';

export function useCards() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // All cards
    const cards = useMemo(() => mockCards, []);

    // All subscriptions
    const subscriptions = useMemo(() => mockSubscriptions, []);

    // Cards summary
    const cardsSummary = useMemo(() => {
        const totalLimit = cards.reduce((sum, c) => sum + c.creditLimit, 0);
        const totalAvailable = cards.reduce((sum, c) => sum + c.availableLimit, 0);
        const totalUsed = totalLimit - totalAvailable;
        const usagePercent = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

        return {
            totalLimit,
            totalAvailable,
            totalUsed,
            usagePercent,
            cardsCount: cards.length,
        };
    }, [cards]);

    // Subscriptions summary
    const subscriptionsSummary = useMemo(() => {
        const monthlyTotal = subscriptions.reduce((sum, s) => sum + s.amount, 0);
        const yearlyTotal = monthlyTotal * 12;

        return {
            monthlyTotal,
            yearlyTotal,
            count: subscriptions.length,
        };
    }, [subscriptions]);

    // Get card by ID
    const getCard = useCallback((id) => {
        return cards.find(c => c.id === id);
    }, [cards]);

    // Create card (mock)
    const createCard = useCallback(async (cardData) => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Card created:', cardData);
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Create subscription (mock)
    const createSubscription = useCallback(async (subData) => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Subscription created:', subData);
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Cancel subscription (mock)
    const cancelSubscription = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Subscription cancelled:', id);
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
        cards,
        subscriptions,
        cardsSummary,
        subscriptionsSummary,
        getCard,
        createCard,
        createSubscription,
        cancelSubscription,
    };
}

export default useCards;
