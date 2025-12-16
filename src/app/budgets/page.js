'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiEdit2, FiPieChart, FiTrendingUp, FiShield, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { budgetsAPI } from '@/services/api';
import styles from './page.module.css';

export default function BudgetsPage() {
    const [budget, setBudget] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadBudget = async () => {
            setIsLoading(true);
            try {
                // Assuming budgetsAPI.getCurrent() fetches the current month's budget
                // If API structure differs, we map it here
                const data = await budgetsAPI.getCurrent();
                // Default fallback if API returns null/empty
                const defaultBudget = {
                    incomeActual: 0,
                    incomeExpected: 0,
                    actualExpenses: 0,
                    spendingLimit: 0,
                    recommendedInvestment: 0,
                    recommendedEmergencyFund: 0,
                    investPercent: 15, // Default recommendation
                    emergencyPercent: 10,
                    budgetStatus: 'ON_TRACK'
                };
                setBudget(data?.data || defaultBudget);
            } catch (error) {
                console.error("Error loading budget:", error);
                // Fallback to prevent crash
                setBudget({
                    incomeActual: 0,
                    incomeExpected: 0,
                    actualExpenses: 0,
                    spendingLimit: 0,
                    recommendedInvestment: 0,
                    recommendedEmergencyFund: 0,
                    investPercent: 15,
                    emergencyPercent: 10,
                    budgetStatus: 'ON_TRACK'
                });
            } finally {
                setIsLoading(false);
            }
        };
        loadBudget();
    }, []);

    // If loading, show loading text/spinner
    if (isLoading) {
        return (
            <div className={styles.pageWrapper}>
                <Header />
                <main className={styles.main}>
                    <div className={styles.container}>
                        <div className={styles.loadingState}>
                            <p>Carregando orçamento...</p>
                        </div>
                    </div>
                </main>
                <Dock />
            </div>
        );
    }

    // Safely calculate percentages
    const spentPercent = budget && budget.spendingLimit > 0 ? (budget.actualExpenses / budget.spendingLimit) * 100 : 0;
    const incomePercent = budget && budget.incomeExpected > 0 ? (budget.incomeActual / budget.incomeExpected) * 100 : 0;

    return (
        <div className={styles.pageWrapper}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    <motion.div
                        className={styles.pageHeader}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div>
                            <h1 className={styles.pageTitle}>Orçamento</h1>
                            <p className={styles.pageSubtitle}>Dezembro 2024</p>
                        </div>
                        <Button leftIcon={<FiEdit2 />}>Editar Orçamento</Button>
                    </motion.div>

                    {/* Budget Overview */}
                    <motion.div
                        className={styles.overviewGrid}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        {/* Income Card */}
                        <Card className={styles.overviewCard}>
                            <div className={styles.overviewHeader}>
                                <div className={`${styles.overviewIcon} ${styles.income}`}>
                                    <FiDollarSign />
                                </div>
                                <span className={styles.overviewLabel}>Renda</span>
                            </div>
                            <div className={styles.overviewValues}>
                                <span className={styles.actual}>{formatCurrency(budget.incomeActual)}</span>
                                <span className={styles.expected}>de {formatCurrency(budget.incomeExpected)}</span>
                            </div>
                            <div className={styles.progressBar}>
                                <motion.div
                                    className={styles.progressFill}
                                    style={{ background: 'var(--accent-success)' }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(incomePercent, 100)}%` }}
                                    transition={{ duration: 1 }}
                                />
                            </div>
                            <span className={styles.progressLabel}>{incomePercent.toFixed(0)}% recebido</span>
                        </Card>

                        {/* Expenses Card */}
                        <Card className={styles.overviewCard}>
                            <div className={styles.overviewHeader}>
                                <div className={`${styles.overviewIcon} ${styles.expense}`}>
                                    <FiPieChart />
                                </div>
                                <span className={styles.overviewLabel}>Gastos</span>
                            </div>
                            <div className={styles.overviewValues}>
                                <span className={styles.actual}>{formatCurrency(budget.actualExpenses)}</span>
                                <span className={styles.expected}>limite {formatCurrency(budget.spendingLimit)}</span>
                            </div>
                            <div className={styles.progressBar}>
                                <motion.div
                                    className={styles.progressFill}
                                    style={{
                                        background: spentPercent > 100 ? 'var(--accent-danger)' :
                                            spentPercent > 80 ? 'var(--accent-warning)' : 'var(--accent-primary)'
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(spentPercent, 100)}%` }}
                                    transition={{ duration: 1 }}
                                />
                            </div>
                            <span className={styles.progressLabel}>
                                {spentPercent.toFixed(0)}% utilizado • {formatCurrency(budget.spendingLimit - budget.actualExpenses)} disponível
                            </span>
                        </Card>
                    </motion.div>

                    {/* Recommendations */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className={styles.sectionTitle}>Recomendações</h2>
                        <div className={styles.recommendationsGrid}>
                            <Card className={styles.recommendationCard}>
                                <div className={`${styles.recIcon} ${styles.invest}`}>
                                    <FiTrendingUp />
                                </div>
                                <div className={styles.recContent}>
                                    <span className={styles.recLabel}>Investir</span>
                                    <span className={styles.recValue}>{formatCurrency(budget.recommendedInvestment)}</span>
                                    <span className={styles.recPercent}>{budget.investPercent}% da renda</span>
                                </div>
                            </Card>
                            <Card className={styles.recommendationCard}>
                                <div className={`${styles.recIcon} ${styles.emergency}`}>
                                    <FiShield />
                                </div>
                                <div className={styles.recContent}>
                                    <span className={styles.recLabel}>Reserva de Emergência</span>
                                    <span className={styles.recValue}>{formatCurrency(budget.recommendedEmergencyFund)}</span>
                                    <span className={styles.recPercent}>{budget.emergencyPercent}% da renda</span>
                                </div>
                            </Card>
                        </div>
                    </motion.div>

                    {/* Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className={`${styles.statusCard} ${budget.budgetStatus === 'ON_TRACK' ? styles.onTrack : styles.overBudget}`}>
                            <div className={styles.statusContent}>
                                <span className={styles.statusLabel}>Status do Orçamento</span>
                                <span className={styles.statusValue}>
                                    {budget.budgetStatus === 'ON_TRACK' ? <><FiCheck /> Dentro do orçamento</> : <><FiAlertTriangle /> Acima do orçamento</>}
                                </span>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </main>

            <Dock />
        </div>
    );
}
