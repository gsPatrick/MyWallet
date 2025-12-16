'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiPlus } from 'react-icons/fi';
import MedalDetailModal from './MedalDetailModal';
import styles from './FeaturedMedals.module.css';

const rarityColors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF'
};

export default function FeaturedMedals({ medals = [], allMedals = [], onEdit }) {
    const [selectedMedal, setSelectedMedal] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Get full medal data from allMedals
    const featuredMedals = medals
        .map(medalId => allMedals.find(m => m.id === medalId))
        .filter(Boolean)
        .slice(0, 5);

    const handleMedalClick = (medal) => {
        setSelectedMedal(medal);
        setShowModal(true);
    };

    const emptySlots = 5 - featuredMedals.length;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Medalhas em Destaque</h3>
                {onEdit && (
                    <button className={styles.editBtn} onClick={onEdit}>
                        Editar
                    </button>
                )}
            </div>

            <div className={styles.medalsRow}>
                {featuredMedals.map((medal, index) => (
                    <motion.div
                        key={medal.id}
                        className={styles.medalSlot}
                        style={{ '--color': rarityColors[medal.rarity] }}
                        onClick={() => handleMedalClick(medal)}
                        whileHover={{ scale: 1.1, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className={styles.medalIcon}>
                            <FiAward />
                        </div>
                        <div className={styles.tooltip}>{medal.name}</div>
                    </motion.div>
                ))}

                {/* Empty slots */}
                {[...Array(emptySlots)].map((_, index) => (
                    <motion.div
                        key={`empty-${index}`}
                        className={`${styles.medalSlot} ${styles.empty}`}
                        onClick={onEdit}
                        whileHover={{ scale: 1.05 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: (featuredMedals.length + index) * 0.1 }}
                    >
                        <FiPlus />
                    </motion.div>
                ))}
            </div>

            <MedalDetailModal
                medal={selectedMedal}
                isVisible={showModal}
                onClose={() => setShowModal(false)}
            />
        </div>
    );
}
