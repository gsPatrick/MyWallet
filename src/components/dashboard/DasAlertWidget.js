'use client';

/**
 * DAS Alert Widget
 * ========================================
 * Widget para o dashboard de perfis BUSINESS
 * Mostra alertas de DAS atrasado ou próximo vencimento
 * ========================================
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiClock, FiArrowRight } from 'react-icons/fi';
import { useProfiles } from '@/contexts/ProfileContext';
import { dasAPI } from '@/services/api';
import styles from './DasAlertWidget.module.css';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

export default function DasAlertWidget() {
    const router = useRouter();
    const { activeProfile } = useProfiles();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    const isBusinessProfile = activeProfile?.type === 'BUSINESS';

    useEffect(() => {
        if (!isBusinessProfile) {
            setLoading(false);
            return;
        }

        const loadSummary = async () => {
            try {
                const data = await dasAPI.getSummary();
                setSummary(data);
            } catch (err) {
                console.error('Erro ao carregar resumo DAS:', err);
            } finally {
                setLoading(false);
            }
        };

        loadSummary();
    }, [isBusinessProfile]);

    // Don't render for non-business profiles
    if (!isBusinessProfile) return null;

    // Don't render while loading or if no summary
    if (loading || !summary || (!summary.overdueCount && !summary.nextDue)) return null;

    const hasOverdue = summary.overdueCount > 0;
    const daysUntilDue = summary.nextDue
        ? Math.ceil((new Date(summary.nextDue.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

    // Only show if overdue or due within 7 days
    const showUrgent = hasOverdue || (daysUntilDue !== null && daysUntilDue <= 7);
    if (!showUrgent) return null;

    return (
        <motion.div
            className={`${styles.widget} ${hasOverdue ? styles.overdue : styles.upcoming}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push('/business/das')}
        >
            <div className={styles.icon}>
                {hasOverdue ? <FiAlertCircle /> : <FiClock />}
            </div>
            <div className={styles.content}>
                {hasOverdue ? (
                    <>
                        <span className={styles.title}>
                            {summary.overdueCount} DAS atrasado{summary.overdueCount > 1 ? 's' : ''}
                        </span>
                        <span className={styles.subtitle}>Regularize para evitar multas</span>
                    </>
                ) : (
                    <>
                        <span className={styles.title}>
                            DAS de {summary.nextDue.monthName} vence {daysUntilDue === 0 ? 'hoje' : `em ${daysUntilDue} dias`}
                        </span>
                        <span className={styles.subtitle}>
                            {formatDate(summary.nextDue.dueDate)} • {formatCurrency(summary.nextDue.value)}
                        </span>
                    </>
                )}
            </div>
            <div className={styles.action}>
                <FiArrowRight />
            </div>
        </motion.div>
    );
}
