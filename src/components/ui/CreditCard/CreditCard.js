'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiWifi, FiCreditCard } from 'react-icons/fi';
import styles from './CreditCard.module.css';

export default function CreditCard({
    name = 'Meu Cartão',
    brand = 'VISA',
    lastFourDigits = '0000',
    creditLimit = 0,
    availableLimit = 0,
    blockedLimit = 0,
    closingDay = 1,
    dueDay = 10,
    color = '#1a1a2e',
    holderName = 'NOME DO TITULAR',
    validThru = '12/28',
    icon = null, // New prop for bank logo
    brandIcon = null, // New prop for brand logo (e.g. Visa, Mastercard)
    onClick,
}) {
    const [iconError, setIconError] = useState(false);

    const usedAmount = Math.round((creditLimit - availableLimit - blockedLimit) * 100) / 100;
    const usedPercent = creditLimit > 0
        ? Math.round((usedAmount / creditLimit) * 100)
        : 0;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    // Check if color is light (needs dark text)
    const isLightColor = (hexColor) => {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.6;
    };

    const textColor = isLightColor(color) ? '#1a1a2e' : 'white';

    // Determine gradient based on color
    const getGradient = () => {
        return `linear-gradient(135deg, ${color} 0%, ${color}dd 50%, ${color}aa 100%)`;
    };

    // Brand logos
    const renderBrandLogo = () => {
        // Local Brand Icons Dictionary for better reliability
        const brandIcons = {
            'VISA': 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg',
            'MASTERCARD': 'https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg',
            'ELO': 'https://upload.wikimedia.org/wikipedia/commons/0/03/Elo_logo.svg',
            'AMEX': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg',
            'HIPERCARD': 'https://upload.wikimedia.org/wikipedia/commons/8/89/Hipercard_logo.svg',
            'DINERS': 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Diners_Club_Logo3.svg'
        };

        const currentIcon = brandIcon || brandIcons[brand.toUpperCase()];

        if (currentIcon && (currentIcon.startsWith('http') || currentIcon.startsWith('/'))) {
            return (
                <img
                    src={currentIcon}
                    alt={brand}
                    className={styles.brandImage}
                    style={{
                        height: '24px',
                        objectFit: 'contain',
                        filter: brand.toUpperCase() === 'MASTERCARD' ? 'none' : 
                                (brand.toUpperCase() === 'VISA' && textColor === 'white' ? 'brightness(0) invert(1)' : 'none')
                    }}
                />
            );
        }

        switch (brand.toUpperCase()) {
            case 'VISA':
                return <span className={styles.visaLogo}>VISA</span>;
            case 'MASTERCARD':
                return <span className={styles.brandText}>Mastercard</span>;
            case 'ELO':
                return <span className={styles.brandText}>elo</span>;
            default:
                return <FiCreditCard className={styles.brandIcon} />;
        }
    };

    // Determine if we should show the icon image or fallback to text
    const showIconImage = icon && (icon.startsWith('http') || icon.startsWith('/')) && !iconError;

    return (
        <motion.div
            className={styles.cardWrapper}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
        >
            <div
                className={styles.card}
                style={{ background: getGradient(), color: textColor }}
            >
                {/* Card Pattern Overlay */}
                <div className={styles.pattern} />

                {/* Header */}
                <div className={styles.header}>
                    {showIconImage ? (
                        <img
                            src={icon}
                            alt={name}
                            className={styles.bankLogoImg}
                            style={{
                                height: '24px',
                                objectFit: 'contain',
                                filter: textColor === 'white' ? 'brightness(0) invert(1)' : 'none'
                            }}
                            onError={() => setIconError(true)}
                        />
                    ) : (
                        <span className={styles.bankName}>{name}</span>
                    )}
                    <FiWifi className={styles.contactlessIcon} />
                </div>

                {/* Chip */}
                <div className={styles.chip}>
                    <div className={styles.chipLines}>
                        <span /><span /><span /><span />
                    </div>
                </div>

                {/* Card Number */}
                <div className={styles.cardNumber}>
                    <span className={styles.dots}>••••</span>
                    <span className={styles.dots}>••••</span>
                    <span className={styles.dots}>••••</span>
                    <span className={styles.lastDigits}>{lastFourDigits}</span>
                </div>

                {/* Bottom Section */}
                <div className={styles.bottom}>
                    <div className={styles.holderInfo}>
                        <div className={styles.labelGroup}>
                            <span className={styles.label}>TITULAR</span>
                            <span className={styles.value}>{holderName}</span>
                        </div>
                        <div className={styles.labelGroup}>
                            <span className={styles.label}>VALIDADE</span>
                            <span className={styles.value}>{validThru}</span>
                        </div>
                    </div>
                    {renderBrandLogo()}
                </div>
            </div>

            {/* Card Info Panel */}
            <div className={styles.infoPanel}>
                <div className={styles.limitSection}>
                    <div className={styles.limitRow}>
                        <span className={styles.limitLabel}>Limite Total</span>
                        <span className={styles.limitValue}>{formatCurrency(creditLimit)}</span>
                    </div>
                    <div className={styles.limitRow}>
                        <span className={styles.limitLabel}>Disponível</span>
                        <span className={`${styles.limitValue} ${styles.available}`}>{formatCurrency(availableLimit)}</span>
                    </div>
                    <div className={styles.limitRow}>
                        <span className={styles.limitLabel}>Bloqueado</span>
                        <span className={`${styles.limitValue} ${styles.blocked}`}>{formatCurrency(blockedLimit)}</span>
                    </div>
                    <div className={styles.limitRow}>
                        <span className={styles.limitLabel}>Utilizado</span>
                        <span className={`${styles.limitValue} ${styles.used}`}>{formatCurrency(usedAmount)}</span>
                    </div>
                </div>

                {/* Usage Bar */}
                <div className={styles.usageBar}>
                    <div
                        className={styles.usageFill}
                        style={{ width: `${usedPercent}%` }}
                    />
                </div>
                <div className={styles.usageInfo}>
                    <span>{usedPercent}% utilizado</span>
                    <span>Fecha dia {closingDay} • Vence dia {dueDay}</span>
                </div>
            </div>
        </motion.div>
    );
}
