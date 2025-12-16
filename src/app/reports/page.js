'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiPieChart, FiTrendingUp, FiDollarSign, FiActivity, FiArrowUp, FiArrowDown, FiLoader
} from 'react-icons/fi';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatters';
import { reportsAPI } from '@/services/api';
import styles from './page.module.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function ReportsPage() {
    const [summaryData, setSummaryData] = useState(null);
    const [evolutionData, setEvolutionData] = useState([]);
    const [dividendsData, setDividendsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [portfolioRes, evolutionRes, dividendsRes] = await Promise.all([
                reportsAPI.getPortfolio(),
                reportsAPI.getEvolution(),
                reportsAPI.getDividends()
            ]);
            setSummaryData(portfolioRes);
            setEvolutionData(evolutionRes || []);
            setDividendsData(dividendsRes);
        } catch (error) {
            console.error("Erro ao carregar relatórios:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderLoading = () => (
        <div className={styles.loadingContainer}>
            <FiLoader className={styles.spinner} />
            <p>Gerando relatórios...</p>
        </div>
    );

    if (isLoading) return (
        <div className={styles.pageWrapper}>
            <Header />
            <main className={styles.main}>{renderLoading()}</main>
            <Dock />
        </div>
    );

    // Prepare data for charts
    const allocationData = summaryData?.allocation ? Object.entries(summaryData.allocation).map(([key, value]) => ({
        name: key,
        value: parseFloat(value)
    })) : [];

    // Fallback if empty to avoid broken charts
    const hasAllocation = allocationData.length > 0;
    const safeAllocationData = hasAllocation ? allocationData : [{ name: 'Sem dados', value: 100 }];
    const allocationColors = hasAllocation ? COLORS : ['#e5e7eb'];

    const hasEvolution = evolutionData && evolutionData.length > 0;

    return (
        <div className={styles.pageWrapper}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    <motion.div
                        className={styles.header}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1>Relatórios e Análises</h1>
                        <p>Visão detalhada do seu patrimônio</p>
                    </motion.div>

                    {/* Summary Cards */}
                    <motion.div
                        className={styles.summaryGrid}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className={styles.summaryCard}>
                            <div className={styles.cardHeader}>
                                <span>Patrimônio Total</span>
                                <FiDollarSign className={styles.cardIcon} style={{ color: '#6366f1' }} />
                            </div>
                            <div className={styles.cardValue}>
                                {formatCurrency(summaryData?.summary?.totalCurrentValue || 0)}
                            </div>
                            {summaryData?.summary?.totalProfitPercent !== 0 && (
                                <div className={`${styles.cardTrend} ${summaryData?.summary?.totalProfitPercent >= 0 ? styles.positive : styles.negative}`}>
                                    {summaryData?.summary?.totalProfitPercent >= 0 ? <FiArrowUp /> : <FiArrowDown />}
                                    {Math.abs(summaryData?.summary?.totalProfitPercent || 0).toFixed(2)}%
                                </div>
                            )}
                        </Card>

                        <Card className={styles.summaryCard}>
                            <div className={styles.cardHeader}>
                                <span>Total Investido</span>
                                <FiActivity className={styles.cardIcon} style={{ color: '#10b981' }} />
                            </div>
                            <div className={styles.cardValue}>
                                {formatCurrency(summaryData?.summary?.totalCost || 0)}
                            </div>
                            <div className={styles.cardTrend}>
                                <span className={styles.neutral}>Custo de Aquisição</span>
                            </div>
                        </Card>

                        <Card className={styles.summaryCard}>
                            <div className={styles.cardHeader}>
                                <span>Proventos Recebidos</span>
                                <FiPieChart className={styles.cardIcon} style={{ color: '#f59e0b' }} />
                            </div>
                            <div className={styles.cardValue}>
                                {formatCurrency(dividendsData?.total || 0)}
                            </div>
                            <div className={styles.cardTrend}>
                                <span className={styles.neutral}>Total Histórico</span>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Charts Row */}
                    <div className={styles.chartsRow}>
                        {/* Allocation Chart */}
                        <motion.div
                            className={styles.chartCol}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className={styles.chartCard} title="Alocação por Classe">
                                <div className={styles.chartContainer}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={safeAllocationData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {safeAllocationData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={allocationColors[index % allocationColors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => hasAllocation ? `${value.toFixed(2)}%` : ''} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Evolution Chart */}
                        <motion.div
                            className={styles.chartCol}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className={styles.chartCard} title="Evolução Patrimonial">
                                <div className={styles.chartContainer}>
                                    {hasEvolution ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={evolutionData}>
                                                <defs>
                                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                                <XAxis
                                                    dataKey="date"
                                                    tickFormatter={(str) => new Date(str).toLocaleDateString('pt-BR', { month: 'short' })}
                                                    stroke="#9ca3af"
                                                    fontSize={12}
                                                />
                                                <YAxis
                                                    stroke="#9ca3af"
                                                    fontSize={12}
                                                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                                                />
                                                <Tooltip
                                                    contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }}
                                                    formatter={(value) => formatCurrency(value)}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="#6366f1"
                                                    fillOpacity={1}
                                                    fill="url(#colorValue)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className={styles.emptyChart}>
                                            <FiTrendingUp className={styles.emptyIcon} />
                                            <p>Sem dados de evolução temporal</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Dock />
        </div>
    );
}
