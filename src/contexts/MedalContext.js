'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AchievementAnimation } from '@/components/gamification';
import gamificationService from '@/services/gamificationService';
import { useAuth } from './AuthContext';

const MedalContext = createContext({});

export function MedalProvider({ children }) {
    const { user, isAuthenticated } = useAuth();
    const [medalQueue, setMedalQueue] = useState([]);
    const [currentMedal, setCurrentMedal] = useState(null);
    const [showAnimation, setShowAnimation] = useState(false);
    const [hasMoreMedals, setHasMoreMedals] = useState(false);
    const [medalKey, setMedalKey] = useState(0); // Force remount of animation component
    const isProcessingRef = useRef(false);

    // Check for new medals when user logs in (only after onboarding complete)
    useEffect(() => {
        if (isAuthenticated && user && user.onboardingComplete) {
            // Small delay to ensure auth is fully settled
            const timer = setTimeout(() => {
                checkForNewMedals();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, user]);

    // Process queue - show next medal when current is closed
    useEffect(() => {
        if (!showAnimation && !currentMedal && medalQueue.length > 0 && !isProcessingRef.current) {
            isProcessingRef.current = true;

            // Add delay before showing next medal to allow animation component to fully unmount
            const timer = setTimeout(() => {
                const [nextMedal, ...rest] = medalQueue;
                setCurrentMedal(nextMedal);
                setMedalQueue(rest);
                setHasMoreMedals(rest.length > 0);
                setMedalKey(prev => prev + 1); // Force new component instance
                setShowAnimation(true);
                isProcessingRef.current = false;
            }, 300);

            return () => {
                clearTimeout(timer);
                isProcessingRef.current = false;
            };
        }
    }, [showAnimation, currentMedal, medalQueue]);

    const checkForNewMedals = async () => {
        try {
            // First register activity
            await gamificationService.registerActivity();

            // Then check for new medals
            const result = await gamificationService.checkMedals();
            if (result?.success && result?.data?.newMedals?.length > 0) {
                setMedalQueue(result.data.newMedals);
            }
        } catch (error) {
            console.warn('Could not check for medals:', error);
        }
    };

    const handleCloseAnimation = async () => {
        // First mark as notified
        if (currentMedal?.id) {
            try {
                await gamificationService.markMedalNotified(currentMedal.id);
            } catch (e) {
                console.warn('Could not mark medal as notified:', e);
            }
        }

        // Then close animation and clear current medal
        setShowAnimation(false);
        setCurrentMedal(null);
    };

    // Allow manual trigger for checking medals
    const triggerMedalCheck = useCallback(async () => {
        await checkForNewMedals();
    }, []);

    // Add medals to queue manually
    const addMedalsToQueue = useCallback((medals) => {
        if (medals && medals.length > 0) {
            setMedalQueue(prev => [...prev, ...medals]);
        }
    }, []);

    return (
        <MedalContext.Provider value={{
            triggerMedalCheck,
            addMedalsToQueue,
            hasPendingMedals: medalQueue.length > 0 || currentMedal !== null
        }}>
            {children}

            {/* Global Achievement Animation - key forces remount for each medal */}
            {currentMedal && (
                <AchievementAnimation
                    key={`medal-${medalKey}`}
                    medal={currentMedal}
                    isVisible={showAnimation}
                    onClose={handleCloseAnimation}
                    autoClose={false}
                    hasMoreMedals={hasMoreMedals}
                />
            )}
        </MedalContext.Provider>
    );
}

export const useMedals = () => useContext(MedalContext);
