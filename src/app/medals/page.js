'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiAward } from 'react-icons/fi';
import { MedalBook, AchievementAnimation } from '@/components/gamification';
import gamificationService from '@/services/gamificationService';
import styles from './page.module.css';

export default function MedalsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [medals, setMedals] = useState([]);
    const [selectedMedal, setSelectedMedal] = useState(null);
    const [showAnimation, setShowAnimation] = useState(false);

    useEffect(() => {
        loadMedals();
    }, []);

    const loadMedals = async () => {
        try {
            // First check for new medals
            await gamificationService.checkMedals();

            // Then load all medals
            const response = await gamificationService.getMedals();
            if (response.success) {
                setMedals(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar medalhas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMedalClick = (medal) => {
        setSelectedMedal(medal);
        if (medal.isComplete) {
            setShowAnimation(true);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.back()}>
                        <FiArrowLeft /> Voltar
                    </button>
                    <div className={styles.titleRow}>
                        <FiAward className={styles.titleIcon} />
                        <h1 className={styles.title}>Minhas Medalhas</h1>
                    </div>
                    <p className={styles.subtitle}>
                        Conquiste medalhas completando objetivos e suba de nível!
                    </p>
                </div>

                {/* Medal Book */}
                <MedalBook
                    medals={medals}
                    onMedalClick={handleMedalClick}
                />
            </div>

            {/* Achievement Animation */}
            {selectedMedal && (
                <AchievementAnimation
                    medal={selectedMedal}
                    isVisible={showAnimation}
                    onClose={() => setShowAnimation(false)}
                    autoClose={true}
                    autoCloseDelay={5000}
                />
            )}
        </div>
    );
}
