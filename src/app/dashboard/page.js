'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FiTrendingUp, FiTrendingDown, FiClock, FiAlertTriangle,
    FiLink, FiCreditCard, FiPlus, FiPieChart, FiCalendar, FiDollarSign,
    FiHome, FiTarget, FiCheckCircle, FiBarChart2, FiLoader
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import { usePrivateCurrency } from '@/components/ui/PrivateValue';
import { formatDate } from '@/utils/formatters';
import { mockBudget, mockTransactions } from '@/utils/mockData';
import { reportsAPI, openFinanceAPI, transactionsAPI } from '@/services/api';
import styles from './page.module.css';

const mockAllocation = [
    { id: 1, name: 'Gastos Essenciais', percent: 50, color: '#ef4444', spent: 4200 },
    { id: 2, name: 'Gastos Pessoais', percent: 20, color: '#f59e0b', spent: 1800 },
    { id: 3, name: 'Investimentos', percent: 15, color: '#22c55e', spent: 1500 },
    { id: 4, name: 'Reserva', percent: 10, color: '#3b82f6', spent: 1000 },
    { id: 5, name: 'Lazer', percent: 5, color: '#8b5cf6', spent: 350 },
];

const dateFilters = [
    { id: 'today', label: 'Hoje' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mês' },
    { id: 'year', label: 'Ano' },
    { id: 'custom', label: 'Período' },
];

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState('geral');
    const [dateFilter, setDateFilter] = useState('month');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customDate, setCustomDate] = useState({ start: '', end: '' });
    const [chartType, setChartType] = useState('pie'); // pie or bar

    // Privacy-aware currency formatting
    const { formatCurrency, formatPercent } = usePrivateCurrency();

    // API Data States
    const [portfolioData, setPortfolioData] = useState(null);
    const [openFinanceAccounts, setOpenFinanceAccounts] = useState([]);
    const [openFinanceCards, setOpenFinanceCards] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [portfolioRes, accountsRes, cardsRes, transactionsRes] = await Promise.all([
                reportsAPI.getPortfolio(),
                openFinanceAPI.listAccounts().catch(() => []),
                openFinanceAPI.listCards().catch(() => ({ data: [] })),
                transactionsAPI.list({ startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] }) // Current month defaults
            ]);
            setPortfolioData(portfolioRes);
            setOpenFinanceAccounts(accountsRes?.data || accountsRes || []);
            setOpenFinanceCards(cardsRes?.data || []);
            setTransactions(transactionsRes?.data?.transactions || transactionsRes || []);
        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const summary = portfolioData?.summary || { totalCurrentValue: 0, totalProfit: 0, totalProfitPercent: 0, totalCost: 0 };
    const positions = portfolioData?.positions || [];

    const openFinanceTotal = openFinanceAccounts.reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
    const totalBalance = summary.totalCurrentValue + openFinanceTotal;
    const patrimonioTotal = totalBalance;

    // Calculate OF entries/exits from transactions with source='OPEN_FINANCE'
    const ofTransactions = transactions.filter(t => t.source === 'OPEN_FINANCE');
    const ofIncome = ofTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount), 0);
    const ofExpenses = ofTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(t.amount), 0);

    // Real Data for Budget/Transactions Tab
    const income = 0; // Budget limit not yet fetched, could fetch budgetAPI if needed

    // Calculate totals from transactions
    const monthlyIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount), 0);
    const monthlyExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(t.amount), 0);

    // Calculate allocation from transactions
    const expensesByCategory = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
            return acc;
        }, {});

    const allocationData = Object.entries(expensesByCategory).map(([name, spent], index) => ({
        id: index,
        name,
        spent,
        percent: monthlyExpenses > 0 ? Math.round((spent / monthlyExpenses) * 100) : 0,
        color: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'][index % 6]
    })).sort((a, b) => b.spent - a.spent);

    // Use actual data - show empty state when no data
    const displayAllocation = allocationData;
    const hasAllocationData = allocationData.length > 0;

    const getDateLabel = () => dateFilters.find(f => f.id === dateFilter)?.label || 'Mês';

    if (isLoading) {
        return (
            <div className={styles.page}>
                <Header />
                <main className={`${styles.main} ${styles.loadingState}`}>
                    <FiLoader className={styles.spinner} />
                    <p>Carregando visão geral...</p>
                </main>
                <Dock />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                {/* Top Controls */}
                <div className={styles.topControls}>
                    {/* Tabs */}
                    <div className={styles.tabs}>
                        {[
                            { id: 'geral', label: 'Geral', icon: FiHome },
                            { id: 'manual', label: 'Manual', icon: FiDollarSign },
                            { id: 'openfinance', label: 'Open Finance', icon: FiLink },
                            { id: 'investments', label: 'Investimentos', icon: FiTrendingUp }
                        ].map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <Icon />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Date Filter */}
                    <div className={styles.dateFilter}>
                        {dateFilters.map(filter => (
                            <button
                                key={filter.id}
                                className={`${styles.dateBtn} ${dateFilter === filter.id ? styles.active : ''}`}
                                onClick={() => {
                                    setDateFilter(filter.id);
                                    if (filter.id === 'custom') setShowDatePicker(true);
                                }}
                            >
                                {filter.id === 'custom' ? <FiCalendar /> : null}
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Date Picker Modal */}
                {showDatePicker && (
                    <motion.div
                        className={styles.datePickerOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setShowDatePicker(false)}
                    >
                        <motion.div
                            className={styles.datePickerModal}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h4>Selecionar Período</h4>
                            <div className={styles.dateInputs}>
                                <div className={styles.dateInput}>
                                    <label>Data Inicial</label>
                                    <input type="date" value={customDate.start} onChange={e => setCustomDate(prev => ({ ...prev, start: e.target.value }))} />
                                </div>
                                <div className={styles.dateInput}>
                                    <label>Data Final</label>
                                    <input type="date" value={customDate.end} onChange={e => setCustomDate(prev => ({ ...prev, end: e.target.value }))} />
                                </div>
                            </div>
                            <div className={styles.datePickerActions}>
                                <button onClick={() => setShowDatePicker(false)}>Cancelar</button>
                                <button className={styles.primary} onClick={() => setShowDatePicker(false)}>Aplicar</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* GERAL TAB */}
                {activeTab === 'geral' && (
                    <>
                        {/* Hero Balance */}
                        <motion.div className={styles.hero} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                            <span className={styles.heroLabel}>Patrimônio Total</span>
                            <span className={styles.heroValue}>{formatCurrency(patrimonioTotal)}</span>
                            <span className={styles.heroPeriod}>Contas + Investimentos</span>
                        </motion.div>

                        {/* Summary Row */}
                        <motion.div className={styles.summaryRow} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.cardLabel}>Saldo em Contas</span>
                                    <FiDollarSign className={styles.iconPrimary} />
                                </div>
                                <span className={styles.cardValue}>{formatCurrency(openFinanceTotal)}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.cardLabel}>Investimentos</span>
                                    <FiTrendingUp className={styles.iconSuccess} />
                                </div>
                                <span className={`${styles.cardValue} ${styles.profit}`}>{formatCurrency(summary.totalCurrentValue)}</span>
                                <span className={styles.cardNote}>{summary.totalProfitPercent >= 0 ? '+' : ''}{summary.totalProfitPercent.toFixed(2)}%</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.cardLabel}>Receita ({getDateLabel()})</span>
                                    <FiTrendingUp className={styles.iconSuccess} />
                                </div>
                                <span className={styles.cardValue}>{formatCurrency(monthlyIncome)}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.cardLabel}>Despesas ({getDateLabel()})</span>
                                    <FiTrendingDown className={styles.iconDanger} />
                                </div>
                                <span className={styles.cardValue}>{formatCurrency(monthlyExpenses)}</span>
                            </div>
                        </motion.div>

                        {/* Bottom Grid - Charts + Quick View */}
                        <motion.div className={styles.geralGrid} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            {/* Chart Card with Toggle */}
                            <div className={styles.allocationCard}>
                                <div className={styles.allocationHeader}>
                                    <h3>Alocação do Orçamento</h3>
                                    <div className={styles.chartToggle}>
                                        <button
                                            className={`${styles.chartBtn} ${chartType === 'pie' ? styles.active : ''}`}
                                            onClick={() => setChartType('pie')}
                                            title="Gráfico Pizza"
                                        >
                                            <FiPieChart />
                                        </button>
                                        <button
                                            className={`${styles.chartBtn} ${chartType === 'bar' ? styles.active : ''}`}
                                            onClick={() => setChartType('bar')}
                                            title="Gráfico Barras"
                                        >
                                            <FiBarChart2 />
                                        </button>
                                    </div>
                                </div>

                                {/* Pie Chart View */}
                                {chartType === 'pie' && (
                                    <div className={styles.pieChartContainer}>
                                        <div className={styles.pieChart}>
                                            {/* SVG Pie representation */}
                                            <svg viewBox="0 0 100 100" className={styles.pieSvg}>
                                                {hasAllocationData ? (
                                                    (() => {
                                                        let accumulated = 0;
                                                        return displayAllocation.map(a => {
                                                            const startAngle = (accumulated / 100) * 360;
                                                            accumulated += a.percent;
                                                            const endAngle = (accumulated / 100) * 360;
                                                            const largeArc = a.percent > 50 ? 1 : 0;
                                                            const startX = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                                                            const startY = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                                                            const endX = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                                                            const endY = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                                                            return (
                                                                <path
                                                                    key={a.id}
                                                                    d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
                                                                    fill={a.color}
                                                                    className={styles.pieSlice}
                                                                />
                                                            );
                                                        });
                                                    })()
                                                ) : (
                                                    /* Empty state - gray ring */
                                                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-light)" strokeWidth="8" opacity="0.3" />
                                                )}
                                                <circle cx="50" cy="50" r="20" fill="var(--bg-secondary)" />
                                            </svg>
                                            <div className={styles.pieCenter}>
                                                <span className={styles.pieCenterValue}>{hasAllocationData ? '100%' : '0%'}</span>
                                                <span className={styles.pieCenterLabel}>{hasAllocationData ? 'Alocado' : 'Sem dados'}</span>
                                            </div>
                                        </div>
                                        <div className={styles.pieLegend}>
                                            {hasAllocationData ? (
                                                displayAllocation.map(a => (
                                                    <div key={a.id} className={styles.legendItem}>
                                                        <span className={styles.legendDot} style={{ background: a.color }} />
                                                        <span className={styles.legendName}>{a.name}</span>
                                                        <span className={styles.legendPercent}>{a.percent}%</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className={styles.emptyLegend}>
                                                    <span>Nenhuma transação ainda</span>
                                                    <span className={styles.emptyLegendHint}>Adicione transações para ver a alocação</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Bar Chart View */}
                                {chartType === 'bar' && (
                                    <div className={styles.barChartContainer}>
                                        {hasAllocationData ? (
                                            displayAllocation.map(a => {
                                                const target = a.spent * 1.2;
                                                const pct = (a.spent / target) * 100;
                                                return (
                                                    <div key={a.id} className={styles.barItem}>
                                                        <div className={styles.barLabel}>
                                                            <span className={styles.barDot} style={{ background: a.color }} />
                                                            <span>{a.name}</span>
                                                        </div>
                                                        <div className={styles.barTrack}>
                                                            <div
                                                                className={styles.barFill}
                                                                style={{
                                                                    width: `${Math.min(100, pct)}%`,
                                                                    background: pct > 100 ? '#ef4444' : a.color
                                                                }}
                                                            />
                                                            <div className={styles.barTarget} style={{ left: '100%' }} />
                                                        </div>
                                                        <div className={styles.barValues}>
                                                            <span className={pct > 100 ? styles.overBudget : ''}>{formatCurrency(a.spent)}</span>
                                                            <span className={styles.barTargetValue}>/ {formatCurrency(target)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            /* Empty state - placeholder bars */
                                            <>
                                                {['Gastos Essenciais', 'Gastos Pessoais', 'Investimentos', 'Reserva', 'Lazer'].map((name, i) => (
                                                    <div key={i} className={styles.barItem}>
                                                        <div className={styles.barLabel}>
                                                            <span className={styles.barDot} style={{ background: 'var(--border-light)', opacity: 0.3 }} />
                                                            <span style={{ opacity: 0.4 }}>{name}</span>
                                                        </div>
                                                        <div className={styles.barTrack}>
                                                            {/* Empty bar - no fill */}
                                                        </div>
                                                        <div className={styles.barValues}>
                                                            <span style={{ opacity: 0.4 }}>{formatCurrency(0)}</span>
                                                            <span className={styles.barTargetValue} style={{ opacity: 0.3 }}>/ --</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                )}

                                <Link href="/budget-allocation" className={styles.editLink}>
                                    Editar Alocação →
                                </Link>
                            </div>

                            {/* Quick Actions */}
                            <div className={styles.quickActions}>
                                <h3>Ações Rápidas</h3>
                                <div className={styles.quickGrid}>
                                    <Link href="/transactions" className={styles.quickItem}>
                                        <FiPlus />
                                        <span>Nova Transação</span>
                                    </Link>
                                    <Link href="/investments/create" className={styles.quickItem}>
                                        <FiTrendingUp />
                                        <span>Nova Operação</span>
                                    </Link>
                                    <Link href="/open-finance" className={styles.quickItem}>
                                        <FiLink />
                                        <span>Sincronizar</span>
                                    </Link>
                                    <Link href="/goals" className={styles.quickItem}>
                                        <FiTarget />
                                        <span>Ver Metas</span>
                                    </Link>
                                </div>

                                {/* Quick Stats */}
                                <div className={styles.quickStats}>
                                    <div className={styles.statItem}>
                                        <FiCheckCircle className={styles.statIconSuccess} />
                                        <div>
                                            <span className={styles.statValue}>{openFinanceAccounts.length}</span>
                                            <span className={styles.statLabel}>Bancos conectados</span>
                                        </div>
                                    </div>
                                    <div className={styles.statItem}>
                                        <FiCreditCard className={styles.statIconPrimary} />
                                        <div>
                                            <span className={styles.statValue}>{positions.length}</span>
                                            <span className={styles.statLabel}>Ativos na carteira</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}

                {/* MANUAL TAB */}
                {activeTab === 'manual' && (
                    <>
                        <motion.div className={styles.hero} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                            <span className={styles.heroLabel}>Saldo Líquido Manual</span>
                            <span className={styles.heroValue}>{formatCurrency(monthlyIncome - monthlyExpenses)}</span>
                            <span className={styles.heroPeriod}>{getDateLabel()}</span>
                        </motion.div>

                        <motion.div className={styles.summaryRow} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}><span className={styles.cardLabel}>Receita</span><FiTrendingUp className={styles.iconSuccess} /></div>
                                <span className={styles.cardValue}>{formatCurrency(monthlyIncome)}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}><span className={styles.cardLabel}>Despesas</span><FiTrendingDown className={styles.iconDanger} /></div>
                                <span className={styles.cardValue}>{formatCurrency(monthlyExpenses)}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}><span className={styles.cardLabel}>A Receber</span><FiClock className={styles.iconMuted} /></div>
                                <span className={styles.cardValue}>{formatCurrency(0)}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}><span className={styles.cardLabel}>Contas a Pagar</span><FiAlertTriangle className={styles.iconWarning} /></div>
                                <span className={styles.cardValue}>{formatCurrency(0)}</span>
                            </div>
                        </motion.div>

                        <motion.div className={styles.bottomGrid} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <div className={styles.largeCard}>
                                <h3 className={styles.largeCardTitle}>Fluxo de Caixa</h3>
                                <div className={styles.emptyState}>Gráfico disponível em breve</div>
                            </div>
                            <div className={styles.largeCard}>
                                <h3 className={styles.largeCardTitle}>Atividade Recente</h3>
                                <div className={styles.emptyState}>Nenhuma atividade recente.</div>
                            </div>
                            <div className={styles.actionCard}>
                                <div className={styles.actionCardInner}>
                                    <span className={styles.actionText}>Registre suas transações</span>
                                    <Link href="/transactions" className={styles.actionBtn}><FiPlus />Nova Transação</Link>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}

                {/* OPEN FINANCE TAB */}
                {activeTab === 'openfinance' && (
                    <>
                        <motion.div className={styles.hero} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                            <span className={styles.heroLabel}>Saldo Open Finance</span>
                            <span className={styles.heroValue}>{formatCurrency(openFinanceTotal)}</span>
                            <span className={styles.heroPeriod}>{openFinanceAccounts.length} contas conectadas</span>
                        </motion.div>

                        <motion.div className={styles.summaryRow} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}><span className={styles.cardLabel}>Contas</span><FiLink className={styles.iconPrimary} /></div>
                                <span className={styles.cardValue}>{openFinanceAccounts.length}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}><span className={styles.cardLabel}>Entradas</span><FiTrendingUp className={styles.iconSuccess} /></div>
                                <span className={styles.cardValue}>{formatCurrency(ofIncome)}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}><span className={styles.cardLabel}>Saídas</span><FiTrendingDown className={styles.iconDanger} /></div>
                                <span className={styles.cardValue}>{formatCurrency(ofExpenses)}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}><span className={styles.cardLabel}>Última Sync</span><FiClock className={styles.iconMuted} /></div>
                                <span className={styles.cardValue}>Agora</span>
                            </div>
                        </motion.div>

                        <motion.div className={styles.bottomGrid} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <div className={styles.largeCard}>
                                <h3 className={styles.largeCardTitle}>Movimento Bancário</h3>
                                <div className={styles.emptyState}>Gráfico disponível em breve</div>
                            </div>
                            <div className={styles.largeCard}>
                                <h3 className={styles.largeCardTitle}>Contas Conectadas</h3>
                                {openFinanceAccounts.length > 0 ? (
                                    <div className={styles.accountsList}>
                                        {openFinanceAccounts.map(acc => (
                                            <div key={acc.id} className={styles.accountItem}>
                                                <span className={styles.accName}>{acc.name}</span>
                                                <span className={styles.accInst}>{acc.institution}</span>
                                                <span className={styles.accBalance}>{formatCurrency(acc.balance || 0)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.emptyState}>Nenhuma conta conectada.</div>
                                )}
                            </div>
                            <div className={styles.actionCard}>
                                <div className={styles.actionCardInner}>
                                    <span className={styles.actionText}>Conecte mais contas</span>
                                    <Link href="/open-finance" className={styles.actionBtn}><FiPlus />Conectar Banco</Link>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}

                {/* INVESTMENTS TAB */}
                {activeTab === 'investments' && (
                    <>
                        <motion.div className={styles.hero} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                            <span className={styles.heroLabel}>Patrimônio Investido</span>
                            <span className={styles.heroValue}>{formatCurrency(summary.totalCurrentValue)}</span>
                            <span className={`${styles.heroPeriod} ${summary.totalProfit >= 0 ? styles.profit : styles.loss}`}>
                                {summary.totalProfit >= 0 ? '+' : ''}{formatCurrency(summary.totalProfit)} ({summary.totalProfitPercent.toFixed(2)}%)
                            </span>
                        </motion.div>

                        <motion.div className={styles.summaryRow} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}><span className={styles.cardLabel}>Lucro Total</span><FiTrendingUp className={styles.iconSuccess} /></div>
                                <span className={`${styles.cardValue} ${summary.totalProfit >= 0 ? styles.profit : styles.loss}`}>{formatCurrency(summary.totalProfit)}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}><span className={styles.cardLabel}>Rentabilidade</span><FiPieChart className={styles.iconPrimary} /></div>
                                <span className={`${styles.cardValue} ${summary.totalProfit >= 0 ? styles.profit : styles.loss}`}>
                                    {summary.totalProfitPercent >= 0 ? '+' : ''}{summary.totalProfitPercent.toFixed(2)}%
                                </span>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}><span className={styles.cardLabel}>Total Investido</span><FiTrendingUp className={styles.iconMuted} /></div>
                                <span className={styles.cardValue}>{formatCurrency(summary.totalCost)}</span>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.cardHeader}><span className={styles.cardLabel}>Ativos</span><FiCreditCard className={styles.iconMuted} /></div>
                                <span className={styles.cardValue}>{positions.length}</span>
                            </div>
                        </motion.div>

                        <motion.div className={styles.bottomGrid} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <div className={styles.largeCard}>
                                <h3 className={styles.largeCardTitle}>Evolução Patrimonial</h3>
                                <div className={styles.emptyState}>Gráfico disponível em breve</div>
                            </div>
                            <div className={styles.largeCard}>
                                <h3 className={styles.largeCardTitle}>Posições</h3>
                                {positions.length > 0 ? (
                                    <div className={styles.positionsList}>
                                        {positions.slice(0, 4).map(pos => (
                                            <div key={pos.ticker} className={styles.positionItem}>
                                                <span className={styles.posTicker}>{pos.ticker}</span>
                                                <span className={styles.posValue}>{formatCurrency(pos.currentValue)}</span>
                                                <span className={pos.profitPercent >= 0 ? styles.profit : styles.loss}>
                                                    {pos.profitPercent >= 0 ? '+' : ''}{pos.profitPercent.toFixed(2)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.emptyState}>Nenhuma posição.</div>
                                )}
                            </div>
                            <div className={styles.actionCard}>
                                <div className={styles.actionCardInner}>
                                    <span className={styles.actionText}>Registre operações</span>
                                    <Link href="/investments" className={styles.actionBtn}><FiPlus />Ver Carteira</Link>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </main>

            <Dock />
        </div>
    );
}
