'use client';

import { motion } from 'framer-motion';
import { FiTarget, FiEdit2, FiTrash2, FiArrowRight } from 'react-icons/fi';
import styles from './BankAccountCard.module.css';

export default function BankAccountCard({
    bankName = 'Banco',
    accountNumber = '00000-0',
    agency = '0000',
    balance = 0,
    reservedAmount = 0,
    color = '#6366f1', // Default accent color
    holderName = 'NOME DO TITULAR',
    icon = null,
    onClick,
    onEdit,
    onDelete,
}) {
    // Calculate percentages for the bar
    const totalFunds = Math.max(parseFloat(balance) || 0, 0);
    const safeReserved = Math.max(parseFloat(reservedAmount) || 0, 0);

    // Avoid division by zero
    const reservedPercent = totalFunds > 0
        ? Math.min((safeReserved / totalFunds) * 100, 100)
        : 0;

    const availableAmount = totalFunds - safeReserved;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value || 0);
    };

    // Use hex to rgba for dim background if needed, but for now just pass as prop
    const accentColor = color || '#6366f1';

    return (
        <motion.div
            className={styles.cardWrapper}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            style={{
                '--accent-color': accentColor,
                '--accent-color-dim': `${accentColor}20` // 20 hex opacity ~ 12%
            }}
        >
            {/* The Visual Widget */}
            <div className={styles.card}>

                {/* Header: Identity */}
                <div className={styles.header}>
                    <div className={styles.bankIdentity}>
                        <div className={styles.bankLogoWrapper}>
                            {icon && (icon.startsWith('http') || icon.startsWith('/')) ? (
                                <img src={icon} alt={bankName} className={styles.bankLogoImg} />
                            ) : (
                                <span className={styles.bankLogoText}>{bankName?.charAt(0)}</span>
                            )}

                        </div>
                        <div className={styles.bankNameGroup}>
                            <span className={styles.bankName}>{bankName}</span>
                            <span className={styles.accountType}>Conta Corrente</span>
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        {onEdit && (
                            <button
                                className={styles.actionBtn}
                                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                title="Editar"
                            >
                                <FiEdit2 />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                className={styles.actionBtn}
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                title="Excluir"
                            >
                                <FiTrash2 />
                            </button>
                        )}
                    </div>
                </div>

                {/* Body: Technical Data */}
                <div className={styles.body}>
                    <div className={styles.accountData}>
                        <div className={styles.dataGroup}>
                            <span className={styles.dataLabel}>Agência</span>
                            <span className={styles.dataValue}>{agency}</span>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.dataGroup}>
                            <span className={styles.dataLabel}>Conta</span>
                            <span className={styles.dataValue}>{accountNumber}</span>
                        </div>

                        {/* Little "Enter" arrow for visual affordance */}
                        <FiArrowRight style={{ marginLeft: 'auto', opacity: 0.4 }} />
                    </div>
                </div>
            </div>

            {/* Info Panel Below Card */}
            <div className={styles.infoPanel}>
                <div className={styles.balanceRow}>
                    <span className={styles.balanceLabel}>Saldo Total</span>
                    <span className={`${styles.balanceValue} ${parseFloat(balance) >= 0 ? styles.positive : styles.negative}`}>
                        {formatCurrency(balance)}
                    </span>
                </div>

                {/* Visual Bar for Reserved Amount */}
                <div className={styles.usageBar}>
                    <div
                        className={styles.usageFill}
                        style={{ width: `${reservedPercent}%` }}
                    />
                </div>

                <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Disponível</span>
                        <span className={styles.detailValue}>
                            {formatCurrency(availableAmount)}
                        </span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Reservado</span>
                        <span className={`${styles.detailValue} ${styles.reserved}`}>
                            {safeReserved > 0 && <FiTarget />}
                            {formatCurrency(safeReserved)}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
