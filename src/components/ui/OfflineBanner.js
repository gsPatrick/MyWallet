import React from 'react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useSync } from '@/hooks/useSync';
import { FiWifiOff, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import styles from './OfflineBanner.module.css';

export default function OfflineBanner() {
    const isOnline = useOfflineStatus();
    const { isSyncing, syncedCount } = useSync();

    if (isOnline && !isSyncing && syncedCount === 0) return null;

    // Show persistent banner if offline
    if (!isOnline) {
        return (
            <div className={`${styles.banner} ${styles.offline}`}>
                <FiWifiOff />
                <span>Modo Offline 📡 - Seus dados serão salvos localmente</span>
            </div>
        );
    }

    // Show transient banner if syncing or just synced
    if (isSyncing) {
        return (
            <div className={`${styles.banner} ${styles.syncing}`}>
                <FiRefreshCw className={styles.spin} />
                <span>Sincronizando dados pendentes...</span>
            </div>
        );
    }

    if (syncedCount > 0) {
        // This effectively shows "Tudo atualizado" for a brief moment before component unmounts
        // Ideally we'd use a timeout to clear syncedCount, but for PoC this is tricky without extra state.
        // We will assume the hook keeps syncedCount > 0 until next sync start? 
        // Actually, the hook sets syncedCount to 0 at start of next sync.
        // To make this banner disappear, we might need internal timeout here or just let it stay 
        // until the user refreshes or we modify logic.
        // For simplicity/UX quality: let's auto-hide after 3s.
        return <SyncSuccessBanner count={syncedCount} />;
    }

    return null;
}

function SyncSuccessBanner({ count }) {
    const [visible, setVisible] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 3000);
        return () => clearTimeout(timer);
    }, [count]);

    if (!visible) return null;

    return (
        <div className={`${styles.banner} ${styles.success}`}>
            <FiCheckCircle />
            <span>{count} transações sincronizadas com sucesso! ✅</span>
        </div>
    );
}
