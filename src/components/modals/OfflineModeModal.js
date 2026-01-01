'use client';

import { useState, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import styles from './OfflineModeModal.module.css';

const STORAGE_KEY = 'mywallet_hide_offline_modal';

export default function OfflineModeModal() {
    const { isOnline } = useNetworkStatus();
    const [showModal, setShowModal] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    useEffect(() => {
        // Only show modal if offline AND user hasn't dismissed permanently
        const hidePreference = localStorage.getItem(STORAGE_KEY);
        if (!isOnline && hidePreference !== 'true') {
            setShowModal(true);
        } else {
            setShowModal(false);
        }
    }, [isOnline]);

    const handleDismiss = () => {
        if (dontShowAgain) {
            localStorage.setItem(STORAGE_KEY, 'true');
        }
        setShowModal(false);
    };

    if (!showModal) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.icon}>📡</div>
                <h2 className={styles.title}>Você está Offline</h2>
                <p className={styles.message}>
                    Estamos exibindo seus dados mais recentes. Você pode navegar e registrar
                    transações, e sincronizaremos tudo quando a conexão voltar.
                </p>

                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className={styles.checkbox}
                    />
                    Não mostrar novamente
                </label>

                <button className={styles.button} onClick={handleDismiss}>
                    Entendi
                </button>
            </div>
        </div>
    );
}
