'use client';

import { motion } from 'framer-motion';
import { FiWifi, FiCreditCard } from 'react-icons/fi';
import styles from './CreditCard.module.css';

export default function CreditCard({
    name = 'Meu Cartão',
    brand = 'VISA',
    lastFourDigits = '0000',
    creditLimit = 0,
    availableLimit = 0,
    closingDay = 1,
    dueDay = 10,
    color = '#1a1a2e',
    holderName = 'NOME DO TITULAR',
    validThru = '12/28',
    onClick,
}) {
    const usedPercent = creditLimit > 0
        ? ((creditLimit - availableLimit) / creditLimit) * 100
        : 0;
    const usedAmount = creditLimit - availableLimit;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    // Determine gradient based on color
    const getGradient = () => {
        const hue = parseInt(color.substring(1), 16);
        return `linear-gradient(135deg, ${color} 0%, ${color}dd 50%, ${color}aa 100%)`;
    };

    // Brand logos
    const renderBrandLogo = () => {
        switch (brand.toUpperCase()) {
            case 'VISA':
                return <span className={styles.visaLogo}>VISA</span>;
            case 'MASTERCARD':
                return (
                    <div className={styles.mastercardLogo}>
                        <div className={styles.mcCircle} style={{ background: '#EB001B' }} />
                        <div className={styles.mcCircle} style={{ background: '#F79E1B' }} />
                    </div>
                );
            case 'ELO':
                return <span className={styles.brandText}>elo</span>;
            case 'AMEX':
                return <span className={styles.brandText}>AMEX</span>;
            default:
                return <FiCreditCard className={styles.brandIcon} />;
        }
    };

    return (
        <motion.div
            className={styles.cardWrapper}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
        >
            <div
                className={styles.card}
                style={{ background: getGradient() }}
            >
                {/* Card Pattern Overlay */}
                <div className={styles.pattern} />

                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.bankName}>{name}</span>
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
                    <span>{usedPercent.toFixed(0)}% utilizado</span>
                    <span>Fecha dia {closingDay} • Vence dia {dueDay}</span>
                </div>
            </div>
        </motion.div>
    );
}
