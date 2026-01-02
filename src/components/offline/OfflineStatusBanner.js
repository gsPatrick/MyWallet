'use client';

/**
 * OfflineStatusBanner
 * Shows download progress and offline readiness status
 * - Appears when downloading data for offline
 * - Shows what's available in offline mode
 */

import React from 'react';
import { FiWifi, FiWifiOff, FiDownload, FiCheck, FiMic, FiDatabase } from 'react-icons/fi';
import { useOfflinePrefetch } from '@/hooks/useOfflinePrefetch';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAI } from '@/contexts/AIContext';
import styles from './OfflineStatusBanner.module.css';

export default function OfflineStatusBanner() {
    const { isOnline, isMounted } = useNetworkStatus();
    const { isPrefetching, prefetchProgress, isOfflineReady, lastSync } = useOfflinePrefetch();
    const ai = useAI();

    // Don't render on SSR or if online and nothing happening
    if (!isMounted) return null;

    // Show download progress banner
    if (isPrefetching && prefetchProgress) {
        return (
            <div className={styles.banner} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <div className={styles.content}>
                    <FiDownload className={styles.icon} />
                    <div className={styles.info}>
                        <span className={styles.title}>Preparando modo offline...</span>
                        <span className={styles.subtitle}>
                            {prefetchProgress.name} ({prefetchProgress.current}/{prefetchProgress.total})
                        </span>
                    </div>
                    <div className={styles.progressWrapper}>
                        <div
                            className={styles.progressBar}
                            style={{ width: `${prefetchProgress.percent}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Show offline status when offline
    if (!isOnline) {
        const aiStatus = ai.isModelReady ? 'Voz ✓' : 'Voz ✗';
        const dataStatus = isOfflineReady ? 'Dados ✓' : 'Dados ✗';

        return (
            <div className={styles.banner} style={{ background: '#1a1a2e' }}>
                <div className={styles.content}>
                    <FiWifiOff className={styles.icon} style={{ color: '#f59e0b' }} />
                    <div className={styles.info}>
                        <span className={styles.title}>Modo Offline</span>
                        <span className={styles.subtitle}>
                            {dataStatus} • {aiStatus}
                        </span>
                    </div>
                    <div className={styles.badges}>
                        {isOfflineReady && (
                            <span className={styles.badge} style={{ background: '#22c55e' }}>
                                <FiDatabase size={12} /> Dados
                            </span>
                        )}
                        {ai.isModelReady && (
                            <span className={styles.badge} style={{ background: '#8b5cf6' }}>
                                <FiMic size={12} /> Voz
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Show AI download progress when downloading
    if (ai.status === 'downloading') {
        return (
            <div className={styles.banner} style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
                <div className={styles.content}>
                    <FiMic className={styles.icon} />
                    <div className={styles.info}>
                        <span className={styles.title}>Baixando IA de voz...</span>
                        <span className={styles.subtitle}>{Math.round(ai.downloadProgress * 100)}%</span>
                    </div>
                    <div className={styles.progressWrapper}>
                        <div
                            className={styles.progressBar}
                            style={{ width: `${ai.downloadProgress * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Show success banner briefly after prefetch completes
    if (isOfflineReady && lastSync) {
        const syncDate = new Date(lastSync);
        const now = new Date();
        const minutesAgo = Math.floor((now - syncDate) / (1000 * 60));

        // Only show if sync was recent (within 2 minutes)
        if (minutesAgo < 2) {
            return (
                <div className={styles.banner} style={{ background: '#22c55e' }}>
                    <div className={styles.content}>
                        <FiCheck className={styles.icon} />
                        <div className={styles.info}>
                            <span className={styles.title}>Pronto para uso offline!</span>
                            <span className={styles.subtitle}>
                                Dados sincronizados • {ai.isModelReady ? 'Voz ativa' : 'Apenas texto'}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
    }

    return null;
}
