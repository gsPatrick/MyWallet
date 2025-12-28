'use client';

/**
 * Brokers Widget
 * ========================================
 * Widget for displaying brokers and invested values on dashboard
 * Shows portfolio value per broker
 * ========================================
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiPlus, FiChevronRight, FiRefreshCw, FiTrendingUp, FiBriefcase } from 'react-icons/fi';
import { brokersAPI, investmentsAPI } from '@/services/api';
import BROKERS_LIST from '@/data/brokers.json';
import styles from './BankAccountsWidget.module.css'; // Reuse same styles

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

export default function BrokersWidget() {
    const [brokers, setBrokers] = useState([]);
    const [portfolio, setPortfolio] = useState(null);
    const [totalInvested, setTotalInvested] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadBrokers = async () => {
        try {
            setLoading(true);
            console.log('📈 [BROKERS WIDGET] Loading brokers and portfolio...');

            const [brokersResponse, portfolioResponse] = await Promise.all([
                brokersAPI.list(),
                investmentsAPI.getPortfolio().catch(() => ({ summary: { totalCurrentValue: 0 }, positions: [] }))
            ]);

            console.log('📈 [BROKERS WIDGET] Brokers:', brokersResponse);
            console.log('📈 [BROKERS WIDGET] Portfolio:', portfolioResponse);

            const brokersData = brokersResponse?.data || brokersResponse || [];

            // Enrich brokers with static data from dictionary
            const enrichedBrokers = brokersData.map(broker => {
                const staticBroker = BROKERS_LIST.find(
                    b => b.code === broker.code ||
                        b.name?.toLowerCase() === broker.name?.toLowerCase()
                );
                return {
                    ...broker,
                    logoUrl: staticBroker?.logoUrl || broker.logoUrl,
                    color: staticBroker?.color || broker.color
                };
            });

            setBrokers(enrichedBrokers);
            setPortfolio(portfolioResponse);
            setTotalInvested(portfolioResponse?.summary?.totalCurrentValue || 0);
            setError(null);
        } catch (err) {
            console.error('📈 [BROKERS WIDGET] Error loading:', err);
            setError('Erro ao carregar corretoras');
        } finally {
            setLoading(false);
        }
    };

    // Calculate invested amount per broker (simplified - divides equally for now)
    // In a real scenario, you'd filter positions by brokerId
    const getInvestedAmount = (brokerId) => {
        if (!portfolio?.positions || brokers.length === 0) return 0;
        // For now, divide total by number of brokers
        // TODO: Filter positions by brokerId when data is available
        return totalInvested / brokers.length;
    };

    useEffect(() => {
        loadBrokers();
    }, []);

    if (loading) {
        return (
            <div className={styles.widget}>
                <div className={styles.header}>
                    <h3>Minhas Corretoras</h3>
                </div>
                <div className={styles.loading}>
                    <FiRefreshCw className={styles.spinner} />
                    <span>Carregando...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.widget}>
                <div className={styles.header}>
                    <h3>Minhas Corretoras</h3>
                </div>
                <div className={styles.error}>
                    <span>{error}</span>
                    <button onClick={loadBrokers}>Tentar novamente</button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className={styles.widget}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className={styles.header}>
                <h3>Minhas Corretoras</h3>
                <Link href="/brokers" className={styles.viewAll}>
                    Ver tudo <FiChevronRight />
                </Link>
            </div>

            {/* Total Invested */}
            <div className={styles.totalBalance}>
                <span className={styles.totalLabel}>Total Investido</span>
                <span className={styles.totalValue}>{formatCurrency(totalInvested)}</span>
                {portfolio?.summary?.totalProfit && (
                    <span className={styles.reservedBadge} style={{
                        color: portfolio.summary.totalProfit >= 0 ? '#22c55e' : '#ef4444'
                    }}>
                        <FiTrendingUp /> {portfolio.summary.totalProfit >= 0 ? '+' : ''}{formatCurrency(portfolio.summary.totalProfit)}
                    </span>
                )}
            </div>

            {/* Broker List */}
            <div className={styles.accountList}>
                {brokers.length === 0 ? (
                    <div className={styles.empty}>
                        <p>Nenhuma corretora cadastrada</p>
                        <Link href="/brokers?new=true" className={styles.addBtn}>
                            <FiPlus /> Adicionar Corretora
                        </Link>
                    </div>
                ) : (
                    <>
                        {brokers.slice(0, 4).map((broker, index) => {
                            const invested = getInvestedAmount(broker.id);
                            return (
                                <Link
                                    key={broker.id}
                                    href={`/investments?broker=${broker.id}`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <motion.div
                                        className={styles.accountItem}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className={styles.accountInfo}>
                                            {broker.logoUrl ? (
                                                <img
                                                    src={broker.logoUrl}
                                                    alt={broker.name}
                                                    className={styles.bankIcon}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div
                                                    className={styles.bankIconPlaceholder}
                                                    style={{ backgroundColor: broker.color || '#6366f1' }}
                                                >
                                                    <FiBriefcase />
                                                </div>
                                            )}
                                            <div className={styles.accountDetails}>
                                                <span className={styles.bankName}>
                                                    {broker.name}
                                                </span>
                                                <span className={styles.accountType}>
                                                    CORRETORA
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles.balanceColumn}>
                                            <span className={`${styles.balance} ${styles.positive}`}>
                                                {formatCurrency(invested)}
                                            </span>
                                        </div>
                                    </motion.div>
                                </Link>
                            );
                        })}

                        {brokers.length > 4 && (
                            <Link href="/brokers" className={styles.moreAccounts}>
                                +{brokers.length - 4} mais corretoras
                            </Link>
                        )}
                    </>
                )}
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <Link href="/brokers" className={styles.actionBtn}>
                    <FiPlus /> Nova Corretora
                </Link>
                <Link href="/brokers" className={styles.actionBtn}>
                    <FiTrendingUp /> Operar
                </Link>
            </div>
        </motion.div>
    );
}
