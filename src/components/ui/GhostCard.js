import styles from '../../app/cards/page.module.css';
import cardStyles from './CreditCard/CreditCard.module.css';
import { motion } from 'framer-motion';
import { FiWifi, FiPlus } from 'react-icons/fi';

export default function GhostCard({ onClick, label = "ADICIONAR NOVO", icon: Icon = FiPlus }) {
    return (
        <motion.div
            className={`${styles.cardWrapper} ${styles.ghostWrapper}`}
            onClick={onClick}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className={`${cardStyles.card} ${styles.ghostCard}`}>
                {/* Header */}
                <div className={cardStyles.header}>
                    <span className={cardStyles.bankName}>{label}</span>
                    <FiWifi className={cardStyles.contactlessIcon} style={{ opacity: 0.3 }} />
                </div>

                {/* Chip */}
                <div className={`${cardStyles.chip} ${styles.ghostChip}`}>
                    <div className={cardStyles.chipLines}>
                        <span /><span /><span /><span />
                    </div>
                </div>

                {/* Card Number */}
                <div className={cardStyles.cardNumber}>
                    <span className={cardStyles.dots}>••••</span>
                    <span className={cardStyles.dots}>••••</span>
                    <span className={cardStyles.dots}>••••</span>
                    <span className={cardStyles.lastDigits}>NOVO</span>
                </div>

                {/* Bottom Section */}
                <div className={cardStyles.bottom}>
                    <div className={cardStyles.holderInfo}>
                        <div className={cardStyles.labelGroup}>
                            <span className={cardStyles.label}>TITULAR</span>
                            <span className={cardStyles.value}>SEU NOME</span>
                        </div>
                        <div className={cardStyles.labelGroup}>
                            <span className={cardStyles.label}>VALIDADE</span>
                            <span className={cardStyles.value}>--/--</span>
                        </div>
                    </div>
                    <div className={styles.ghostIconWrapper}>
                        <Icon />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
