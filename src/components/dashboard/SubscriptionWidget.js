'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { subscriptionsAPI } from '@/services/api';
import styles from './SubscriptionWidget.module.css';

export default function SubscriptionWidget() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const loadSubscriptions = async () => {
        try {
            setLoading(true);
            const { data } = await subscriptionsAPI.getUpcoming();
            // Assuming data is array or wrapped
            setSubscriptions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading subscriptions', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const handlePay = async (id, name) => {
        if (!confirm(`Confirmar pagamento de ${name}?`)) return;

        try {
            setProcessingId(id);
            await subscriptionsAPI.markPaid(id, new Date());
            // Remove from list or mark as paid visually
            // Ideally reload or filter out if we only show upcoming pending
            await loadSubscriptions();
        } catch (error) {
            console.error('Error paying subscription', error);
            alert('Erro ao processar pagamento');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className={styles.loading}>Carregando assinaturas...</div>;

    if (subscriptions.length === 0) {
        return (
            <div className={styles.empty}>
                <FiCheckCircle className={styles.successIcon} />
                <span>Tudo em dia!</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Próximas Cobranças</h3>
            </div>
            <div className={styles.list}>
                {subscriptions.slice(0, 5).map((sub) => (
                    <motion.div
                        key={sub.id}
                        className={styles.item}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className={styles.dateBox}>
                            <span className={styles.day}>
                                {new Date(sub.nextBillingDate).getDate()}
                            </span>
                            <span className={styles.month}>
                                {new Date(sub.nextBillingDate).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                            </span>
                        </div>

                        <div className={styles.content}>
                            <span className={styles.name}>{sub.name}</span>
                            <span className={styles.amount}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.amount)}
                            </span>
                        </div>

                        <button
                            className={styles.payBtn}
                            onClick={() => handlePay(sub.id, sub.name)}
                            disabled={processingId === sub.id}
                            title="Marcar como Pago"
                        >
                            {processingId === sub.id ? '...' : 'Pagar'}
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
