import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiArrowUpCircle, FiArrowDownCircle, FiAlertCircle } from 'react-icons/fi';
import Modal from '@/components/ui/Modal';
import { goalsAPI } from '@/services/api';
import styles from './GoalHistoryModal.module.css';

export default function GoalHistoryModal({ isOpen, onClose, goal }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && goal) {
            fetchHistory();
        }
    }, [isOpen, goal]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await goalsAPI.getHistory(goal.id);
            setHistory(data);
        } catch (err) {
            console.error(err);
            setError('Erro ao carregar histórico.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Histórico: ${goal?.name || ''}`}
            size="md"
        >
            <div className={styles.container}>
                {loading ? (
                    <div className={styles.loading}>Carregando...</div>
                ) : error ? (
                    <div className={styles.error}>
                        <FiAlertCircle />
                        <span>{error}</span>
                    </div>
                ) : history.length === 0 ? (
                    <div className={styles.empty}>
                        <FiCalendar />
                        <p>Nenhuma transação registrada ainda.</p>
                    </div>
                ) : (
                    <div className={styles.timeline}>
                        {history.map((item, index) => (
                            <motion.div
                                key={item.id}
                                className={styles.timelineItem}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className={styles.iconWrapper}>
                                    {item.type === 'DEPOSIT' ? (
                                        <FiArrowUpCircle className={styles.depositIcon} />
                                    ) : (
                                        <FiArrowDownCircle className={styles.withdrawIcon} />
                                    )}
                                </div>
                                <div className={styles.content}>
                                    <div className={styles.header}>
                                        <span className={styles.type}>
                                            {item.type === 'DEPOSIT' ? 'Depósito' : 'Resgate'}
                                        </span>
                                        <span className={styles.date}>{formatDate(item.date)}</span>
                                    </div>
                                    <div className={styles.amount} style={{ color: item.type === 'DEPOSIT' ? '#22c55e' : '#ef4444' }}>
                                        {item.type === 'DEPOSIT' ? '+' : '-'} {formatCurrency(item.amount)}
                                    </div>
                                    {item.reason && (
                                        <div className={styles.reason}>{item.reason}</div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}
