'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import styles from './UpdateModal.module.css';

// Context for update state
const UpdateContext = createContext();

export const useUpdate = () => useContext(UpdateContext);

/**
 * UpdateModal - Força atualização quando nova versão é detectada
 * NÃO permite fechar - usuário DEVE atualizar
 */
export function UpdateModal({ show, onUpdate }) {
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
                >
                    Atualizar Agora
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
 */
export function UpdateProvider({ children }) {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [registration, setRegistration] = useState(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator)) return;
        if (process.env.NODE_ENV !== 'production') return;

        const registerSW = async () => {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js');
                setRegistration(reg);
                console.log('[PWA] Service Worker registered');

                // Detect update
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    console.log('[PWA] New version installing...');

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // New version available!
                                console.log('[PWA] New version available!');
                                setUpdateAvailable(true);
                            }
                        }
                    });
                });

                // Check for updates immediately
                reg.update();

                // Check for updates every 30 seconds
                setInterval(() => {
                    reg.update();
                }, 30 * 1000);

            } catch (error) {
                console.error('[PWA] SW registration failed:', error);
            }
        };

        // Handle controller change (when skipWaiting is called)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[PWA] Controller changed, reloading...');
            window.location.reload();
        });

        registerSW();
    }, []);

    const handleUpdate = () => {
        if (registration && registration.waiting) {
            // Tell waiting SW to take over
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
            // Fallback: just reload
            window.location.reload();
        }
    };

    return (
        <UpdateContext.Provider value={{ updateAvailable, handleUpdate }}>
            {children}
            <UpdateModal show={updateAvailable} onUpdate={handleUpdate} />
        </UpdateContext.Provider>
    );
}

export default UpdateProvider;
