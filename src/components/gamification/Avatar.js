'use client';

import styles from './Avatar.module.css';

const skinTones = {
    branco: '#FFDFC4',
    pardo: '#D2A679',
    negro: '#8D5524',
    indigena: '#C68642',
    asiatico: '#F1C27D'
};

const genderIcons = {
    masculino: (
        <svg viewBox="0 0 100 100" className={styles.avatarSvg}>
            {/* Head */}
            <circle cx="50" cy="40" r="25" className={styles.head} />
            {/* Body */}
            <path d="M25 90 L30 65 Q50 55 70 65 L75 90" className={styles.body} />
            {/* Hair - short */}
            <path d="M25 35 Q30 15 50 15 Q70 15 75 35" className={styles.hair} />
        </svg>
    ),
    feminino: (
        <svg viewBox="0 0 100 100" className={styles.avatarSvg}>
            {/* Head */}
            <circle cx="50" cy="40" r="25" className={styles.head} />
            {/* Body */}
            <path d="M25 90 L30 65 Q50 55 70 65 L75 90" className={styles.body} />
            {/* Hair - long */}
            <path d="M20 40 Q15 20 50 12 Q85 20 80 40 L80 60 Q70 70 50 70 Q30 70 20 60 Z" className={styles.hairLong} />
        </svg>
    )
};

export default function Avatar({
    skinTone = 'pardo',
    gender = 'masculino',
    size = 'medium',
    className = ''
}) {
    const sizeClasses = {
        small: styles.small,
        medium: styles.medium,
        large: styles.large,
        xlarge: styles.xlarge
    };

    return (
        <div
            className={`${styles.avatar} ${sizeClasses[size]} ${className}`}
            style={{ '--skin-tone': skinTones[skinTone] || skinTones.pardo }}
        >
            {genderIcons[gender] || genderIcons.masculino}
        </div>
    );
}

// Export skin tones and genders for selector
export const SKIN_TONES = Object.keys(skinTones);
export const GENDERS = Object.keys(genderIcons);
export const SKIN_TONE_LABELS = {
    branco: 'Branco',
    pardo: 'Pardo',
    negro: 'Negro',
    indigena: 'Indígena',
    asiatico: 'Asiático'
};
export const GENDER_LABELS = {
    masculino: 'Masculino',
    feminino: 'Feminino'
};
