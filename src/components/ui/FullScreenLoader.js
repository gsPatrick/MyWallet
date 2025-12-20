'use client';

/**
 * FullScreenLoader
 * ========================================
 * Clean animated loading overlay
 * Based on login animation but minimal
 * ========================================
 */

import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiBriefcase, FiRefreshCw, FiCheck } from 'react-icons/fi';
import styles from './FullScreenLoader.module.css';

export default function FullScreenLoader({
    isVisible = false,
    icon = 'loading', // 'loading' | 'profile-personal' | 'profile-business' | 'success' | custom ReactNode
    onComplete = null
}) {
    // Determine which icon to render
    const renderIcon = () => {
        if (typeof icon === 'object') return icon; // Custom ReactNode

        switch (icon) {
            case 'profile-personal':
                return <FiUser />;
            case 'profile-business':
                return <FiBriefcase />;
            case 'success':
                return <FiCheck />;
            case 'loading':
            default:
                return <FiRefreshCw className={styles.spinIcon} />;
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className={styles.overlay}
                    initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                    animate={{ clipPath: 'circle(150% at 50% 50%)' }}
                    exit={{ clipPath: 'circle(0% at 50% 50%)' }}
                    transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
                >
                    {/* Background glow */}
                    <div className={styles.glowOrb} />
                    <div className={styles.glowOrb2} />

                    {/* Icon container */}
                    <motion.div
                        className={styles.iconContainer}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
                    >
                        {/* Pulse ring */}
                        <motion.div
                            className={styles.pulseRing}
                            animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.6, 0, 0.6] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        />

                        {/* Icon */}
                        <motion.div
                            className={styles.iconBox}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            {renderIcon()}
                        </motion.div>
                    </motion.div>

                    {/* Loading dots */}
                    <motion.div
                        className={styles.loadingDots}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        {[0, 1, 2].map((i) => (
                            <motion.span
                                key={i}
                                className={styles.dot}
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
                            />
                        ))}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
