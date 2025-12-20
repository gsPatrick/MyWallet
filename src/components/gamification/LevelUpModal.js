'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAward, FiStar } from 'react-icons/fi';
import Avatar from './Avatar';
import styles from './LevelUpModal.module.css';

const tierData = [
    { max: 10, name: 'Iniciante', color: '#22c55e', emoji: '🌱' },
    { max: 20, name: 'Aprendiz', color: '#3b82f6', emoji: '📚' },
    { max: 30, name: 'Intermediário', color: '#8b5cf6', emoji: '⚡' },
    { max: 40, name: 'Avançado', color: '#ec4899', emoji: '🔥' },
    { max: 50, name: 'Expert', color: '#f97316', emoji: '🎯' },
    { max: 60, name: 'Mestre', color: '#eab308', emoji: '👑' },
    { max: 70, name: 'Grão-Mestre', color: '#ef4444', emoji: '💎' },
    { max: 80, name: 'Elite', color: '#14b8a6', emoji: '🌟' },
    { max: 90, name: 'Lenda', color: '#f59e0b', emoji: '🏆' },
    { max: 100, name: 'Imortal', color: '#a855f7', emoji: '✨' }
];

const levelMedals = {
    10: { name: 'Bronze', emoji: '🥉', color: '#CD7F32' },
    20: { name: 'Prata', emoji: '🥈', color: '#C0C0C0' },
    25: { name: 'Ouro', emoji: '🥇', color: '#FFD700' },
    50: { name: 'Platina', emoji: '💎', color: '#E5E4E2' },
    70: { name: 'Diamante', emoji: '💠', color: '#B9F2FF' },
    100: { name: 'Mestre Supremo', emoji: '👑', color: '#FF6B35' }
};

const getTier = (level) => {
    return tierData.find(t => level <= t.max) || tierData[tierData.length - 1];
};

const getMedalForLevel = (level) => {
    return levelMedals[level] || null;
};

export default function LevelUpModal({
    isVisible,
    onClose,
    newLevel,
    previousLevel = 1,
    xpGained,
    avatarSkinTone = 'pardo',
    avatarGender = 'masculino',
    displayBadge = null
}) {
    const [animatedLevel, setAnimatedLevel] = useState(previousLevel);

    useEffect(() => {
        if (isVisible && newLevel) {
            setAnimatedLevel(previousLevel);

            // Animate level counter from previous to new
            const startLevel = previousLevel;
            const endLevel = newLevel;
            const duration = 1500; // 1.5 seconds
            const steps = endLevel - startLevel;
            const stepDuration = duration / steps;

            let currentStep = 0;
            const interval = setInterval(() => {
                currentStep++;
                setAnimatedLevel(startLevel + currentStep);

                if (currentStep >= steps) {
                    clearInterval(interval);
                }
            }, stepDuration);

            return () => clearInterval(interval);
        }
    }, [isVisible, newLevel, previousLevel]);

    if (!newLevel) return null;

    const tier = getTier(newLevel);
    const animatedTier = getTier(animatedLevel);
    const medal = getMedalForLevel(newLevel);
    const previousTierObj = getTier(previousLevel);
    const isNewTier = tier.name !== previousTierObj.name;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className={styles.modal}
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0, y: 50 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className={styles.closeBtn} onClick={onClose}>
                            <FiX />
                        </button>

                        {/* Confetti effect */}
                        <div className={styles.confetti}>
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className={styles.confettiPiece}
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        background: tier.color,
                                        animationDelay: `${Math.random() * 0.5}s`
                                    }}
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 200, opacity: [0, 1, 0] }}
                                    transition={{ duration: 2, delay: Math.random() * 0.5 }}
                                />
                            ))}
                        </div>

                        {/* Avatar with Badge */}
                        <motion.div
                            className={styles.avatarSection}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                        >
                            <div
                                className={styles.avatarWrapper}
                                style={{ '--glow-color': animatedTier.color }}
                            >
                                <Avatar
                                    skinTone={avatarSkinTone}
                                    gender={avatarGender}
                                    size="large"
                                />

                                {/* Profile Medal Badge - TOP RIGHT (nova medalha conquistada) */}
                                {medal && (
                                    <motion.div
                                        className={styles.profileMedalBadge}
                                        style={{
                                            background: medal.color,
                                            color: '#1a1a2e'
                                        }}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 1.2, type: 'spring', stiffness: 300 }}
                                    >
                                        {medal.emoji}
                                    </motion.div>
                                )}

                                {/* Level Badge - BOTTOM RIGHT */}
                                <motion.div
                                    className={styles.levelBadge}
                                    style={{ background: animatedTier.color }}
                                    key={animatedLevel}
                                    initial={{ scale: 1.3 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 500 }}
                                >
                                    {animatedLevel}
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            className={styles.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            Level Up!
                        </motion.h2>

                        {/* Level Display with Animation */}
                        <motion.div
                            className={styles.levelDisplay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <span className={styles.levelFrom}>{previousLevel}</span>
                            <span className={styles.levelArrow}>→</span>
                            <span
                                className={styles.levelTo}
                                style={{ color: tier.color }}
                            >
                                {newLevel}
                            </span>
                        </motion.div>

                        {/* Tier Info */}
                        <motion.div
                            className={styles.tierInfo}
                            style={{ color: tier.color }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            {tier.emoji} {tier.name}
                        </motion.div>

                        {/* New Tier Unlock */}
                        {isNewTier && (
                            <motion.div
                                className={styles.newTier}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                🎉 Novo tier desbloqueado!
                            </motion.div>
                        )}

                        {/* Medal Unlock */}
                        {medal && (
                            <motion.div
                                className={styles.medalUnlock}
                                style={{ '--medal-color': medal.color }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <FiAward className={styles.medalIcon} />
                                <div>
                                    <span className={styles.medalLabel}>Medalha Desbloqueada!</span>
                                    <span className={styles.medalName}>
                                        {medal.emoji} {medal.name}
                                    </span>
                                </div>
                            </motion.div>
                        )}

                        {/* XP Info */}
                        {xpGained && (
                            <motion.div
                                className={styles.xpInfo}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                <FiStar /> +{xpGained} XP
                            </motion.div>
                        )}

                        {/* Continue Button */}
                        <motion.button
                            className={styles.continueBtn}
                            style={{ background: tier.color }}
                            onClick={onClose}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Continuar
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
