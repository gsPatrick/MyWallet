import { useState, useEffect } from 'react';
import { getQueue, removeFromQueue } from '../services/offline/queue';

/**
 * Hook to manage offline synchronization.
 * Listens for 'online' events and processes the pending queue.
 */
export const useSync = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncedCount, setSyncedCount] = useState(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const processQueue = async () => {
            const queue = await getQueue();
            if (queue.length === 0) return;

            setIsSyncing(true);
            setSyncedCount(0);

            // Process one by one to ensure order
            for (const item of queue) {
                try {
                    // Mimic the actual API call logic
                    // In a real app, you might want to map 'type' to specific service functions
                    // For now, we assume simple fetch for the PoC
                    const response = await fetch(item.url, {
                        method: item.method,
                        headers: {
                            'Content-Type': 'application/json',
                            ...(item.headers || {})
                        },
                        body: item.body ? JSON.stringify(item.body) : undefined
                    });

                    if (response.ok) {
                        await removeFromQueue(item.id);
                        setSyncedCount(prev => prev + 1);
                    } else {
                        console.warn(`Sync failed for item ${item.id}: Server returned ${response.status}`);
                        // Optional: keep in queue or move to 'failed' store
                    }
                } catch (error) {
                    console.error(`Sync failed for item ${item.id}`, error);
                    // Network might have flickered, keep in queue
                }
            }

            setIsSyncing(false);
            // Optional: Notification indicating sync complete
        };

        const handleOnline = () => {
            console.log('Online detected, starting sync...');
            processQueue();
        };

        window.addEventListener('online', handleOnline);

        // Check on mount as well, in case we just loaded and have pending items
        if (navigator.onLine) {
            processQueue();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    return { isSyncing, syncedCount };
};
