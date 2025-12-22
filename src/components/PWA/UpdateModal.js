'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import styles from './UpdateModal.module.css';

// Context for update state
const UpdateContext = createContext(null);

export const useUpdate = () => useContext(UpdateContext);

/**
 * UpdateModal - Força atualização quando nova versão é detectada
 * NÃO permite fechar - usuário DEVE atualizar
 */
export function UpdateModal({ show, onUpdate, isUpdating }) {
    if (!show) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.iconContainer}>
                    <div className={styles.icon}>🚀</div>
                    <div className={styles.pulse}></div>
                </div>

                <h2 className={styles.title}>Nova Versão Disponível!</h2>

                <p className={styles.message}>
                    Uma nova versão do MyWallet está disponível com melhorias e correções importantes.
                </p>

                <div className={styles.features}>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>✨</span>
                        <span>Novos recursos</span>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>🔒</span>
                        <span>Melhorias de segurança</span>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>⚡</span>
                        <span>Performance otimizada</span>
                    </div>
                </div>

                <button
                    className={styles.updateButton}
                    onClick={onUpdate}
                    disabled={isUpdating}
                >
                    {isUpdating ? 'Atualizando...' : 'Atualizar Agora'}
                </button>

                <p className={styles.note}>
                    A atualização é rápida e seus dados estão seguros.
                </p>
            </div>
        </div>
    );
}

/**
 * UpdateProvider - Gerencia detecção de atualizações
 * Só renderiza modal quando há atualização real disponível
 */
export function UpdateProvider({ children }) {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [registration, setRegistration] = useState(null);
    const [mounted, setMounted] = useState(false);

    // Ensure we only run client-side
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator)) return;
        // Only run in production
        if (process.env.NODE_ENV !== 'production') {
            console.log('[PWA] Skipping SW registration in development');
            return;
        }

        let isSubscribed = true;

        const registerSW = async () => {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js');
                if (!isSubscribed) return;

                setRegistration(reg);
                console.log('[PWA] Service Worker registered');

                // Check if there's already a waiting worker
                if (reg.waiting) {
                    console.log('[PWA] Found waiting worker on load');
                    setUpdateAvailable(true);
                    return;
                }

                // Detect update
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (!newWorker) return;

                    console.log('[PWA] New version installing...');

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available!
                            console.log('[PWA] New version available!');
                            if (isSubscribed) {
                                setUpdateAvailable(true);
                            }
                        }
                    });
                });

                // Check for updates every 60 seconds (not too aggressive)
                const intervalId = setInterval(() => {
                    reg.update().catch(console.error);
                }, 60 * 1000);

                return () => clearInterval(intervalId);

            } catch (error) {
                console.error('[PWA] SW registration failed:', error);
            }
        };

        registerSW();

        return () => {
            isSubscribed = false;
        };
    }, [mounted]);

    const handleUpdate = useCallback(() => {
        setIsUpdating(true);

        if (registration && registration.waiting) {
            // Tell waiting SW to take over
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });

            // Listen for controller change to reload
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            }, { once: true });
        } else {
            // Fallback: just reload
            window.location.reload();
        }
    }, [registration]);

    // Don't render anything server-side
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <UpdateContext.Provider value={{ updateAvailable, handleUpdate, isUpdating }}>
            {children}
            <UpdateModal
                show={updateAvailable}
                onUpdate={handleUpdate}
                isUpdating={isUpdating}
            />
        </UpdateContext.Provider>
    );
}

export default UpdateProvider;
