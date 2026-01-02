'use client';

/**
 * AppShell - Client Component Wrapper
 * ========================================
 * Wraps protected pages with ProfileGate
 * Shows ProfileWizard AFTER Tour is complete (when user has no profiles)
 * Shows OfflineTransition when network goes offline
 * ========================================
 */

import { useState, useEffect, useRef } from 'react';
import { useProfiles } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import ProfileWizard from '@/components/Onboarding/ProfileWizard';
import OfflineTransition from '@/components/ui/OfflineTransition';

export default function AppShell({ children }) {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { profiles, loading: profilesLoading, hasProfiles, refreshProfiles } = useProfiles();
    const { phase } = useOnboarding();
    const { isOnline, isMounted } = useNetworkStatus();

    // Track previous online state to detect transitions
    const prevOnlineRef = useRef(true);
    const [showOfflineTransition, setShowOfflineTransition] = useState(false);

    // Detect offline transition
    useEffect(() => {
        if (!isMounted) return;

        // Only trigger if transitioning from online to offline
        if (prevOnlineRef.current && !isOnline) {
            setShowOfflineTransition(true);
        }

        prevOnlineRef.current = isOnline;
    }, [isOnline, isMounted]);

    const handleOfflineTransitionComplete = () => {
        setShowOfflineTransition(false);
    };

    // Handle wizard completion
    const handleWizardComplete = async () => {
        await refreshProfiles();
        window.location.reload();
    };

    // Still loading
    if (authLoading || profilesLoading) {
        return <>{children}</>;
    }

    // Not authenticated - show children normally
    if (!isAuthenticated) {
        return <>{children}</>;
    }

    // User is authenticated but has no profiles
    // ONLY show ProfileWizard if tour phase is done (profile_config)
    // This ensures Tour runs FIRST, then ProfileWizard
    if (!hasProfiles || profiles.length === 0) {
        // Wait for tour to complete before showing ProfileWizard
        // Tour phases: 'idle' -> 'tour' -> 'profile_config' -> 'complete'
        // Only show wizard during 'profile_config' phase, NOT 'complete'
        if (phase === 'profile_config') {
            return (
                <>
                    {children}
                    <ProfileWizard onComplete={handleWizardComplete} />
                    <OfflineTransition
                        isVisible={showOfflineTransition}
                        onComplete={handleOfflineTransitionComplete}
                    />
                </>
            );
        }
        // Tour is still showing, 'complete', or 'idle' - just render children
        return (
            <>
                {children}
                <OfflineTransition
                    isVisible={showOfflineTransition}
                    onComplete={handleOfflineTransitionComplete}
                />
            </>
        );
    }

    // User has profiles - show normal app
    return (
        <>
            {children}
            <OfflineTransition
                isVisible={showOfflineTransition}
                onComplete={handleOfflineTransitionComplete}
            />
        </>
    );
}
