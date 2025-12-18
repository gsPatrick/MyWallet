'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiArrowRight, FiCheck } from 'react-icons/fi';
import styles from './TourOverlay.module.css';

export default function TourOverlay({ step, currentStep, totalSteps, onNext, onSkip }) {
    const [targetRect, setTargetRect] = useState(null);

    useEffect(() => {
        const updatePosition = () => {
            if (!step) return;

            // Temporarily unlock to allow programmatic scroll
            // This is safe because OnboardingContext re-enforces 'hidden' on mount, 
            // but for instant scrolling we validly need to unlock.
            // We immediately re-lock after.
            document.body.style.overflow = '';

            // If no targetId is provided, treat as "General Page Step" (Fixed Position)
            if (!step.targetId) {
                setTargetRect(null);
                document.body.style.overflow = 'hidden'; // Ensure lock is back
                return;
            }

            const element = document.getElementById(step.targetId);
            if (element) {
                // Instant scroll to ensure accurate rect calculation immediately
                element.scrollIntoView({ behavior: 'auto', block: 'center' });

                // Re-lock immediately
                document.body.style.overflow = 'hidden';

                const rect = element.getBoundingClientRect();

                // Only set if element is actually visible/sized
                if (rect.width > 0 && rect.height > 0) {
                    setTargetRect({
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height
                    });
                } else {
                    setTargetRect(null);
                }
            } else {
                setTargetRect(null);
                document.body.style.overflow = 'hidden';
            }
        };

        // Initial update with slight delay to ensure DOM is ready
        const timer = setTimeout(updatePosition, 100);

        window.addEventListener('resize', updatePosition);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updatePosition);
            // DO NOT restore overflow here anymore. 
            // OnboardingContext handles the global lock state.
        };
    }, [step]);

    if (!step) return null;

    return (
        <div className={styles.overlayContainer}>
            {/* Dark Background Mask */}
            <div className={styles.backdrop} />

            {/* Spotlight Hole (Visual Only - achieved via clip-path or huge borders, simpler to just float card) 
                Actually, to make it "lock" screen but allow seeing through, we can use a SVG mask or box-shadow trick.
                Let's use the box-shadow trick on the highlight box.
            */}

            {targetRect && (
                <motion.div
                    className={styles.spotlight}
                    initial={{ opacity: 0 }}
                    animate={{
                        top: targetRect.top,
                        left: targetRect.left,
                        width: targetRect.width,
                        height: targetRect.height,
                        opacity: 1
                    }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                />
            )}

            {/* Content Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep} // Triggers animation on step change
                    className={styles.tooltipCard}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={targetRect ? {
                        position: 'absolute',
                        top: targetRect.top + targetRect.height + 20,
                        left: targetRect.left,
                        // Adjust if going off screen (basic clamp)
                        ...(targetRect.top > window.innerHeight - 300 ? { top: targetRect.top - 220 } : {}),
                        // Adjust horizontal if too far right
                        ...(targetRect.left > window.innerWidth - 340 ? { left: window.innerWidth - 340, transform: 'none' } : { transform: 'none' })
                    } : {
                        // Fixed Position for General Steps
                        position: 'fixed',
                        bottom: '40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: 'auto'
                    }}
                >
                    <div className={styles.cardContent}>
                        <h3 className={styles.title}>{step.title}</h3>
                        <p className={styles.description}>{step.content}</p>

                        <div className={styles.footer}>
                            <button onClick={onSkip} className={styles.skipBtn}>
                                Pular tour
                            </button>
                            <button onClick={onNext} className={styles.nextBtn}>
                                {currentStep === totalSteps - 1 ? 'Concluir' : 'Próximo'}
                                {currentStep === totalSteps - 1 ? <FiCheck /> : <FiArrowRight />}
                            </button>
                        </div>
                    </div>
                    <div className={styles.stepIndicator}>
                        {currentStep + 1} de {totalSteps}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
