'use client';

import { useState } from 'react';
import { LevelUpModal } from '@/components/gamification';
import styles from './page.module.css';

export default function LevelUpTestPage() {
    const [showModal, setShowModal] = useState(false);
    const [level, setLevel] = useState(10);
    const [previousLevel, setPreviousLevel] = useState(1);

    const testCases = [
        { prev: 1, new: 10, label: '1 → 10', hasMedal: true },
        { prev: 15, new: 20, label: '15 → 20', hasMedal: true },
        { prev: 22, new: 25, label: '22 → 25', hasMedal: true },
        { prev: 45, new: 50, label: '45 → 50', hasMedal: true },
        { prev: 65, new: 70, label: '65 → 70', hasMedal: true },
        { prev: 95, new: 100, label: '95 → 100', hasMedal: true },
        { prev: 5, new: 7, label: '5 → 7', hasMedal: false },
        { prev: 30, new: 35, label: '30 → 35', hasMedal: false },
        { prev: 55, new: 60, label: '55 → 60', hasMedal: false },
        { prev: 85, new: 90, label: '85 → 90', hasMedal: false },
    ];

    const handleTest = (testCase) => {
        setPreviousLevel(testCase.prev);
        setLevel(testCase.new);
        setShowModal(true);
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>🎮 Level Up Animation Test</h1>
            <p className={styles.subtitle}>Clique para ver a animação do nível subindo</p>

            <div className={styles.buttonGrid}>
                {testCases.map((tc, idx) => (
                    <button
                        key={idx}
                        className={styles.levelButton}
                        onClick={() => handleTest(tc)}
                    >
                        {tc.label}
                        {tc.hasMedal && (
                            <span className={styles.medalTag}>🏅 Medalha</span>
                        )}
                    </button>
                ))}
            </div>

            <div className={styles.info}>
                <h3>✨ O que acontece:</h3>
                <ul>
                    <li>📸 Mostra o Avatar do usuário</li>
                    <li>🔢 Nível sobe animado do anterior ao novo</li>
                    <li>🏅 Medalha aparece ao lado (se tiver)</li>
                    <li>🎨 Cor muda conforme o tier do nível</li>
                </ul>

                <h3 style={{ marginTop: '1rem' }}>🏆 Medalhas por Nível:</h3>
                <ul>
                    <li>🥉 Nível 10 - Bronze</li>
                    <li>🥈 Nível 20 - Prata</li>
                    <li>🥇 Nível 25 - Ouro</li>
                    <li>💎 Nível 50 - Platina</li>
                    <li>💠 Nível 70 - Diamante</li>
                    <li>👑 Nível 100 - Mestre Supremo</li>
                </ul>
            </div>

            <LevelUpModal
                isVisible={showModal}
                onClose={() => setShowModal(false)}
                newLevel={level}
                previousLevel={previousLevel}
                xpGained={Math.floor(100 * Math.pow(level, 1.5))}
                avatarSkinTone="pardo"
                avatarGender="masculino"
                displayBadge={{ emoji: '🥇', name: 'Ouro' }}
            />
        </div>
    );
}
