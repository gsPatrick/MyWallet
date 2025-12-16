import styles from '../../app/open-finance/page.module.css';
import { motion } from 'framer-motion';
import { FiPlus } from 'react-icons/fi';

export default function GhostAccount({ onClick }) {
    return (
        <motion.div
            className={`${styles.accountCard} ${styles.ghostAccount}`}
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className={styles.ghostContent}>
                <div className={styles.ghostIconCircle}>
                    <FiPlus />
                </div>
                <span>Conectar Nova Conta</span>
            </div>
        </motion.div>
    );
}
