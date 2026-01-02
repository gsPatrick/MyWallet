'use client';

/**
 * OfflineStatusBanner - Smart Capsule Version
 * =============================================
 * Mobile-only floating pill that shows download and offline status.
 * Positioned below iPhone notch using safe-area-inset-top.
 * Desktop: Hidden (returns null)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FiWifiOff, FiDownload, FiCheck, FiMic, FiDatabase, FiLoader } from 'react-icons/fi';
import { useOfflinePrefetch } from '@/hooks/useOfflinePrefetch';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAI } from '@/contexts/AIContext';
import styles from './OfflineStatusBanner.module.css';

export default function OfflineStatusBanner() {
    const { isOnline, isMounted } = useNetworkStatus();
    const { isPrefetching, prefetchProgress, isOfflineReady, lastSync } = useOfflinePrefetch();
    const ai = useAI();

    const [isMobile, setIsMobile] = useState(false);
    const [showCompleteBadge, setShowCompleteBadge] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

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

    // Determine visibility based on state
    useEffect(() => {
        const shouldShow = isPrefetching || ai.status === 'downloading' || !isOnline || showCompleteBadge;
        setIsVisible(shouldShow);
    }, [isPrefetching, ai.status, isOnline, showCompleteBadge]);

    // Handle completion badge
    useEffect(() => {
        if (isOfflineReady && lastSync) {
            const syncDate = new Date(lastSync);
            const now = new Date();
            const minutesAgo = Math.floor((now - syncDate) / (1000 * 60));

            if (minutesAgo < 2) {
                setShowCompleteBadge(true);
                const timer = setTimeout(() => setShowCompleteBadge(false), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [isOfflineReady, lastSync]);

    // Handle AI download complete
    useEffect(() => {
        if (ai.status === 'ready' && ai.downloadProgress === 100) {
            setShowCompleteBadge(true);
            const timer = setTimeout(() => setShowCompleteBadge(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [ai.status, ai.downloadProgress]);

    // Don't render on SSR, desktop, or if nothing to show
    if (!isMounted || !isMobile || !isVisible) return null;

    // Determine content
    const getContent = () => {
        // Show completion state
        if (showCompleteBadge && !isPrefetching && ai.status !== 'downloading') {
            return {
                icon: <FiCheck className={styles.iconSuccess} />,
                text: 'Pronto para offline',
                isComplete: true
            };
        }

        // Show AI download progress
        if (ai.status === 'downloading') {
            return {
                icon: <FiLoader className={styles.iconSpinner} />,
                text: `Baixando IA... ${Math.round(ai.downloadProgress)}%`,
                progress: ai.downloadProgress
            };
        }

        // Show data prefetching
        if (isPrefetching && prefetchProgress) {
            return {
                icon: <FiDownload className={styles.iconPulse} />,
                text: `${prefetchProgress.name}`,
                progress: prefetchProgress.percent
            };
        }

        // Show offline status
        if (!isOnline) {
            const hasData = isOfflineReady;
            const hasVoice = ai.isModelReady;

            return {
                icon: <FiWifiOff className={styles.iconWarning} />,
                text: 'Modo Offline',
                badges: [
                    hasData && { icon: <FiDatabase size={12} />, label: 'Dados' },
                    hasVoice && { icon: <FiMic size={12} />, label: 'Voz' }
                ].filter(Boolean)
            };
        }

        return null;
    };

    const content = getContent();
    if (!content) return null;

    return (
        <div className={`${styles.capsule} ${content.isComplete ? styles.capsuleComplete : ''}`}>
            <div className={styles.capsuleContent}>
                {content.icon}
                <span className={styles.capsuleText}>{content.text}</span>

                {/* Progress bar */}
                {content.progress !== undefined && (
                    <div className={styles.miniProgress}>
                        <div
                            className={styles.miniProgressFill}
                            style={{ width: `${content.progress}%` }}
                        />
                    </div>
                )}

                {/* Badges for offline mode */}
                {content.badges && (
                    <div className={styles.capsuleBadges}>
                        {content.badges.map((badge, i) => (
                            <span key={i} className={styles.miniBadge}>
                                {badge.icon}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
