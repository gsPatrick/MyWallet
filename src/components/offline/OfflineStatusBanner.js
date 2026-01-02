'use client';

/**
 * OfflineStatusBanner - Smart Capsule Design
 * =============================================
 * Mobile-only floating pill that shows sync and offline status.
 * Positioned below iPhone notch using safe-area-inset-top.
 * 
 * States:
 * - Offline: Shows FiWifiOff + "Modo Offline" (fixed/minimized)
 * - Syncing: Shows FiRefreshCw spinning + "Sincronizando..."
 * - Success: Shows FiCheck + "Sincronizado" (auto-dismiss after 3s)
 */

import React, { useState, useEffect } from 'react';
import { FiWifiOff, FiRefreshCw, FiCheck } from 'react-icons/fi';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSync } from '@/hooks/useSync';
import styles from './OfflineStatusBanner.module.css';

export default function OfflineStatusBanner() {
    const { isOnline, isMounted } = useNetworkStatus();
    const { isSyncing, syncedCount } = useSync();

    const [isMobile, setIsMobile] = useState(false);
    const [showSuccessCapsule, setShowSuccessCapsule] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    // Check if mobile viewport
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle sync success - show capsule then auto-dismiss
    useEffect(() => {
        if (syncedCount > 0 && !isSyncing && isOnline) {
            setShowSuccessCapsule(true);
            setIsExiting(false);

            // Start exit animation after 2.5s
            const exitTimer = setTimeout(() => {
                setIsExiting(true);
            }, 2500);

            // Fully hide after exit animation
            const hideTimer = setTimeout(() => {
                setShowSuccessCapsule(false);
                setIsExiting(false);
            }, 3000);

            return () => {
                clearTimeout(exitTimer);
                clearTimeout(hideTimer);
            };
        }
    }, [syncedCount, isSyncing, isOnline]);

    // Don't render on SSR or desktop
    if (!isMounted || !isMobile) return null;

    // Determine what to show
    const getCapsuleState = () => {
        // Priority 1: Success state (recently synced)
        if (showSuccessCapsule) {
            return {
                type: 'success',
                icon: <FiCheck className={styles.iconSuccess} />,
                text: `${syncedCount} sincronizado${syncedCount > 1 ? 's' : ''}`,
                className: styles.capsuleSuccess
            };
        }

        // Priority 2: Syncing
        if (isSyncing) {
            return {
                type: 'syncing',
                icon: <FiRefreshCw className={styles.iconSpin} />,
                text: 'Sincronizando...',
                className: styles.capsuleSyncing
            };
        }

        // Priority 3: Offline
        if (!isOnline) {
            return {
                type: 'offline',
                icon: <FiWifiOff className={styles.iconOffline} />,
                text: 'Modo Offline',
                className: styles.capsuleOffline
            };
        }

        return null;
    };

    const state = getCapsuleState();
    if (!state) return null;

    return (
        <div
            className={`${styles.capsule} ${state.className} ${isExiting ? styles.capsuleExit : ''}`}
        >
            {state.icon}
            <span className={styles.capsuleText}>{state.text}</span>
        </div>
    );
}
