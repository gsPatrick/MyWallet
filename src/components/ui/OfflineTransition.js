'use client';

/**
 * OfflineTransition
 * ==================
 * Cinematic full-screen transition when app goes offline.
 * Clones the visual style of login page animation (glowOrb, pulseRing, etc.)
 * 
 * Simplified: AppShell controls the 2.5s timing, this just animates.
 */

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './OfflineTransition.module.css';

export default function OfflineTransition({ isVisible }) {
    return (
        <AnimatePresence mode="wait">
            {isVisible && (
                <motion.div
                    key="offline-transition"
                    className={styles.container}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                    {/* Background glows */}
                    <div className={styles.glowOrb} />
                    <div className={styles.glowOrb2} />

                    {/* Logo container */}
                    <motion.div
                        className={styles.logoContainer}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
                    >
                        {/* Pulse ring */}
                        <motion.div
                            className={styles.pulseRing}
                            animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.6, 0, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />

                        {/* Logo */}
                        <motion.div
                            className={styles.logoAnimated}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <Image
                                src="/images/logoparafundopreto.png"
                                alt="MyWallet"
                                width={180}
                                height={65}
                                style={{ objectFit: 'contain' }}
                                priority
                            />
                        </motion.div>
                    </motion.div>

                    {/* Status text */}
                    <motion.h1
                        className={styles.statusText}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        Ativando modo offline...
                    </motion.h1>

                    <motion.p
                        className={styles.subtitleText}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        transition={{ delay: 0.6 }}
                    >
                        Seus dados estão salvos localmente
                    </motion.p>

                    {/* Loading dots */}
                    <motion.div
                        className={styles.loadingDots}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        {[0, 1, 2].map((i) => (
                            <motion.span
                                key={i}
                                className={styles.dot}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                            />
                        ))}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
