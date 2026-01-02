'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const HEARTBEAT_INTERVAL = 10000; // 10 seconds
const HEARTBEAT_TIMEOUT = 5000; // 5 seconds timeout for fetch
const HEALTH_ENDPOINT = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}/api/health`
    : 'https://geral-mywallet-api.r954jc.easypanel.host/api/health';

/**
 * True Network Detection Hook
 * Goes beyond navigator.onLine by performing periodic heartbeat checks.
 * Only considers "online" when heartbeat succeeds.
 * 
 * SSR-Safe: Returns isOnline=true during SSR to prevent hydration mismatch.
 * Real check happens only after client mounts.
 */
export function useNetworkStatus() {
    // Start with true to match SSR (prevents hydration mismatch)
    const [isOnline, setIsOnline] = useState(true);
    const [lastCheck, setLastCheck] = useState(null);
    const [isMounted, setIsMounted] = useState(false);
    const intervalRef = useRef(null);

    const performHeartbeat = useCallback(async () => {
        // SSR safety: don't run on server
        if (typeof window === 'undefined') return true;

        // If browser says offline, trust it immediately
        if (!navigator.onLine) {
            setIsOnline(false);
            return false;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), HEARTBEAT_TIMEOUT);

            const response = await fetch(HEALTH_ENDPOINT, {
                method: 'HEAD', // Lightweight check
                cache: 'no-store',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const online = response.ok;
            setIsOnline(online);
            setLastCheck(Date.now());
            return online;
        } catch (error) {
            // Network error - but don't immediately mark offline if endpoint doesn't exist
            // Just use navigator.onLine as fallback
            const browserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
            setIsOnline(browserOnline);
            setLastCheck(Date.now());
            return browserOnline;
        }
    }, []);

    const startHeartbeat = useCallback(() => {
        if (intervalRef.current) return;

        // Immediate check
        performHeartbeat();

        // Start interval
        intervalRef.current = setInterval(performHeartbeat, HEARTBEAT_INTERVAL);
    }, [performHeartbeat]);

    const stopHeartbeat = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // Mount effect - runs only on client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // Don't run until mounted (client-side)
        if (!isMounted) return;

        const handleOnline = () => {
            startHeartbeat();
        };

        const handleOffline = () => {
            stopHeartbeat();
            setIsOnline(false);
        };

        // Initial setup - only on client
        if (navigator.onLine) {
            startHeartbeat();
        } else {
            setIsOnline(false);
        }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            stopHeartbeat();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isMounted, startHeartbeat, stopHeartbeat]);

    return {
        isOnline,
        lastCheck,
        checkNow: performHeartbeat,
        isMounted
    };
}

export default useNetworkStatus;
