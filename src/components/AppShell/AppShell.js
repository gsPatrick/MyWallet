'use client';

/**
 * AppShell - Client Component Wrapper
 * ========================================
 * OFFLINE FLOW (strict sequence):
 * 1. Online → Normal app (children)
 * 2. Goes Offline → OfflineTransition (2.5s animation)
 * 3. After animation → ChatInterface (offline mode)
 * 4. Goes Online → Back to normal app (children)
 * 
 * DEBUG: Press Ctrl+Shift+O to simulate offline
 * ========================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useProfiles } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import ProfileWizard from '@/components/Onboarding/ProfileWizard';
import OfflineTransition from '@/components/ui/OfflineTransition';
import ChatInterface from '@/components/chat/ChatInterface';

// Offline states
const OFFLINE_STATE = {
    ONLINE: 'ONLINE',
    TRANSITIONING: 'TRANSITIONING',
    OFFLINE_CHAT: 'OFFLINE_CHAT'
};

export default function AppShell({ children }) {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { profiles, loading: profilesLoading, hasProfiles, refreshProfiles } = useProfiles();
    const { phase } = useOnboarding();
    const { isOnline: networkIsOnline, isMounted } = useNetworkStatus();

    // Allow manual override for testing
    const [forceOffline, setForceOffline] = useState(false);
    const isOnline = forceOffline ? false : networkIsOnline;

    // Simple state machine for offline flow
    const [offlineState, setOfflineState] = useState(OFFLINE_STATE.ONLINE);
    const transitionTimerRef = useRef(null);
    const wasOnlineRef = useRef(true);

    // Keyboard shortcut to simulate offline (Ctrl+Shift+O)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'O') {
                e.preventDefault();
                console.log('[AppShell] DEBUG: Simulating offline toggle');
                setForceOffline(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Trigger offline transition
    const triggerOfflineTransition = useCallback(() => {
        console.log('[AppShell] Triggering offline transition...');
        setOfflineState(OFFLINE_STATE.TRANSITIONING);

        if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current);
        }

        transitionTimerRef.current = setTimeout(() => {
            console.log('[AppShell] Transition complete - showing ChatInterface');
            setOfflineState(OFFLINE_STATE.OFFLINE_CHAT);
        }, 2500);
    }, []);

    // Main offline detection logic
    useEffect(() => {
        if (!isMounted) return;

        console.log('[AppShell] Network:', isOnline, '| State:', offlineState, '| wasOnline:', wasOnlineRef.current);

        // CASE 1: Going OFFLINE (from online to offline)
        if (wasOnlineRef.current === true && isOnline === false) {
            triggerOfflineTransition();
        }

        // CASE 2: Going ONLINE (from offline to online)
        if (wasOnlineRef.current === false && isOnline === true) {
            console.log('[AppShell] Back online - returning to normal');
            if (transitionTimerRef.current) {
                clearTimeout(transitionTimerRef.current);
            }
            setOfflineState(OFFLINE_STATE.ONLINE);
        }

        wasOnlineRef.current = isOnline;

        return () => {
            if (transitionTimerRef.current) {
                clearTimeout(transitionTimerRef.current);
            }
        };
    }, [isOnline, isMounted, triggerOfflineTransition, offlineState]);

    // Handle wizard completion
    const handleWizardComplete = async () => {
        await refreshProfiles();
        window.location.reload();
    };

    // Handle closing offline chat
    const handleOfflineChatClose = () => {
        if (isOnline) {
            setOfflineState(OFFLINE_STATE.ONLINE);
        }
    };

    // ========================================
    // RENDER BASED ON OFFLINE STATE
    // ========================================

    // PRIORITY 1: Showing transition animation
    if (offlineState === OFFLINE_STATE.TRANSITIONING) {
        return <OfflineTransition isVisible={true} />;
    }

    // PRIORITY 2: Showing offline chat
    if (offlineState === OFFLINE_STATE.OFFLINE_CHAT) {
        return (
            <ChatInterface
                isOfflineMode={true}
                onClose={handleOfflineChatClose}
            />
        );
    }

    // ========================================
    // ONLINE MODE: Normal app rendering
    // ========================================

    if (authLoading || profilesLoading) {
        return <>{children}</>;
    }

    if (!isAuthenticated) {
        return <>{children}</>;
    }

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

    return <>{children}</>;
}
