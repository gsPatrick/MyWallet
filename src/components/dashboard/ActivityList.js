'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiClock, FiCheckCircle, FiXCircle, FiArrowRight, FiRepeat } from 'react-icons/fi';
import { dashboardAPI } from '@/services/api';
import styles from './ActivityList.module.css';

/**
 * Widget de Transações Recentes
 * Exibe transações manuais com detalhes completos
 */
export default function ActivityList() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTransactions = async () => {
            try {
                const { data } = await dashboardAPI.getRecentTransactions();
                setTransactions(data || []);
            } catch (error) {
                console.error('Error loading transactions', error);
            } finally {
                setLoading(false);
            }
        };

        loadTransactions();
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'INCOME':
                return <FiTrendingUp className={styles.iconIncome} />;
            case 'EXPENSE':
                return <FiTrendingDown className={styles.iconExpense} />;
            case 'INTERNAL_TRANSFER':
                return <FiRepeat className={styles.iconTransfer} />;
            default:
                return <FiArrowRight className={styles.iconTransfer} />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'COMPLETED':
                return <span className={`${styles.badge} ${styles.badgeCompleted}`}><FiCheckCircle /> Realizada</span>;
            case 'PENDING':
                return <span className={`${styles.badge} ${styles.badgePending}`}><FiClock /> Futura</span>;
            case 'CANCELLED':
                return <span className={`${styles.badge} ${styles.badgeCancelled}`}><FiXCircle /> Cancelada</span>;
            default:
                return null;
        }
    };

    const getTypeName = (type) => {
        switch (type) {
            case 'INCOME': return 'Receita';
            case 'EXPENSE': return 'Despesa';
            case 'TRANSFER': return 'Transferência';
            case 'INTERNAL_TRANSFER': return 'Transferência Interna';
            default: return type;
        }
    };

    if (loading) return <div className={styles.loading}>Carregando transações...</div>;

    if (transactions.length === 0) {
        return (
            <div className={styles.empty}>
                <FiClock />
                <span>Nenhuma transação recente</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Atividades Recentes</h3>
            </div>
            <div className={styles.list}>
                {transactions.slice(0, 10).map((transaction) => (
                    <motion.div
                        key={transaction.id}
                        className={styles.item}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className={styles.icon}>
                            {getTypeIcon(transaction.type)}
                        </div>
                        <div className={styles.content}>
                            <div className={styles.mainRow}>
                                <span className={styles.description}>{transaction.description}</span>
                                <span className={`${styles.amount} ${transaction.type === 'INCOME' ? styles.amountIncome : styles.amountExpense}`}>
                                    {transaction.type === 'INCOME' ? '+' : '-'} {formatCurrency(transaction.amount)}
                                </span>
                            </div>
                            <div className={styles.detailsRow}>
                                <span className={styles.typeLabel}>{getTypeName(transaction.type)}</span>
                                {transaction.category && (
                                    <span className={styles.category}>
                                        {transaction.category.icon && <span>{transaction.category.icon}</span>}
                                        {transaction.category.name}
                                    </span>
                                )}
                                {getStatusBadge(transaction.status)}
                            </div>
                        </div>
                        <span className={styles.time}>
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
