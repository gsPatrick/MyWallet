/**
 * Offline Prefetch Hook
 * Automatically prefetches all user data for offline use
 * - Runs on first access
 * - Updates continuously when online
 */

import { useEffect, useState, useCallback } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import offlinePrefetch from '@/services/offline/prefetch';

export function useOfflinePrefetch() {
    const { isOnline, isMounted } = useNetworkStatus();
    const [isPrefetching, setIsPrefetching] = useState(false);
    const [prefetchProgress, setPrefetchProgress] = useState(null);
    const [lastSync, setLastSync] = useState(null);
    const [error, setError] = useState(null);

    // Check if we need to prefetch on mount
    useEffect(() => {
        if (!isMounted || typeof window === 'undefined') return;

        const lastSyncTime = offlinePrefetch.getLastSyncTime();
        setLastSync(lastSyncTime);

        // Auto-prefetch on first access if online
        if (isOnline && !offlinePrefetch.isPrefetchComplete()) {
            console.log('[useOfflinePrefetch] First access detected, starting prefetch...');
            runPrefetch();
        }
    }, [isMounted, isOnline]);

    // Update data when coming back online
    useEffect(() => {
        if (!isMounted || typeof window === 'undefined') return;

        // If we just came online and have prefetched before, refresh data
        if (isOnline && offlinePrefetch.isPrefetchComplete()) {
            const lastSyncTime = offlinePrefetch.getLastSyncTime();
            if (lastSyncTime) {
                const lastSync = new Date(lastSyncTime);
                const now = new Date();
                const hoursSinceSync = (now - lastSync) / (1000 * 60 * 60);

                // Refresh if more than 1 hour since last sync
                if (hoursSinceSync > 1) {
                    console.log('[useOfflinePrefetch] Data stale, refreshing...');
                    runPrefetch(true); // silent refresh
                }
            }
        }
    }, [isOnline, isMounted]);

    const runPrefetch = useCallback(async (silent = false) => {
        if (isPrefetching) return;

        setIsPrefetching(true);
        setError(null);

        if (!silent) {
            setPrefetchProgress({ current: 0, total: 6, name: 'starting', percent: 0 });
        }

        try {
            const result = await offlinePrefetch.prefetchAllData((progress) => {
                if (!silent) {
                    setPrefetchProgress(progress);
                }
            });

            setLastSync(offlinePrefetch.getLastSyncTime());

            if (!result.success && result.errors.length > 0) {
                console.warn('[useOfflinePrefetch] Some data failed to cache:', result.errors);
            }
        } catch (err) {
            console.error('[useOfflinePrefetch] Prefetch failed:', err);
            setError(err.message);
        } finally {
            setIsPrefetching(false);
            if (!silent) {
                setPrefetchProgress(null);
            }
        }
    }, [isPrefetching]);

    // Manual sync function
    const syncNow = useCallback(() => {
        if (isOnline) {
            return runPrefetch(false);
        }
        return Promise.resolve();
    }, [isOnline, runPrefetch]);

    return {
        isPrefetching,
        prefetchProgress,
        lastSync,
        error,
        syncNow,
        isOfflineReady: offlinePrefetch.isPrefetchComplete()
    };
}

export default useOfflinePrefetch;
