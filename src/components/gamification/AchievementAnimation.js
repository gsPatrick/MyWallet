'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAward, FiCheck, FiGift } from 'react-icons/fi';
import styles from './AchievementAnimation.module.css';

const rarityColors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF'
};

const rarityLabels = {
    bronze: 'Bronze',
    silver: 'Prata',
    gold: 'Ouro',
    platinum: 'Platina',
    diamond: 'Diamante'
};

function Confetti() {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        const colors = ['#FFD700', '#C0C0C0', '#CD7F32', '#22c55e', '#ffffff'];
        const newParticles = [];
        for (let i = 0; i < 50; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * 100,
                color: colors[Math.floor(Math.random() * colors.length)],
                delay: Math.random() * 0.3,
                size: Math.random() * 6 + 3
            });
        }
        setParticles(newParticles);
    }, []);

    return (
        <div className={styles.confettiContainer}>
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className={styles.confetti}
                    style={{
                        left: `${p.x}%`,
                        width: p.size,
                        height: p.size,
                        background: p.color
                    }}
                    initial={{ y: -10, opacity: 1 }}
                    animate={{ y: '100vh', opacity: 0 }}
                    transition={{
                        duration: 2.5 + Math.random(),
                        delay: p.delay,
                        ease: 'linear'
                    }}
                />
            ))}
        </div>
    );
}

export default function AchievementAnimation({
    medal,
    isVisible,
    onClose,
    autoClose = false,
    autoCloseDelay = 5000,
    hasMoreMedals = false
}) {
    const { name, description, rarity, xpReward } = medal || {};
    const [collected, setCollected] = useState(false);

    useEffect(() => {
        if (isVisible && autoClose && !collected) {
            const timer = setTimeout(() => onClose?.(), autoCloseDelay);
            return () => clearTimeout(timer);
        }
    }, [isVisible, autoClose, autoCloseDelay, onClose, collected]);

    useEffect(() => {
        if (isVisible) setCollected(false);
    }, [isVisible, medal?.id]);

    const handleCollect = () => {
        setCollected(true);
        setTimeout(() => onClose?.(), hasMoreMedals ? 1200 : 1500);
    };

    return (
        <AnimatePresence>
            {isVisible && medal && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <Confetti />

                    <motion.div
                        className={styles.card}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                        {!collected ? (
                            <>
                                <p className={styles.subtitle}>🎉 Nova Conquista!</p>

                                <div className={styles.medal} style={{ '--color': rarityColors[rarity] }}>
                                    <FiAward />
                                </div>

                                <h2 className={styles.name}>{name}</h2>
                                <p className={styles.desc}>{description}</p>

                                <div className={styles.badges}>
                                    <span className={styles.rarity} style={{ background: rarityColors[rarity] }}>
                                        {rarityLabels[rarity]}
                                    </span>
                                    {xpReward && <span className={styles.xp}>+{xpReward} XP</span>}
                                </div>

                                <button className={styles.collectBtn} onClick={handleCollect}>
                                    <FiCheck /> Coletar Medalha
                                </button>
                            </>
                        ) : (
                            <motion.div
                                className={styles.collected}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                            >
                                <div className={styles.checkIcon}><FiCheck /></div>
                                <p>Medalha coletada!</p>
                                {hasMoreMedals ? (
                                    <motion.div
                                        className={styles.moreGifts}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <FiGift className={styles.giftIcon} />
                                        <span>Parece que tem mais uma surpresa...</span>
                                    </motion.div>
                                ) : (
                                    <span>Veja suas medalhas no Perfil</span>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
