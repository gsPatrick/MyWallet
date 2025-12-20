'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiX, FiCheck, FiAward, FiStar, FiCalendar, FiZap, FiTarget,
    FiCheckCircle, FiPieChart, FiTrendingUp, FiDollarSign,
    FiFlag, FiDisc, FiHexagon
} from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import styles from './FeaturedMedalsSelector.module.css';

const iconMap = {
    'star': <FiStar />,
    'calendar': <FiCalendar />,
    'award': <FiAward />,
    'crown': <FaCrown />,
    'zap': <FiZap />,
    'target': <FiTarget />,
    'check-circle': <FiCheckCircle />,
    'pie-chart': <FiPieChart />,
    'trending-up': <FiTrendingUp />,
    'dollar-sign': <FiDollarSign />,
    'flag': <FiFlag />,
    'medal': <FiDisc />,
    'diamond': <FiHexagon />
};

const rarityColors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF',
    emerald: '#50C878',
    ruby: '#E0115F',
    legendary: '#FF6B35'
};

const rarityLabels = {
    bronze: 'Bronze',
    silver: 'Prata',
    gold: 'Ouro',
    platinum: 'Platina',
    diamond: 'Diamante',
    emerald: 'Esmeralda',
    ruby: 'Rubi',
    legendary: 'Lendário'
};

export default function FeaturedMedalsSelector({
    isVisible,
    onClose,
    allMedals = [],
    selectedMedals = [],
    onSave
}) {
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        setSelected(selectedMedals || []);
    }, [selectedMedals, isVisible]);

    // Only show completed medals
    const completedMedals = allMedals.filter(m => m.isComplete);

    const toggleMedal = (medalId) => {
        if (selected.includes(medalId)) {
            setSelected(selected.filter(id => id !== medalId));
        } else if (selected.length < 5) {
            setSelected([...selected, medalId]);
        }
    };

    const handleSave = () => {
        onSave(selected);
        onClose();
    };

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
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.header}>
                            <h2>Escolha suas Medalhas</h2>
                            <button className={styles.closeBtn} onClick={onClose}>
                                <FiX />
                            </button>
                        </div>

                        <p className={styles.hint}>
                            Selecione até 5 medalhas para destacar no seu perfil ({selected.length}/5)
                        </p>

                        {completedMedals.length === 0 ? (
                            <div className={styles.empty}>
                                <FiAward />
                                <p>Você ainda não conquistou medalhas.</p>
                                <span>Continue usando o app para desbloquear!</span>
                            </div>
                        ) : (
                            <div className={styles.grid}>
                                {completedMedals.map((medal) => {
                                    const isSelected = selected.includes(medal.id);
                                    return (
                                        <motion.div
                                            key={medal.id}
                                            className={`${styles.medalCard} ${isSelected ? styles.selected : ''}`}
                                            style={{ '--color': rarityColors[medal.rarity] }}
                                            onClick={() => toggleMedal(medal.id)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className={styles.medalIcon}>
                                                {iconMap[medal.icon] || <FiAward />}
                                                {isSelected && (
                                                    <div className={styles.checkBadge}>
                                                        <FiCheck />
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.medalInfo}>
                                                <h4>{medal.name}</h4>
                                                <span
                                                    className={styles.rarity}
                                                    style={{ color: rarityColors[medal.rarity] }}
                                                >
                                                    {rarityLabels[medal.rarity]}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        <div className={styles.footer}>
                            <button className={styles.cancelBtn} onClick={onClose}>
                                Cancelar
                            </button>
                            <button
                                className={styles.saveBtn}
                                onClick={handleSave}
                                disabled={selected.length === 0}
                            >
                                Salvar ({selected.length})
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
