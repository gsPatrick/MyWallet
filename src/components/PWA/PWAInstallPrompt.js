'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX, FiShare } from 'react-icons/fi';
import styles from './PWAInstallPrompt.module.css';

export default function PWAInstallPrompt({ variant = 'banner' }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode)
        const standalone = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
        setIsStandalone(standalone);

        // Check if iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(iOS);

        // Check if dismissed before
        const wasDismissed = localStorage.getItem('pwa-install-dismissed');
        if (wasDismissed) {
            const dismissedTime = parseInt(wasDismissed);
            // Show again after 7 days
            if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
                setDismissed(true);
            }
        }

        // Listen for beforeinstallprompt (Chrome, Edge, etc.)
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // For iOS, always show if not installed
        if (iOS && !standalone && !wasDismissed) {
            setShowPrompt(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowPrompt(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setDismissed(true);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    // Don't show if already installed or dismissed
    if (isStandalone || dismissed || !showPrompt) {
        return null;
    }

    // Header button variant (for landing page)
    if (variant === 'button') {
        return (
            <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.installButton}
                onClick={isIOS ? undefined : handleInstall}
            >
                <FiDownload />
                <span>Instalar App</span>

                {/* iOS Instructions Tooltip */}
                {isIOS && (
                    <div className={styles.iosTooltip}>
                        <p>Para instalar no iPhone/iPad:</p>
                        <ol>
                            <li>Toque em <FiShare /> na barra de navegação</li>
                            <li>Selecione "Adicionar à Tela de Início"</li>
                        </ol>
                    </div>
                )}
            </motion.button>
        );
    }

    // Banner variant (for app pages)
    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className={styles.banner}
            >
                <div className={styles.bannerContent}>
                    <div className={styles.bannerIcon}>📱</div>
                    <div className={styles.bannerText}>
                        <strong>Instale o MyWallet</strong>
                        {isIOS ? (
                            <span>Toque em <FiShare /> e "Adicionar à Tela de Início"</span>
                        ) : (
                            <span>Acesse rápido e offline</span>
                        )}
                    </div>
                </div>
                <div className={styles.bannerActions}>
                    {!isIOS && (
                        <button className={styles.installBtn} onClick={handleInstall}>
                            Instalar
                        </button>
                    )}
                    <button className={styles.dismissBtn} onClick={handleDismiss}>
                        <FiX />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
