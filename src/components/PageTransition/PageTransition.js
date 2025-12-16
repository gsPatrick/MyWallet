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
        }, 600);
    }, [router]);

    return (
        <TransitionContext.Provider value={{ navigateWithTransition, isTransitioning, setIsTransitioning }}>
            {children}

            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        className={styles.overlay}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        exit={{ scaleY: 0 }}
                        transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
                    >
                        <motion.div
                            className={styles.logoWrapper}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                        >
                            <Image
                                src="/images/logoparafundopreto.png"
                                alt="MyWallet"
                                width={200}
                                height={70}
                                priority
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </TransitionContext.Provider>
    );
}
