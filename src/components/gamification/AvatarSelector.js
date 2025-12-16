'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Avatar, { SKIN_TONES, GENDERS, SKIN_TONE_LABELS, GENDER_LABELS } from './Avatar';
import styles from './AvatarSelector.module.css';

export default function AvatarSelector({
    value = { skinTone: 'pardo', gender: 'masculino' },
    onChange,
    showLabels = true
}) {
    const [selectedSkinTone, setSelectedSkinTone] = useState(value.skinTone);
    const [selectedGender, setSelectedGender] = useState(value.gender);

    const handleChange = (skinTone, gender) => {
        setSelectedSkinTone(skinTone);
        setSelectedGender(gender);
        onChange?.({ skinTone, gender });
    };

    return (
        <div className={styles.selector}>
            {/* Current Selection */}
            <div className={styles.current}>
                <Avatar
                    skinTone={selectedSkinTone}
                    gender={selectedGender}
                    size="large"
                />
                {showLabels && (
                    <p className={styles.currentLabel}>
                        {SKIN_TONE_LABELS[selectedSkinTone]} • {GENDER_LABELS[selectedGender]}
                    </p>
                )}
            </div>

            {/* Skin Tone Options */}
            <div className={styles.optionGroup}>
                <label className={styles.groupLabel}>Tom de Pele</label>
                <div className={styles.options}>
                    {SKIN_TONES.map((tone) => (
                        <button
                            key={tone}
                            type="button"
                            className={`${styles.optionBtn} ${selectedSkinTone === tone ? styles.active : ''}`}
                            onClick={() => handleChange(tone, selectedGender)}
                        >
                            {SKIN_TONE_LABELS[tone]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Gender Options */}
            <div className={styles.optionGroup}>
                <label className={styles.groupLabel}>Gênero</label>
                <div className={styles.options}>
                    {GENDERS.map((gender) => (
                        <button
                            key={gender}
                            type="button"
                            className={`${styles.optionBtn} ${selectedGender === gender ? styles.active : ''}`}
                            onClick={() => handleChange(selectedSkinTone, gender)}
                        >
                            {GENDER_LABELS[gender]}
                        </button>
                    ))}
                </div>
            </div>

            {/* All Avatars Preview */}
            <div className={styles.preview}>
                <label className={styles.groupLabel}>Todas as Variações</label>
                <div className={styles.avatarGrid}>
                    {SKIN_TONES.map((tone) =>
                        GENDERS.map((gender) => (
                            <motion.div
                                key={`${tone}-${gender}`}
                                className={`${styles.avatarItem} ${selectedSkinTone === tone && selectedGender === gender ? styles.selected : ''}`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleChange(tone, gender)}
                            >
                                <Avatar skinTone={tone} gender={gender} size="small" />
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
