'use client';

/**
 * OfflineTransition
 * ==================
 * Cinematic full-screen transition when app goes offline.
 * Clones the visual style of login page animation (glowOrb, pulseRing, etc.)
 */

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './OfflineTransition.module.css';

export default function OfflineTransition({ isVisible, onComplete }) {
    const [phase, setPhase] = useState('entering'); // 'entering' | 'showing' | 'exiting'

    useEffect(() => {
        if (!isVisible) {
            setPhase('entering');
            return;
        }

        // Phase 1: Entering animation (0.7s)
        setPhase('entering');

        // Phase 2: Show content (2.5s total display time)
        const showTimer = setTimeout(() => {
            setPhase('showing');
        }, 700);

        // Phase 3: Exit and call onComplete (after 2.5s)
        const exitTimer = setTimeout(() => {
            setPhase('exiting');
            if (onComplete) {
                setTimeout(onComplete, 500); // Wait for exit animation
            }
        }, 2500);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(exitTimer);
        };
    }, [isVisible, onComplete]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={styles.container}
                initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                animate={{ clipPath: 'circle(150% at 50% 50%)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            >
                {/* Background glows */}
                <div className={styles.glowOrb} />
                <div className={styles.glowOrb2} />

                {/* Logo container */}
                <motion.div
                    className={styles.logoContainer}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
                >
                    {/* Pulse ring */}
                    <motion.div
                        className={styles.pulseRing}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [0.8, 1.5, 0.8], opacity: [0.5, 0, 0.5] }}
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
                            width={200}
                            height={72}
                            style={{ objectFit: 'contain' }}
                            priority
                        />
                    </motion.div>
                </motion.div>

                {/* Status text */}
                <motion.h1
                    className={styles.statusText}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    Ativando modo offline...
                </motion.h1>

                <motion.p
                    className={styles.subtitleText}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    Seus dados estão salvos localmente
                </motion.p>

                {/* Loading dots */}
                <motion.div
                    className={styles.loadingDots}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
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

                {/* Fade overlay on exit */}
                {phase === 'exiting' && (
                    <motion.div
                        className={styles.fadeOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                    />
                )}
            </motion.div>
        </AnimatePresence>
    );
}
