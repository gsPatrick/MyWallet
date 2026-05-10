'use client';

import { useState, useEffect } from 'react';
import { FiDelete, FiX, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './NumericKeypad.module.css';

export default function NumericKeypad({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = 'Digite seu PIN',
    length = 4,
    description = 'Sua senha de 4 dígitos',
    variant = 'default' // 'default', 'security'
}) {
    const [digits, setDigits] = useState([]);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setDigits([]);
            setError(false);
        }
    }, [isOpen]);

    const handleNumber = (num) => {
        if (digits.length < length) {
            setDigits([...digits, num]);
            setError(false);
        }
    };

    const handleDelete = () => {
        setDigits(digits.slice(0, -1));
        setError(false);
    };

    const handleConfirm = () => {
        if (digits.length === length) {
            onConfirm(digits.join(''));
        } else {
            setError(true);
            // Shake effect or simple red pulse
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className={styles.overlay} onClick={onClose}>
                <motion.div 
                    className={styles.keypadContainer}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={`${styles.header} ${styles[variant]}`}>
                        <div className={styles.dragHandle} />
                        {variant === 'security' && <div className={styles.iconWrapper}><FiShield /></div>}
                        <h3>{title}</h3>
                        <p>{description}</p>
                        <button className={styles.closeBtn} onClick={onClose}>
                            <FiX />
                        </button>
                    </div>

                    <div className={`${styles.display} ${error ? styles.error : ''}`}>
                        {[...Array(length)].map((_, i) => (
                            <div 
                                key={i} 
                                className={`${styles.dot} ${digits[i] !== undefined ? styles.filled : ''}`}
                            />
                        ))}
                    </div>

                    <div className={styles.grid}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button 
                                key={num} 
                                className={styles.key} 
                                onClick={() => handleNumber(num.toString())}
                            >
                                {num}
                            </button>
                        ))}
                        <button className={styles.keyAction} onClick={onClose}>
                            <FiX />
                        </button>
                        <button 
                            className={styles.key} 
                            onClick={() => handleNumber('0')}
                        >
                            0
                        </button>
                        <button className={styles.keyAction} onClick={handleDelete}>
                            <FiDelete />
                        </button>
                    </div>

                    <div className={styles.footer}>
                        <button 
                            className={styles.confirmBtn} 
                            disabled={digits.length !== length}
                            onClick={handleConfirm}
                        >
                            Confirmar <FiCheck />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
