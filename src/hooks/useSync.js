import { useState, useEffect, useCallback } from 'react';
import { getQueue, removeFromQueue } from '../services/offline/queue';
import { updateChatMessageStatus } from '../services/offline/db';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://geral-mywallet-api.r954jc.easypanel.host';

/**
 * Hook to manage offline synchronization.
 * Listens for 'online' events and processes the pending queue.
 * Provides feedback through isSyncing and syncedCount states.
 */
export const useSync = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncedCount, setSyncedCount] = useState(0);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    const processQueue = useCallback(async () => {
        if (typeof window === 'undefined') return;

        const queue = await getQueue();
        if (queue.length === 0) return;

        console.log('[useSync] Starting sync for', queue.length, 'items');
        setIsSyncing(true);
        setSyncedCount(0);

        let successCount = 0;

        // Process one by one to ensure order
        for (const item of queue) {
            try {
                // Get auth token
                const token = localStorage.getItem('investpro_token');

                // Build full URL
                const fullUrl = item.url.startsWith('http')
                    ? item.url
                    : `${API_URL}${item.url}`;

                // Make the actual API call
                const response = await fetch(fullUrl, {
                    method: item.method || 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : '',
                        ...(item.headers || {})
                    },
                    body: item.body ? JSON.stringify({
                        ...item.body,
                        offlineId: item.body.offlineId || item.id // Include offlineId for dedup
                    }) : undefined
                });

                if (response.ok) {
                    await removeFromQueue(item.id);
                    successCount++;
                    setSyncedCount(prev => prev + 1);

                    // Update message status in chat if this was a chat message
                    if (item.type === 'CHAT' && item.body?.messageId) {
                        try {
                            await updateChatMessageStatus(item.body.messageId, 'read');
                        } catch (e) {
                            console.warn('[useSync] Could not update message status:', e);
                        }
                    }

                    console.log('[useSync] Synced item:', item.id);
                } else {
                    console.warn(`[useSync] Failed for item ${item.id}: Server returned ${response.status}`);
                    // Keep in queue for retry
                }
            } catch (error) {
                console.error(`[useSync] Network error for item ${item.id}:`, error);
                // Network might have flickered, keep in queue
            }
        }

        setIsSyncing(false);
        setLastSyncTime(Date.now());

        if (successCount > 0) {
            console.log(`[useSync] Sync complete: ${successCount} items synced`);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => {
            console.log('[useSync] Online detected, starting sync...');
            // Small delay to ensure connection is stable
            setTimeout(processQueue, 500);
        };

        window.addEventListener('online', handleOnline);

        // Check on mount as well, in case we just loaded and have pending items
        if (navigator.onLine) {
            processQueue();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [processQueue]);

    // Manual sync trigger
    const syncNow = useCallback(() => {
        if (!isSyncing) {
            processQueue();
        }
    }, [isSyncing, processQueue]);

    return {
        isSyncing,
        syncedCount,
        lastSyncTime,
        syncNow  // Allows manual trigger
    };
};

export default useSync;
