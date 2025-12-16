import styles from '../../app/open-finance/page.module.css';
import { motion } from 'framer-motion';
import { FiLink } from 'react-icons/fi';

export default function GhostConsent({ onClick }) {
    return (
        <div
            className={`${styles.consentCard} ${styles.ghostConsent}`}
            onClick={onClick}
        >
            <div className={styles.consentHeader}>
                <span className={styles.consentBank} style={{ color: 'var(--text-secondary)' }}>Nova Conexão</span>
            </div>
            <div className={styles.ghostBody}>
                <FiLink className={styles.ghostIconLarge} />
                <span>Conectar nova instituição</span>
            </div>
        </div>
    );
}
