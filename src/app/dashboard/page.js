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
import AppShell from '@/components/AppShell';
import { usePrivateCurrency } from '@/components/ui/PrivateValue';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAI } from '@/contexts/AIContext';
import ChatInterface from '@/components/chat/ChatInterface';
import { formatDate } from '@/utils/formatters';
import { reportsAPI, openFinanceAPI, transactionsAPI, authAPI, dashboardAPI, budgetsAPI, brokersAPI } from '@/services/api';
import bankAccountService from '@/services/bankAccountService';
import ActivityList from '@/components/dashboard/ActivityList';
import SubscriptionWidget from '@/components/dashboard/SubscriptionWidget';
import BankAccountsWidget from '@/components/dashboard/BankAccountsWidget';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import BrokersWidget from '@/components/dashboard/BrokersWidget';
import FutureFeatureModal from '@/components/modals/FutureFeatureModal';
import PortfolioTable from '@/components/investments/PortfolioTable';
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
    const { user, updateUser } = useAuth();
    const { currentProfile } = useProfiles();
    const { isOnline } = useNetworkStatus();
    const ai = useAI();

    const [activeTab, setActiveTab] = useState('geral');
    const [dateFilter, setDateFilter] = useState('month');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customDate, setCustomDate] = useState({ start: '', end: '' });
    const [chartType, setChartType] = useState('pie'); // pie or bar
    const [showFutureModal, setShowFutureModal] = useState(false);

    // Privacy-aware currency formatting
    const { formatCurrency, formatPercent } = usePrivateCurrency();

    // API Data States
    const [portfolioData, setPortfolioData] = useState(null);
    const [openFinanceAccounts, setOpenFinanceAccounts] = useState([]);
    const [openFinanceCards, setOpenFinanceCards] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [dashboardSummary, setDashboardSummary] = useState(null);
    const [budgets, setBudgets] = useState([]);
    const [bankAccountsTotal, setBankAccountsTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Broker filter for investments tab
    const [brokersList, setBrokersList] = useState([]);
    const [selectedBrokerFilter, setSelectedBrokerFilter] = useState(null);

    // =============================================
    // OFFLINE MODE: Render Chat instead of Dashboard
    // =============================================
    // NOTE: This check MUST come AFTER all hooks to comply with Rules of Hooks
    // The actual conditional render happens in the return statement below

    useEffect(() => {
        // Only load data if online
        if (isOnline) {
            loadDashboardData();
        }
    }, [currentProfile?.id, isOnline]); // Reload when profile changes or comes back online

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [portfolioRes, accountsRes, cardsRes, transactionsRes, summaryRes, budgetsRes, bankBalanceRes] = await Promise.all([
                reportsAPI.getPortfolio(),
                openFinanceAPI.listAccounts().catch(() => []),
                openFinanceAPI.listCards().catch(() => ({ data: [] })),
                transactionsAPI.list({ startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] }),
                dashboardAPI.getSummary().catch(() => ({})),
                budgetsAPI.getCurrentAllocations().catch(() => ({ data: { allocations: [] } })),
                bankAccountService.getTotalBalance().catch(() => ({ data: { totalBalance: 0 } }))
            ]);
            setPortfolioData(portfolioRes);
            setOpenFinanceAccounts(accountsRes?.data || accountsRes || []);
            setOpenFinanceCards(cardsRes?.data || []);
            setTransactions(transactionsRes?.data?.transactions || transactionsRes || []);
            setDashboardSummary(summaryRes?.data || summaryRes || {});
            setBudgets(budgetsRes?.data?.allocations || budgetsRes?.allocations || []);
            setBankAccountsTotal(bankBalanceRes?.data?.totalBalance || 0);

            // Load brokers list for filter
            try {
                const brokersRes = await brokersAPI.list();
                setBrokersList(brokersRes?.data || brokersRes || []);
            } catch (e) {
                console.error('Error loading brokers:', e);
            }
        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Reload portfolio when broker filter changes
    const loadFilteredPortfolio = async (brokerId) => {
        try {
            const portfolioRes = await reportsAPI.getPortfolio(brokerId || null);
            setPortfolioData(portfolioRes);
        } catch (error) {
            console.error('Error loading filtered portfolio:', error);
        }
    };

    // Handle broker filter change
    const handleBrokerFilterChange = (brokerId) => {
        setSelectedBrokerFilter(brokerId);
        loadFilteredPortfolio(brokerId);
    };

    const summary = portfolioData?.summary || { totalCurrentValue: 0, totalProfit: 0, totalProfitPercent: 0, totalCost: 0 };
    const positions = portfolioData?.positions || [];

    const openFinanceTotal = openFinanceAccounts.reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
    // Use bank accounts total instead of manualTotalBalance for accurate balance
    const totalBalance = summary.totalCurrentValue + openFinanceTotal + bankAccountsTotal;
    const patrimonioTotal = totalBalance;

    // Debug log - remove after testing
    console.log('Dashboard Patrimonio Debug:', {
        investments: summary.totalCurrentValue,
        openFinance: openFinanceTotal,
        bankAccounts: bankAccountsTotal,
        total: patrimonioTotal,
        dashboardSummaryRaw: dashboardSummary
    });

    // Calculate OF entries/exits from transactions with source='OPEN_FINANCE'
    const ofTransactions = transactions.filter(t => t.source === 'OPEN_FINANCE');
    const ofIncome = ofTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount), 0);
    const ofExpenses = ofTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(t.amount), 0);

    // Calculate totals from transactions (COMPLETED only)
    const completedTransactions = transactions.filter(t => t.status !== 'PENDING' && t.status !== 'CANCELLED');
    const monthlyIncome = completedTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount), 0);
    const monthlyExpenses = completedTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(t.amount), 0);

    // Calculate PENDING transactions (scheduled/future)
    const pendingTransactions = transactions.filter(t => t.status === 'PENDING');
    const pendingIncome = pendingTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount), 0);
    const pendingExpenses = pendingTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(t.amount), 0);

    // Calculate allocation from transactions
    const expensesByCategory = completedTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
            return acc;
        }, {});

    // Use budgets for allocation display instead of transaction categories
    // Show budgets with zeroed values (for future implementation)
    const budgetColors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
    const displayAllocation = budgets.map((budget, index) => ({
        id: budget.id || index,
        name: budget.name,
        spent: parseFloat(budget.spent) || 0,
        limit: parseFloat(budget.amount) || 0,
        percent: parseFloat(budget.percentage) || 0,
        color: budget.color || budgetColors[index % budgetColors.length]
    }));
    const hasAllocationData = displayAllocation.length > 0;
    const hasPendingTransactions = pendingTransactions.length > 0;

    const getDateLabel = () => dateFilters.find(f => f.id === dateFilter)?.label || 'Mês';

    if (isLoading) {
        return (
            <AppShell>
                <div className={styles.page}>
                    <Header />
                    <main className={styles.main}>
                        <DashboardSkeleton />
                    </main>
                    <Dock />
                </div>
            </AppShell>
        );
    }

    const TabsComponent = (
        <div className={styles.tabs}>
            {[
                { id: 'geral', label: 'Geral', icon: FiHome },
                { id: 'manual', label: 'Manual', icon: FiDollarSign },
                { id: 'openfinance', label: 'Open Finance', icon: FiLink, isFuture: true },
                { id: 'investments', label: 'Investimentos', icon: FiTrendingUp }
            ].map(tab => {
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        id={`tab-${tab.id}`}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                        onClick={() => {
                            if (tab.isFuture) {
                                setShowFutureModal(true);
                            } else {
                                setActiveTab(tab.id);
                            }
                        }}
                    >
                        <Icon />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );

    // Date filter component for reuse
    const DateFilterComponent = (
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
    );

    // OFFLINE MODE: Render Chat instead of Dashboard
    if (!isOnline) {
        return <ChatInterface onClose={() => { }} isOfflineMode={true} />;
    }

    return (
        <AppShell>
            <div className={styles.page}>
                <Header leftContent={TabsComponent} rightContent={DateFilterComponent} />

                <main className={styles.main}>
                    <FutureFeatureModal
                        isOpen={showFutureModal}
                        onClose={() => setShowFutureModal(false)}
                    />

                    {/* Top Controls - Mobile Only */}
                    <div className={`${styles.topControls} ${styles.mobileOnly}`}>
                        {TabsComponent}
                        {DateFilterComponent}
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
                            {/* Hero Balance - Moved outside grid for full width */}
                            <motion.div id="hero-balance" className={styles.hero} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                <span className={styles.heroLabel}>Patrimônio Total</span>
                                <span className={styles.heroValue}>{formatCurrency(patrimonioTotal)}</span>
                                <span className={styles.heroPeriod}>Contas ({formatCurrency(bankAccountsTotal)}) + Open Finance ({formatCurrency(openFinanceTotal)}) + Investimentos ({formatCurrency(summary.totalCurrentValue)})</span>
                            </motion.div>

                            <div className={styles.dashboardGrid}>
                                {/* LEFT COLUMN: Main Content */}
                                <div className={styles.dashboardMain}>
                                    {/* Summary Grid: 3 Columns (Income, Expenses, Balance) */}
                                    <motion.div className={styles.summaryGrid} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

                                        {/* Column 1: Income */}
                                        <div className={styles.summaryColumn}>
                                            <div className={styles.summaryCard}>
                                                <div className={styles.cardHeader}>
                                                    <span className={styles.cardLabel}>Receita Realizada</span>
                                                    <FiTrendingUp className={styles.iconSuccess} />
                                                </div>
                                                <span className={`${styles.cardValue} ${styles.income}`}>{formatCurrency(monthlyIncome)}</span>
                                            </div>
                                            <div className={`${styles.summaryCard} ${styles.predictionCardBase}`}>
                                                <div className={styles.cardHeader}>
                                                    <span className={styles.cardLabel}>Receita Futura</span>
                                                    <FiClock className={styles.iconSuccess} />
                                                </div>
                                                <span className={`${styles.cardValue} ${styles.income} ${styles.predictionText}`}>{formatCurrency(pendingIncome)}</span>
                                            </div>
                                        </div>

                                        {/* Column 2: Expenses */}
                                        <div className={styles.summaryColumn}>
                                            <div className={styles.summaryCard}>
                                                <div className={styles.cardHeader}>
                                                    <span className={styles.cardLabel}>Despesa Realizada</span>
                                                    <FiTrendingDown className={styles.iconDanger} />
                                                </div>
                                                <span className={`${styles.cardValue} ${styles.expense}`}>{formatCurrency(monthlyExpenses)}</span>
                                            </div>
                                            <div className={`${styles.summaryCard} ${styles.predictionCardBase}`}>
                                                <div className={styles.cardHeader}>
                                                    <span className={styles.cardLabel}>Despesa Futura</span>
                                                    <FiAlertTriangle className={styles.iconWarning} />
                                                </div>
                                                <span className={`${styles.cardValue} ${styles.expense} ${styles.predictionText}`}>{formatCurrency(pendingExpenses)}</span>
                                            </div>
                                        </div>

                                        {/* Column 3: Balance & Results */}
                                        <div className={styles.summaryColumn}>
                                            <div className={styles.summaryCard}>
                                                <div className={styles.cardHeader}>
                                                    <span className={styles.cardLabel}>Saldo Previsto (Final)</span>
                                                    <FiDollarSign className={styles.iconPrimary} />
                                                </div>
                                                <span className={styles.cardValue} style={{ color: (patrimonioTotal + pendingIncome - pendingExpenses) >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                                                    {formatCurrency(totalBalance + pendingIncome - pendingExpenses)}
                                                </span>
                                            </div>
                                            <div className={styles.summaryCard}>
                                                <div className={styles.cardHeader}>
                                                    <span className={styles.cardLabel}>Rentabilidade Carteira</span>
                                                    <FiPieChart className={styles.iconPrimary} />
                                                </div>
                                                <span className={styles.cardValue}>{summary.totalProfitPercent >= 0 ? '+' : ''}{summary.totalProfitPercent.toFixed(2)}%</span>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Chart Card */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
                                                                    <span className={styles.legendValue}>{formatCurrency(a.limit)}</span>
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
                                                            const target = a.limit || 0; // Use budget limit
                                                            const pct = target > 0 ? (a.spent / target) * 100 : 0;
                                                            return (
                                                                <div key={a.id} className={styles.barItem}>
                                                                    <div className={styles.barLabel}>
                                                                        <span className={styles.barDot} style={{ background: a.color }} />
                                                                        <span>{a.name}</span>
                                                                    </div>
                                                                    <div className={styles.barTrack} style={{ background: `${a.color}30` }}>
                                                                        <div
                                                                            className={styles.barFill}
                                                                            style={{
                                                                                width: `${Math.min(100, pct)}%`,
                                                                                background: pct > 100 ? '#ef4444' : a.color
                                                                            }}
                                                                        />
                                                                        <span className={`${styles.barValueInline} ${pct > 100 ? styles.overBudget : ''}`}>
                                                                            {formatCurrency(a.spent)} / {formatCurrency(target)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <>
                                                            {['Gastos Essenciais', 'Gastos Pessoais', 'Investimentos', 'Reserva', 'Lazer'].map((name, i) => (
                                                                <div key={i} className={styles.barItem}>
                                                                    <div className={styles.barLabel}>
                                                                        <span className={styles.barDot} style={{ background: 'var(--border-light)', opacity: 0.3 }} />
                                                                        <span style={{ opacity: 0.4 }}>{name}</span>
                                                                    </div>
                                                                    <div className={styles.barTrack} style={{ background: 'rgba(255,255,255,0.05)' }} />
                                                                    <div className={styles.barValues}>
                                                                        <span style={{ opacity: 0.4 }}>{formatCurrency(0)}</span>
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
                                    </motion.div>
                                </div>

                                {/* RIGHT COLUMN: Sidebar (Bank Accounts) */}
                                <div className={styles.dashboardSidebar}>
                                    {/* Bank Accounts Widget */}
                                    <BankAccountsWidget />
                                </div>
                            </div>
                        </>
                    )}

                    {/* MANUAL TAB */}
                    {/* MANUAL TAB */}
                    {/* MANUAL TAB */}
                    {
                        activeTab === 'manual' && (
                            <>
                                {/* Hero Balance - Moved outside grid for full width */}
                                <motion.div className={styles.hero} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                    <span className={styles.heroLabel}>Saldo Líquido Manual</span>
                                    <span className={styles.heroValue}>{formatCurrency(monthlyIncome - monthlyExpenses)}</span>
                                    <span className={styles.heroPeriod}>Sem Open Finance</span>
                                </motion.div>

                                <div className={styles.dashboardGrid}>
                                    {/* LEFT COLUMN */}
                                    <div className={styles.dashboardMain}>
                                        {/* 3-Col Summary Layout */}
                                        <motion.div className={styles.summaryGrid} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                            {/* Column 1: Income */}
                                            <div className={styles.summaryColumn}>
                                                <div className={styles.summaryCard}>
                                                    <div className={styles.cardHeader}>
                                                        <span className={styles.cardLabel}>Receita Recebida</span>
                                                        <FiTrendingUp className={styles.iconSuccess} />
                                                    </div>
                                                    <span className={`${styles.cardValue} ${styles.income}`}>{formatCurrency(monthlyIncome)}</span>
                                                </div>
                                                <div className={`${styles.summaryCard} ${styles.predictionCardBase}`}>
                                                    <div className={styles.cardHeader}>
                                                        <span className={styles.cardLabel}>Receita Futura</span>
                                                        <FiClock className={styles.iconSuccess} />
                                                    </div>
                                                    <span className={`${styles.cardValue} ${styles.income} ${styles.predictionText}`}>{formatCurrency(pendingIncome)}</span>
                                                </div>
                                            </div>

                                            {/* Column 2: Expenses */}
                                            <div className={styles.summaryColumn}>
                                                <div className={styles.summaryCard}>
                                                    <div className={styles.cardHeader}>
                                                        <span className={styles.cardLabel}>Despesa Paga</span>
                                                        <FiTrendingDown className={styles.iconDanger} />
                                                    </div>
                                                    <span className={`${styles.cardValue} ${styles.expense}`}>{formatCurrency(monthlyExpenses)}</span>
                                                </div>
                                                <div className={`${styles.summaryCard} ${styles.predictionCardBase}`}>
                                                    <div className={styles.cardHeader}>
                                                        <span className={styles.cardLabel}>Conta a Pagar</span>
                                                        <FiAlertTriangle className={styles.iconWarning} />
                                                    </div>
                                                    <span className={`${styles.cardValue} ${styles.expense} ${styles.predictionText}`}>{formatCurrency(pendingExpenses)}</span>
                                                </div>
                                            </div>

                                            {/* Column 3: Balance */}
                                            <div className={styles.summaryColumn}>
                                                <div className={styles.summaryCard}>
                                                    <div className={styles.cardHeader}>
                                                        <span className={styles.cardLabel}>Balanço Real</span>
                                                        <FiDollarSign className={styles.iconPrimary} />
                                                    </div>
                                                    <span className={styles.cardValue}>{formatCurrency(monthlyIncome - monthlyExpenses)}</span>
                                                </div>
                                                <div className={styles.summaryCard}>
                                                    <div className={styles.cardHeader}>
                                                        <span className={styles.cardLabel}>Saldo Previsto</span>
                                                        <FiTarget className={styles.iconPrimary} />
                                                    </div>
                                                    <span className={styles.cardValue}>{formatCurrency((monthlyIncome - monthlyExpenses) + (pendingIncome - pendingExpenses))}</span>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Charts Row */}
                                        <motion.div
                                            className={styles.chartsRow}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <div className={styles.largeCard} style={{ minHeight: '300px' }}>
                                                <h3 className={styles.largeCardTitle}>Fluxo de Caixa</h3>
                                                <div className={styles.emptyState}>Gráfico disponível em breve</div>
                                            </div>
                                            <div className={styles.largeCard} style={{ minHeight: '300px', padding: 0, background: 'transparent', border: 'none' }}>
                                                <ActivityList />
                                            </div>
                                            <div className={styles.largeCard} style={{ minHeight: '300px', padding: 0, background: 'transparent', border: 'none' }}>
                                                <SubscriptionWidget />
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* RIGHT COLUMN: Sidebar */}
                                    <div className={styles.dashboardSidebar}>
                                        {/* Bank Accounts Widget */}
                                        <BankAccountsWidget />
                                    </div>
                                </div>
                            </>
                        )
                    }

                    {/* OPEN FINANCE TAB */}
                    {
                        activeTab === 'openfinance' && (
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
                        )
                    }

                    {/* INVESTMENTS TAB */}
                    {
                        activeTab === 'investments' && (() => {
                            const typeColors = {
                                'STOCK': '#3b82f6',
                                'FII': '#22c55e',
                                'ETF': '#8b5cf6',
                                'BDR': '#f59e0b',
                                'CRYPTO': '#ec4899'
                            };

                            const typeNames = {
                                'STOCK': 'Ações',
                                'FII': 'FIIs',
                                'ETF': 'ETFs',
                                'BDR': 'BDRs',
                                'CRYPTO': 'Cripto'
                            };

                            // Calculate portfolio allocation by asset type
                            const typeAllocation = positions.reduce((acc, pos) => {
                                const type = pos.type || 'STOCK';
                                if (!acc[type]) {
                                    acc[type] = { type, value: 0, count: 0 };
                                }
                                acc[type].value += pos.currentValue || 0;
                                acc[type].count += 1;
                                return acc;
                            }, {});

                            const allocationData = Object.values(typeAllocation)
                                .map(item => ({
                                    ...item,
                                    name: typeNames[item.type] || item.type,
                                    color: typeColors[item.type] || '#6366f1',
                                    percent: summary.totalCurrentValue > 0 ? (item.value / summary.totalCurrentValue) * 100 : 0
                                }))
                                .sort((a, b) => b.value - a.value);

                            return (
                                <>
                                    <motion.div className={styles.hero} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                        <span className={styles.heroLabel}>Patrimônio Investido</span>
                                        <span className={styles.heroValue}>{formatCurrency(summary.totalCurrentValue)}</span>
                                        <span className={`${styles.heroPeriod} ${summary.totalProfit >= 0 ? styles.profit : styles.loss}`}>
                                            {summary.totalProfit >= 0 ? '+' : ''}{formatCurrency(summary.totalProfit)} ({summary.totalProfitPercent.toFixed(2)}%)
                                        </span>
                                    </motion.div>

                                    <div className={styles.dashboardGrid}>
                                        {/* LEFT COLUMN: Main Content */}
                                        <div className={styles.dashboardMain}>
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

                                            {/* Allocation by Type - Bar Chart Style */}
                                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                                <div className={styles.allocationCard}>
                                                    <div className={styles.allocationHeader}>
                                                        <h3>Distribuição por Tipo</h3>
                                                        <select
                                                            className={styles.brokerSelect}
                                                            value={selectedBrokerFilter || ''}
                                                            onChange={(e) => handleBrokerFilterChange(e.target.value || null)}
                                                        >
                                                            <option value="">Todas Corretoras</option>
                                                            {brokersList.map(broker => (
                                                                <option key={broker.id} value={broker.id}>{broker.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    {allocationData.length > 0 ? (
                                                        <div className={styles.barChartContainer}>
                                                            {allocationData.map(a => (
                                                                <div key={a.type} className={styles.barItem}>
                                                                    <div className={styles.barLabel}>
                                                                        <span className={styles.barDot} style={{ background: a.color }} />
                                                                        <span>{a.name} ({a.count})</span>
                                                                    </div>
                                                                    <div className={styles.barTrack} style={{ background: `${a.color}20` }}>
                                                                        <div
                                                                            className={styles.barFill}
                                                                            style={{ width: `${a.percent}%`, background: a.color }}
                                                                        />
                                                                        <span className={styles.barValueInline}>
                                                                            {formatCurrency(a.value)} ({a.percent.toFixed(1)}%)
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className={styles.emptyState}>
                                                            <span>Nenhum ativo cadastrado</span>
                                                            <Link href="/brokers" className={styles.addBtn}><FiPlus /> Ir para Corretoras</Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>

                                            {/* Positions Table */}
                                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                                <div className={styles.largeCard}>
                                                    <h3 className={styles.largeCardTitle}>Carteira de Ativos</h3>
                                                    <PortfolioTable
                                                        positions={positions.slice(0, 8)}
                                                        formatCurrency={formatCurrency}
                                                        onTradeClick={(ticker) => console.log('Trade', ticker)}
                                                    />
                                                    {positions.length > 8 && (
                                                        <div className={styles.tableFooter}>
                                                            <Link href="/brokers" className={styles.viewAllBtn}>
                                                                Ver carteira completa →
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </div>

                                        {/* RIGHT COLUMN: Brokers Sidebar */}
                                        <div className={styles.dashboardSidebar}>
                                            <BrokersWidget />
                                        </div>
                                    </div>
                                </>
                            );
                        })()
                    }
                </main >

                <Dock />
            </div>
        </AppShell>
    );
}
