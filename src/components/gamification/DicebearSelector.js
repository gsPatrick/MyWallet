'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './DicebearSelector.module.css';

const SKIN_TONES = {
    'f9c9b6': 'Branco',
    'ac6651': 'Pardo Claro',
    '8d5524': 'Pardo',
    '3c2e18': 'Negro',
    'ffdbac': 'Claro'
};

const BACKGROUND_COLORS = {
    'b6e3f4': 'Azul',
    'ffd5dc': 'Rosa',
    'd1d4f9': 'Roxo',
    'c0aede': 'Lilás',
    'ffdfbf': 'Laranja',
    'transparent': 'Transparente'
};

const GENDERS = {
    'masculino': 'Masculino',
    'feminino': 'Feminino'
};

const MASCULINE_HAIR = ['mrT', 'dougFunny', 'mrClean', 'dannyPhantom', 'fonze', 'halfShaved'];
const FEMININE_HAIR = ['full', 'pixie', 'turban'];

export default function DicebearSelector({ value, onChange }) {
    // Parse existing URL or set defaults
    const [seed, setSeed] = useState(() => Math.random().toString(36).substring(7));
    const [skinTone, setSkinTone] = useState('f9c9b6');
    const [bgColor, setBgColor] = useState('b6e3f4');
    const [gender, setGender] = useState('masculino');
    
    // We maintain a stable hair option so it doesn't change wildly when changing color
    const [hairOption, setHairOption] = useState('fonze');

    useEffect(() => {
        if (value && value.includes('dicebear.com')) {
            try {
                const url = new URL(value);
                const params = new URLSearchParams(url.search);
                if (params.get('seed')) setSeed(params.get('seed'));
                if (params.get('baseColor')) setSkinTone(params.get('baseColor'));
                if (params.get('backgroundColor')) setBgColor(params.get('backgroundColor'));
                
                const hair = params.get('hair');
                if (hair) {
                    setHairOption(hair);
                    if (FEMININE_HAIR.includes(hair)) {
                        setGender('feminino');
                    } else {
                        setGender('masculino');
                    }
                }
            } catch (e) {
                // Invalid URL
            }
        }
    }, [value]);

    const generateUrl = (newSeed, newSkinTone, newBgColor, newHairOption) => {
        let url = `https://api.dicebear.com/9.x/micah/svg?seed=${newSeed}&radius=50`;
        if (newSkinTone) url += `&baseColor=${newSkinTone}`;
        if (newBgColor && newBgColor !== 'transparent') url += `&backgroundColor=${newBgColor}`;
        if (newHairOption) url += `&hair=${newHairOption}`;
        return url;
    };

    const handleSeedChange = () => {
        const newSeed = Math.random().toString(36).substring(7);
        const newHairArray = gender === 'masculino' ? MASCULINE_HAIR : FEMININE_HAIR;
        const randomHair = newHairArray[Math.floor(Math.random() * newHairArray.length)];
        
        setSeed(newSeed);
        setHairOption(randomHair);
        onChange(generateUrl(newSeed, skinTone, bgColor, randomHair));
    };

    const handleSkinToneChange = (tone) => {
        setSkinTone(tone);
        onChange(generateUrl(seed, tone, bgColor, hairOption));
    };

    const handleBgColorChange = (color) => {
        setBgColor(color);
        onChange(generateUrl(seed, skinTone, color, hairOption));
    };

    const handleGenderChange = (newGender) => {
        setGender(newGender);
        const newHairArray = newGender === 'masculino' ? MASCULINE_HAIR : FEMININE_HAIR;
        const randomHair = newHairArray[Math.floor(Math.random() * newHairArray.length)];
        setHairOption(randomHair);
        onChange(generateUrl(seed, skinTone, bgColor, randomHair));
    };

    return (
        <div className={styles.selectorContainer}>
            <div className={styles.previewSection}>
                <div className={styles.avatarWrapper}>
                    <img 
                        key={generateUrl(seed, skinTone, bgColor, hairOption)}
                        src={generateUrl(seed, skinTone, bgColor, hairOption)} 
                        alt="Preview do Avatar" 
                        className={styles.avatarPreview}
                        width="140"
                        height="140"
                        onLoad={() => console.log('Avatar loaded')}
                        onError={(e) => {
                            console.error('Avatar load error', e);
                            e.target.src = `https://api.dicebear.com/9.x/initials/svg?seed=${seed}`;
                        }}
                    />
                </div>
                <button type="button" className={styles.randomizeBtn} onClick={handleSeedChange}>
                    🎲 Sortear Rosto
                </button>
            </div>

            <div className={styles.optionsSection}>
                <div className={styles.optionGroup}>
                    <label>Identificação Visual</label>
                    <div className={styles.buttonGroup}>
                        {Object.entries(GENDERS).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                className={`${styles.optionBtn} ${gender === key ? styles.active : ''}`}
                                onClick={() => handleGenderChange(key)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.optionGroup}>
                    <label>Tom de Pele</label>
                    <div className={styles.buttonGroup}>
                        {Object.entries(SKIN_TONES).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                className={`${styles.optionBtn} ${skinTone === key ? styles.active : ''}`}
                                onClick={() => handleSkinToneChange(key)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.optionGroup}>
                    <label>Cor de Fundo</label>
                    <div className={styles.colorGroup}>
                        {Object.entries(BACKGROUND_COLORS).map(([key, label]) => (
                            <div
                                key={key}
                                className={`${styles.colorCircle} ${bgColor === key ? styles.activeColor : ''}`}
                                style={{ backgroundColor: key === 'transparent' ? '#f1f5f9' : `#${key}` }}
                                title={label}
                                onClick={() => handleBgColorChange(key)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
