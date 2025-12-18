'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './PageTransition.module.css';

const TransitionContext = createContext();

export function usePageTransition() {
    return useContext(TransitionContext);
}

export function PageTransitionProvider({ children }) {
    const [isTransitioning, setIsTransitioning] = useState(false);
    const router = useRouter();

    const navigateWithTransition = useCallback((href) => {
        setIsTransitioning(true);

        // Wait for animation to complete before navigating
        setTimeout(() => {
            router.push(href);
        }, 800);
    }, [router]);

    return (
        <TransitionContext.Provider value={{ navigateWithTransition, isTransitioning, setIsTransitioning }}>
            {children}

            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        className={styles.overlay}
                        initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                        animate={{ clipPath: 'circle(150% at 50% 50%)' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
                    >
                        {/* Background glow */}
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
                                className={styles.logoWrapper}
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Image
                                    src="/images/logoparafundopreto.png"
                                    alt="MyWallet"
                                    width={280}
                                    height={100}
                                    style={{ objectFit: 'contain' }}
                                    priority
                                />
                            </motion.div>
                        </motion.div>

                        {/* Loading indicator */}
                        <motion.div
                            className={styles.loadingDots}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
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
        </TransitionContext.Provider>
    );
}

