'use client';

/**
 * AppShell - Client Component Wrapper
 * ========================================
 * Wraps protected pages with ProfileGate
 * Shows ProfileWizard AFTER Tour is complete (when user has no profiles)
 * OFFLINE FLOW:
 * 1. Detect offline → Show OfflineTransition (2.5s)
 * 2. After transition → Show ChatInterface (offline mode)
 * 3. Back online → Show normal children
 * ========================================
 */

import { useState, useEffect, useRef } from 'react';
import { useProfiles } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import ProfileWizard from '@/components/Onboarding/ProfileWizard';
import OfflineTransition from '@/components/ui/OfflineTransition';
import ChatInterface from '@/components/chat/ChatInterface';

export default function AppShell({ children }) {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { profiles, loading: profilesLoading, hasProfiles, refreshProfiles } = useProfiles();
    const { phase } = useOnboarding();
    const { isOnline, isMounted } = useNetworkStatus();

    // Track previous online state to detect transitions
    const prevOnlineRef = useRef(true);

    // State for offline transition animation
    const [isTransitioningToOffline, setIsTransitioningToOffline] = useState(false);

    // Track if we've been offline (to show ChatInterface after transition)
    const [hasTransitionedOffline, setHasTransitionedOffline] = useState(false);

    // Detect offline transition
    useEffect(() => {
        if (!isMounted) return;

        // Going OFFLINE: Trigger transition animation
        if (prevOnlineRef.current && !isOnline) {
            console.log('[AppShell] Going offline - starting transition');
            setIsTransitioningToOffline(true);

            // After 2.5s, end transition and show ChatInterface
            const timer = setTimeout(() => {
                console.log('[AppShell] Transition complete - showing ChatInterface');
                setIsTransitioningToOffline(false);
                setHasTransitionedOffline(true);
            }, 2500);

            prevOnlineRef.current = isOnline;
            return () => clearTimeout(timer);
        }

        // Going ONLINE: Reset offline state
        if (!prevOnlineRef.current && isOnline) {
            console.log('[AppShell] Back online - returning to normal');
            setIsTransitioningToOffline(false);
            setHasTransitionedOffline(false);
        }

        prevOnlineRef.current = isOnline;
    }, [isOnline, isMounted]);

    // Handle wizard completion
    const handleWizardComplete = async () => {
        await refreshProfiles();
        window.location.reload();
    };

    // Handle closing ChatInterface while offline
    const handleOfflineChatClose = () => {
        // If still offline, can't really close - just log
        if (!isOnline) {
            console.log('[AppShell] Cannot close offline chat while offline');
            return;
        }
        setHasTransitionedOffline(false);
    };

    // ========================================
    // RENDER PRIORITY (strict order)
    // ========================================

    // 1. TRANSITIONING TO OFFLINE: Full-screen animation
    if (isTransitioningToOffline) {
        return <OfflineTransition isVisible={true} />;
    }

    // 2. OFFLINE MODE (after transition): Show ChatInterface
    if (!isOnline && hasTransitionedOffline) {
        return (
            <ChatInterface
                isOfflineMode={true}
                onClose={handleOfflineChatClose}
            />
        );
    }

    // 3. OFFLINE but first load (no transition yet): Trigger transition
    if (!isOnline && !hasTransitionedOffline && isMounted) {
        // This handles the case where app loads while already offline
        // Trigger the transition on next tick
        if (!isTransitioningToOffline) {
            setTimeout(() => {
                setIsTransitioningToOffline(true);
                setTimeout(() => {
                    setIsTransitioningToOffline(false);
                    setHasTransitionedOffline(true);
                }, 2500);
            }, 0);
        }
        // Show loading state briefly
        return <OfflineTransition isVisible={true} />;
    }

    // ========================================
    // ONLINE MODE: Normal app rendering
    // ========================================

    // Still loading
    if (authLoading || profilesLoading) {
        return <>{children}</>;
    }

    // Not authenticated - show children normally
    if (!isAuthenticated) {
        return <>{children}</>;
    }

    // User is authenticated but has no profiles
    if (!hasProfiles || profiles.length === 0) {
        if (phase === 'profile_config') {
            return (
                <>
                    {children}
                    <ProfileWizard onComplete={handleWizardComplete} />
                </>
            );
        }
        return <>{children}</>;
    }

    // User has profiles - show normal app
    return <>{children}</>;
}
