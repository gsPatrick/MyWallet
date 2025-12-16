'use client';

import { FiAward, FiLock } from 'react-icons/fi';
import styles from './MedalCard.module.css';

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

export default function MedalCard({
    medal,
    isComplete = false,
    progress = 0,
    isLocked = false,
    showProgress = true,
    size = 'medium',
    onClick
}) {
    const { name, description, icon, rarity, xpReward } = medal || {};

    const sizeClasses = {
        small: styles.small,
        medium: styles.medium,
        large: styles.large
    };

    return (
        <div
            className={`${styles.card} ${sizeClasses[size]} ${isComplete ? styles.complete : ''} ${isLocked ? styles.locked : ''}`}
            style={{ '--rarity-color': rarityColors[rarity] || rarityColors.bronze }}
            onClick={onClick}
        >
            {/* Medal Icon */}
            <div className={styles.iconWrapper}>
                {isLocked ? (
                    <FiLock className={styles.lockIcon} />
                ) : (
                    <FiAward className={styles.medalIcon} />
                )}
                {isComplete && <div className={styles.completeBadge}>✓</div>}
            </div>

            {/* Content */}
            <div className={styles.content}>
                <h4 className={styles.name}>{name}</h4>
                <p className={styles.description}>{description}</p>

                {/* Progress Bar */}
                {showProgress && !isComplete && !isLocked && progress > 0 && (
                    <div className={styles.progressWrapper}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                        </div>
                        <span className={styles.progressText}>{Math.round(progress)}%</span>
                    </div>
                )}
            </div>

            {/* Rarity Badge */}
            <div className={styles.rarityBadge}>
                {rarityLabels[rarity]}
            </div>

            {/* XP Reward */}
            {xpReward && (
                <div className={styles.xpBadge}>
                    +{xpReward} XP
                </div>
            )}
        </div>
    );
}
