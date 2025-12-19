'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX, FiTrendingDown } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import styles from './BudgetExceededModal.module.css';

/**
 * Modal de alerta quando uma transação vai estourar o orçamento
 * Exibe aviso crítico sobre perda de streak
 */
export default function BudgetExceededModal({
    isOpen,
    onClose,
    onConfirm,
    budgetData
}) {
    if (!budgetData) return null;

    const { allocation, spent, newTotal, overAmount } = budgetData;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className={styles.modal}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header com ícone de alerta */}
                        <div className={styles.header}>
                            <div className={styles.iconContainer}>
                                <FiAlertTriangle />
                            </div>
                            <button className={styles.closeBtn} onClick={onClose}>
                                <FiX />
                            </button>
                        </div>

                        {/* Conteúdo */}
                        <div className={styles.content}>
                            <h2>⚠️ Atenção!</h2>
                            <p className={styles.message}>
                                Isso vai <strong>estourar o orçamento</strong> de{' '}
                                <span
                                    className={styles.allocationName}
                                    style={{ color: allocation.color }}
                                >
                                    {allocation.name}
                                </span>.
                            </p>
                            <p className={styles.warning}>
                                Se confirmar, sua <strong>Ofensiva (Streak) será ZERADA</strong>.
                            </p>

                            {/* Estatísticas */}
                            <div className={styles.stats}>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Limite do Orçamento</span>
                                    <span className={styles.statValue}>{formatCurrency(allocation.limit)}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Gasto Atual</span>
                                    <span className={styles.statValue}>{formatCurrency(spent)}</span>
                                </div>
                                <div className={`${styles.statItem} ${styles.danger}`}>
                                    <span className={styles.statLabel}>Novo Total</span>
                                    <span className={styles.statValue}>{formatCurrency(newTotal)}</span>
                                </div>
                                <div className={`${styles.statItem} ${styles.over}`}>
                                    <span className={styles.statLabel}>Acima do Limite</span>
                                    <span className={styles.statValue}>
                                        <FiTrendingDown /> +{formatCurrency(overAmount)}
                                    </span>
                                </div>
                            </div>

                            {/* Progress bar visual */}
                            <div className={styles.progressContainer}>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{
                                            width: `${Math.min(100, (spent / allocation.limit) * 100)}%`,
                                            background: allocation.color
                                        }}
                                    />
                                    <div
                                        className={styles.progressOverflow}
                                        style={{
                                            width: `${Math.min(50, (overAmount / allocation.limit) * 100)}%`
                                        }}
                                    />
                                </div>
                                <div className={styles.progressLabels}>
                                    <span>0%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        </div>

                        {/* Ações */}
                        <div className={styles.actions}>
                            <Button variant="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => onConfirm(true)}
                            >
                                Confirmar e Perder Streak
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
