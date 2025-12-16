import styles from '../../app/open-finance/page.module.css';
import { motion } from 'framer-motion';
import { FiPlus } from 'react-icons/fi';

export default function GhostMiniCard({ onClick }) {
    return (
        <button
            className={`${styles.cardItem} ${styles.ghostCardItem}`}
            onClick={onClick}
        >
            <div className={styles.cardVisual} style={{ background: 'transparent', border: '1px dashed var(--border-light)' }}>
                <span className={styles.cardBrand} style={{ color: 'var(--text-tertiary)' }}>NOVO</span>
                <span className={styles.cardDigits} style={{ color: 'var(--text-tertiary)' }}>••••</span>
            </div>
            <div className={styles.cardInfo}>
                <span className={styles.cardName} style={{ color: 'var(--text-secondary)' }}>Adicionar Conexão</span>
                <div className={styles.cardLimits}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Vincular novo cartão</span>
                </div>
            </div>
        </button>
    );
}
