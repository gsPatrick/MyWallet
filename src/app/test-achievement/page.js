'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiPlay, FiRefreshCw } from 'react-icons/fi';
import {
    Avatar,
    MedalCard,
    AchievementAnimation,
    SKIN_TONES,
    GENDERS,
    SKIN_TONE_LABELS,
    GENDER_LABELS
} from '@/components/gamification';
import styles from './page.module.css';

// Sample medals for testing
const sampleMedals = [
    {
        id: 1,
        code: '10k_club',
        name: '10K Club',
        description: 'Alcance R$ 10.000 em patrimônio',
        rarity: 'bronze',
        xpReward: 50
    },
    {
        id: 2,
        code: '50k_club',
        name: '50K Club',
        description: 'Alcance R$ 50.000 em patrimônio',
        rarity: 'silver',
        xpReward: 100
    },
    {
        id: 3,
        code: '100k_club',
        name: '100K Club',
        description: 'Alcance R$ 100.000 em patrimônio',
        rarity: 'gold',
        xpReward: 200
    },
    {
        id: 4,
        code: '500k_club',
        name: 'Meio Milhão',
        description: 'Alcance R$ 500.000 em patrimônio',
        rarity: 'platinum',
        xpReward: 500
    },
    {
        id: 5,
        code: 'millionaire',
        name: 'Milionário',
        description: 'Alcance R$ 1.000.000 em patrimônio',
        rarity: 'diamond',
        xpReward: 1000
    }
];

export default function TestAchievementPage() {
    const [selectedMedal, setSelectedMedal] = useState(sampleMedals[2]);
    const [showAnimation, setShowAnimation] = useState(false);
    const [selectedSkinTone, setSelectedSkinTone] = useState('pardo');
    const [selectedGender, setSelectedGender] = useState('masculino');

    const triggerAnimation = () => {
        setShowAnimation(true);
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <motion.h1
                    className={styles.title}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    🎮 Teste de Gamificação
                </motion.h1>

                {/* Avatar Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Avatares</h2>
                    <p className={styles.sectionDesc}>10 variações: 5 tons de pele × 2 gêneros</p>

                    <div className={styles.avatarDemo}>
                        {/* Current Avatar Large */}
                        <div className={styles.currentAvatar}>
                            <Avatar
                                skinTone={selectedSkinTone}
                                gender={selectedGender}
                                size="xlarge"
                            />
                            <p>{SKIN_TONE_LABELS[selectedSkinTone]} • {GENDER_LABELS[selectedGender]}</p>
                        </div>

                        {/* Selectors */}
                        <div className={styles.selectors}>
                            <div className={styles.selectorGroup}>
                                <label>Tom de Pele</label>
                                <div className={styles.options}>
                                    {SKIN_TONES.map((tone) => (
                                        <button
                                            key={tone}
                                            className={`${styles.optionBtn} ${selectedSkinTone === tone ? styles.active : ''}`}
                                            onClick={() => setSelectedSkinTone(tone)}
                                        >
                                            {SKIN_TONE_LABELS[tone]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.selectorGroup}>
                                <label>Gênero</label>
                                <div className={styles.options}>
                                    {GENDERS.map((gender) => (
                                        <button
                                            key={gender}
                                            className={`${styles.optionBtn} ${selectedGender === gender ? styles.active : ''}`}
                                            onClick={() => setSelectedGender(gender)}
                                        >
                                            {GENDER_LABELS[gender]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* All Avatars Grid */}
                        <div className={styles.avatarGrid}>
                            {SKIN_TONES.map((tone) =>
                                GENDERS.map((gender) => (
                                    <div
                                        key={`${tone}-${gender}`}
                                        className={styles.avatarItem}
                                        onClick={() => {
                                            setSelectedSkinTone(tone);
                                            setSelectedGender(gender);
                                        }}
                                    >
                                        <Avatar skinTone={tone} gender={gender} size="medium" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* Medals Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Medalhas</h2>
                    <p className={styles.sectionDesc}>5 raridades: Bronze, Prata, Ouro, Platina, Diamante</p>

                    <div className={styles.medalsGrid}>
                        {sampleMedals.map((medal, index) => (
                            <MedalCard
                                key={medal.id}
                                medal={medal}
                                isComplete={index < 2}
                                progress={index === 2 ? 75 : index === 3 ? 30 : 0}
                                isLocked={index > 3}
                                onClick={() => setSelectedMedal(medal)}
                            />
                        ))}
                    </div>
                </section>

                {/* Achievement Animation Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Animação de Conquista</h2>
                    <p className={styles.sectionDesc}>Clique para testar a animação de desbloqueio</p>

                    <div className={styles.animationTest}>
                        <div className={styles.selectedMedal}>
                            <FiAward className={styles.medalPreviewIcon} />
                            <div>
                                <strong>{selectedMedal.name}</strong>
                                <span>Raridade: {selectedMedal.rarity}</span>
                            </div>
                        </div>

                        <button className={styles.triggerBtn} onClick={triggerAnimation}>
                            <FiPlay /> Testar Animação
                        </button>
                    </div>
                </section>

                {/* Back Link */}
                <a href="/dashboard" className={styles.backLink}>
                    ← Voltar ao Dashboard
                </a>
            </div>

            {/* Achievement Animation */}
            <AchievementAnimation
                medal={selectedMedal}
                isVisible={showAnimation}
                onClose={() => setShowAnimation(false)}
                autoClose={true}
                autoCloseDelay={6000}
            />
        </div>
    );
}
