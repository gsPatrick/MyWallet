'use client';

import {
    FiAward, FiLock, FiStar, FiCalendar, FiZap, FiTarget,
    FiCheckCircle, FiPieChart, FiTrendingUp, FiDollarSign,
    FiFlag, FiDisc, FiHexagon
} from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa'; // Using FontAwesome for Crown if FiCrown missing, or just map key
import styles from './MedalCard.module.css';

const iconMap = {
    'star': <FiStar />,
    'calendar': <FiCalendar />,
    'award': <FiAward />,
    'crown': <FaCrown />, // or FiDisc if FaCrown unavailable, let's stick to Fi if possible or use generic
    'zap': <FiZap />,
    'target': <FiTarget />,
    'check-circle': <FiCheckCircle />,
    'pie-chart': <FiPieChart />,
    'trending-up': <FiTrendingUp />,
    'dollar-sign': <FiDollarSign />,
    'flag': <FiFlag />,
    'medal': <FiDisc />, // Approximation
    'diamond': <FiHexagon /> // Approximation
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
                    (icon && typeof icon !== 'string') ? icon : (
                        icon && iconMap[icon] ? (
                            <span className={styles.medalIcon}>{iconMap[icon]}</span>
                        ) : (
                            icon ? <span className={styles.medalIcon}>{icon}</span> : <FiAward className={styles.medalIcon} />
                        )
                    )
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
