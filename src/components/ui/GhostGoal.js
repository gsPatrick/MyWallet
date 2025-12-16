import styles from '../../app/goals/page.module.css';
import { motion } from 'framer-motion';
import { FiPlus, FiTarget, FiCalendar } from 'react-icons/fi';
import Card from './Card';

export default function GhostGoal({ onClick }) {
    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={styles.ghostGoalWrapper}
        >
            <Card className={`${styles.goalCard} ${styles.ghostCard}`}>
                {/* Hover Overlay */}
                <div className={styles.ghostOverlay}>
                    <FiPlus className={styles.ghostOverlayIcon} />
                    <span>Criar Meta</span>
                </div>

                {/* Ghost content - looks like a real goal */}
                <div className={styles.ghostContent}>
                    <div className={styles.goalHeader}>
                        <div className={styles.goalIconBg} style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                            <FiTarget style={{ color: '#6366f1' }} />
                        </div>
                        <div className={styles.goalInfo}>
                            <span className={styles.goalName}>Viagem dos Sonhos</span>
                            <span className={styles.goalCategory}>Viagem</span>
                        </div>
                    </div>

                    <span className={`${styles.priorityBadge} ${styles.medium}`}>
                        Média
                    </span>

                    <div className={styles.storageInfo}>
                        <div className={styles.noBank}>
                            <span>Vincular conta...</span>
                        </div>
                    </div>

                    <div className={styles.goalProgress}>
                        <div className={styles.progressHeader}>
                            <span>R$ 2.500,00</span>
                            <span>R$ 10.000,00</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: '25%', background: '#6366f1' }}
                            />
                        </div>
                        <div className={styles.progressFooter}>
                            <span>25% concluído</span>
                            <span>R$ 7.500,00 restante</span>
                        </div>
                    </div>

                    <div className={styles.goalDeadline}>
                        <FiCalendar />
                        <span>180 dias restantes • 15/06/2025</span>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
