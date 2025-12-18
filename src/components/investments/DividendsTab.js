'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiCalendar, FiClock, FiSearch } from 'react-icons/fi';
import { investmentsAPI } from '@/services/api';
import styles from './DividendsTab.module.css';

export default function DividendsTab() {
    const [dividends, setDividends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, MONTH, YEAR

    useEffect(() => {
        const loadDividends = async () => {
            try {
                setLoading(true);
                const { data } = await investmentsAPI.getDividends();
                // Assuming data is array
                setDividends(Array.isArray(data) ? data : data.data || []);
            } catch (error) {
                console.error('Error loading dividends', error);
            } finally {
                setLoading(false);
            }
        };

        loadDividends();
    }, []);

    // Helper to format currency
    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Calculate totals
    const totalReceived = dividends.reduce((sum, d) => sum + parseFloat(d.amount), 0);

    // Group by month
    const groupedByMonth = dividends.reduce((acc, div) => {
        const date = new Date(div.paymentDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[key]) acc[key] = { date: key, total: 0, items: [] };
        acc[key].items.push(div);
        acc[key].total += parseFloat(div.amount);
        return acc;
    }, {});

    const sortedMonths = Object.values(groupedByMonth).sort((a, b) => b.date.localeCompare(a.date));

    if (loading) return <div className={styles.loading}>Carregando proventos...</div>;

    return (
        <div className={styles.container}>
            {/* Summary Cards */}
            <div className={styles.summaryRow}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryHeader}>
                        <span>Total Recebido</span>
                        <FiDollarSign className={styles.iconSuccess} />
                    </div>
                    <span className={styles.summaryValue}>{formatCurrency(totalReceived)}</span>
                    <span className={styles.summaryLabel}>Acumulado Histórico</span>
                </div>
                {/* Future: Add 'Provisionado' (Future Dividends) if API supports it */}
                <div className={styles.summaryCard}>
                    <div className={styles.summaryHeader}>
                        <span>Média Mensal</span>
                        <FiCalendar className={styles.iconPrimary} />
                    </div>
                    <span className={styles.summaryValue}>
                        {formatCurrency(sortedMonths.length > 0 ? totalReceived / sortedMonths.length : 0)}
                    </span>
                    <span className={styles.summaryLabel}>Últimos {sortedMonths.length} meses</span>
                </div>
            </div>

            {/* List */}
            <div className={styles.listContainer}>
                {sortedMonths.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FiDollarSign />
                        <p>Nenhum provento registrado.</p>
                    </div>
                ) : (
                    sortedMonths.map(group => {
                        const [year, month] = group.date.split('-');
                        const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

                        return (
                            <motion.div
                                key={group.date}
                                className={styles.monthGroup}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className={styles.monthHeader}>
                                    <span className={styles.monthTitle}>{monthName}</span>
                                    <span className={styles.monthTotal}>{formatCurrency(group.total)}</span>
                                </div>
                                <div className={styles.dividendList}>
                                    {group.items.map(div => (
                                        <div key={div.id} className={styles.dividendItem}>
                                            <div className={styles.assetInfo}>
                                                <div className={styles.assetIcon}>
                                                    {div.asset?.logoUrl ? (
                                                        <img src={div.asset.logoUrl} alt={div.asset.id} />
                                                    ) : (
                                                        <span>{div.assetId?.[0] || '$'}</span>
                                                    )}
                                                </div>
                                                <div className={styles.assetDetails}>
                                                    <strong>{div.assetId}</strong>
                                                    <span>{formatCurrency(div.amountPerShare)} / cota</span>
                                                </div>
                                            </div>
                                            <div className={styles.dividendValues}>
                                                <span className={styles.totalValue}>{formatCurrency(div.amount)}</span>
                                                <span className={styles.paymentDate}>
                                                    {new Date(div.paymentDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
