'use client';

/**
 * Bank Account Detail Page
 * ========================================
 * Shows detailed view of a bank account with tabs:
 * - Resumo (Summary)
 * - Cartões (Cards linked to this account)
 * - Transações (Transaction history)
 * - Metas (Goals linked to this account)
 * ========================================
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiArrowLeft, FiCreditCard, FiActivity, FiTarget, FiDollarSign,
    FiRefreshCw, FiEdit2, FiTrendingUp, FiTrendingDown, FiCalendar,
    FiPieChart, FiClock, FiRepeat, FiCheck, FiLayers, FiAlertCircle, FiHome, FiTrash2, FiEdit, FiPlus, FiDownload, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { formatDate } from '@/utils/formatters';
import { detectBrand } from '@/utils/brandDetection';
import { getBrandIcon } from '@/hooks/useBrandIcon';
import { usePrivateCurrency } from '@/components/ui/PrivateValue';
import txStyles from '@/app/transactions/page.module.css';
import statementStyles from '@/app/settings/statement/page.module.css';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import AppShell from '@/components/AppShell';
import bankAccountService from '@/services/bankAccountService';
import { goalsAPI, cardsAPI, transactionsAPI, reportsAPI } from '@/services/api';
import styles from './page.module.css';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

const tabs = [
    { id: 'summary', label: 'Resumo', icon: FiPieChart },
    { id: 'statement', label: 'Extrato', icon: FiCalendar },
    { id: 'cards', label: 'Cartões', icon: FiCreditCard },
    { id: 'transactions', label: 'Transações', icon: FiActivity },
    { id: 'goals', label: 'Metas', icon: FiTarget }
];

import CardModal from '@/components/modals/CardModal';
import CreditCard from '@/components/ui/CreditCard/CreditCard';

import { 
    ResponsiveContainer, 
    AreaChart, Area, 
    BarChart, Bar, 
    PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

// Componente de Dashboard para a conta
const AccountDashboard = ({ account, statement, transactions, cards }) => {
    const summary = statement?.summary || { openingBalance: 0, totalIncome: 0, totalExpense: 0, closingBalance: 0 };
    
    // Preparar dados para Gráfico de Categorias (Pie)
    const categoryData = transactions.reduce((acc, tx) => {
        if (tx.type === 'EXPENSE') {
            const catName = tx.category?.name || 'Outros';
            const existing = acc.find(item => item.name === catName);
            if (existing) existing.value += tx.amount;
            else acc.push({ name: catName, value: tx.amount });
        }
        return acc;
    }, []).sort((a, b) => b.value - a.value);

    // Preparar dados para Tendência Diária (Area)
    const dailyData = transactions.reduce((acc, tx) => {
        const date = tx.date;
        const existing = acc.find(item => item.date === date);
        if (existing) {
            if (tx.type === 'INCOME') existing.balance += tx.amount;
            else existing.balance -= tx.amount;
        } else {
            acc.push({ date, balance: tx.amount * (tx.type === 'INCOME' ? 1 : -1) });
        }
        return acc;
    }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calcular saldo acumulado para o gráfico
    let runningBalance = summary.openingBalance;
    const balanceTrend = dailyData.map(item => {
        runningBalance += item.balance;
        return {
            date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            saldo: runningBalance
        };
    });

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className={styles.dashboardContainer}>
            {/* Métricas Principais */}
            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Saldo Atual</span>
                    <h3 className={`${styles.metricValue} ${summary.closingBalance >= 0 ? styles.positive : styles.negative}`}>
                        {summary.closingBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h3>
                </div>
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Entradas (Mês)</span>
                    <h3 className={`${styles.metricValue} ${styles.positive}`}>
                        + {summary.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h3>
                </div>
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Saídas (Mês)</span>
                    <h3 className={`${styles.metricValue} ${styles.negative}`}>
                        - {summary.totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h3>
                </div>
                {cards.length > 0 && (
                    <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Uso de Crédito</span>
                        <h3 className={styles.metricValue}>
                            {((cards[0].creditLimit - cards[0].availableLimit) / cards[0].creditLimit * 100).toFixed(0)}%
                        </h3>
                        <div className={styles.progressContainer}>
                            <div 
                                className={styles.progressBar} 
                                style={{ width: `${Math.min(100, (cards[0].creditLimit - cards[0].availableLimit) / cards[0].creditLimit * 100)}%` }} 
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Gráficos */}
            <div className={styles.chartsGrid}>
                {/* Evolução do Saldo */}
                <div className={styles.chartCard}>
                    <h4>Evolução do Saldo</h4>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={balanceTrend}>
                                <defs>
                                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                                <YAxis stroke="#888" fontSize={12} tickFormatter={(val) => `R$ ${val}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                    formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Saldo']}
                                />
                                <Area type="monotone" dataKey="saldo" stroke="#82ca9d" fillOpacity={1} fill="url(#colorSaldo)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gastos por Categoria */}
                <div className={styles.chartCard}>
                    <h4>Gastos por Categoria</h4>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                    formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Total']}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Comparativo Mensal */}
                <div className={styles.chartCard}>
                    <h4>Entradas vs Saídas</h4>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={[
                                { name: 'Mensal', Entradas: summary.totalIncome, Saídas: summary.totalExpense }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                <XAxis dataKey="name" stroke="#888" hide />
                                <YAxis stroke="#888" />
                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                                <Legend />
                                <Bar dataKey="Entradas" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Saídas" fill="#ff8042" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function BankDetailPage() {
    const params = useParams();
    const router = useRouter();
    const accountId = params.id;

    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('summary');
    const [showCardModal, setShowCardModal] = useState(false);
    const { formatCurrency } = usePrivateCurrency();

    // Chart-specific filters
    const [chartFilterType, setChartFilterType] = useState('EXPENSE');
    const [chartFilterStatus, setChartFilterStatus] = useState('all');
    const [allTransactions, setAllTransactions] = useState([]);

    // Tab data
    const [cards, setCards] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loadingTab, setLoadingTab] = useState(false);

    // Statement State
    const [statement, setStatement] = useState(null);
    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

    // Statistics
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        reservedForGoals: 0,
        pendingIncome: 0,
        pendingExpenses: 0
    });

    const loadAccount = useCallback(async () => {
        try {
            setLoading(true);
            const response = await bankAccountService.get(accountId);
            setAccount(response?.data || response);
            setError(null);
        } catch (err) {
            console.error('Erro ao carregar conta:', err);
            setError('Erro ao carregar detalhes da conta');
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    const getBankCards = useCallback((allCards, accountData) => {
        if (!accountData || !allCards) return [];
        return allCards.filter(card => {
            // 1. Vínculo direto por ID
            if (String(card.bankAccountId) === String(accountId)) return true;
            
            // 2. Se já estiver vinculado a OUTRA conta, ignorar
            if (card.bankAccountId && String(card.bankAccountId) !== String(accountId)) return false;
            
            // 3. Fallback por nome para cartões órfãos
            const accName = (accountData.bankName || "").toLowerCase().trim();
            const accNick = (accountData.nickname || "").toLowerCase().trim();
            const cardBank = (card.bankName || card.name || "").toLowerCase().trim();
            
            return (
                (accName && (cardBank.includes(accName) || accName.includes(cardBank))) ||
                (accNick && (cardBank.includes(accNick) || accNick.includes(cardBank)))
            );
        });
    }, [accountId]);

    const loadTabData = useCallback(async (tab) => {
        setLoadingTab(true);
        try {
            // Pre-fetch account if not available
            let currentAccount = account;
            if (!currentAccount) {
                const accRes = await bankAccountService.get(accountId);
                currentAccount = accRes?.data || accRes;
            }

            // Get cards for this bank using unified logic
            const cardsRes = await cardsAPI.list();
            const allCards = cardsRes?.data || [];
            const bankCards = getBankCards(allCards, currentAccount);
            const cardIds = bankCards.map(c => c.id).join(',');

            switch (tab) {
                case 'summary': {
                    // Load data for Dashboard
                    const [txData, goalsData, statementRes] = await Promise.all([
                        transactionsAPI.list({ bankAccountId: accountId, cardIds: cardIds || undefined }),
                        goalsAPI.list(),
                        reportsAPI.getStatement(selectedYear, selectedMonth, accountId, cardIds || undefined)
                    ]);

                    const accountTx = txData?.data?.transactions || txData?.transactions || [];
                    const accountGoals = (goalsData?.data || goalsData || []).filter(
                        g => g.bankAccountId === accountId
                    );

                    setCards(bankCards);
                    setTransactions(accountTx);
                    setStatement(statementRes?.data?.data || statementRes?.data || null);
                    setGoals(accountGoals);
                    break;
                }

                case 'statement': {
                    const { data } = await reportsAPI.getStatement(
                        selectedYear, 
                        selectedMonth, 
                        accountId,
                        cardIds || undefined
                    );
                    setStatement(data.data || { summary: { openingBalance: 0, totalIncome: 0, totalExpense: 0, closingBalance: 0 }, transactions: [] });
                    break;
                }

                case 'cards': {
                    setCards(bankCards);
                    break;
                }

                case 'transactions': {
                    const txRes = await transactionsAPI.list({ 
                        bankAccountId: accountId,
                        cardIds: cardIds || undefined
                    });
                    setTransactions(txRes?.data?.transactions || txRes?.transactions || []);
                    break;
                }

                case 'goals': {
                    const goalsRes = await goalsAPI.list();
                    const linkedGoals = (goalsRes?.data || goalsRes || []).filter(
                        goal => goal.bankAccountId === accountId
                    );
                    setGoals(linkedGoals);
                    break;
                }
            }
        } catch (err) {
            console.error(`Erro ao carregar dados da tab ${tab}:`, err);
        } finally {
            setLoadingTab(false);
        }
    }, [accountId, account, selectedYear, selectedMonth, getBankCards]);

    useEffect(() => {
        if (accountId) {
            loadAccount();
        }
    }, [accountId, loadAccount]);

    useEffect(() => {
        if (account && activeTab) {
            loadTabData(activeTab);
        }
    }, [account, activeTab, loadTabData, selectedYear, selectedMonth]);

    const handleCardSave = () => {
        loadTabData('cards');
        setShowCardModal(false);
    };

    if (loading) {
        return (
            <AppShell>
                <Header />
                <main className={styles.main}>
                    <div className={styles.loading}>
                        <FiRefreshCw className={styles.spinner} />
                        <span>Carregando...</span>
                    </div>
                </main>
                <Dock />
            </AppShell>
        );
    }

    if (error || !account) {
        return (
            <AppShell>
                <Header />
                <main className={styles.main}>
                    <div className={styles.error}>
                        <span>{error || 'Conta não encontrada'}</span>
                        <button onClick={() => router.push('/banks')}>Voltar</button>
                    </div>
                </main>
                <Dock />
            </AppShell>
        );
    }

    const availableBalance = parseFloat(account.balance || 0) - stats.reservedForGoals;

    // --- Statement Helpers ---
    const navigateMonth = (direction) => {
        if (direction === 'prev') {
            if (selectedMonth === 1) {
                setSelectedMonth(12);
                setSelectedYear(y => y - 1);
            } else {
                setSelectedMonth(m => m - 1);
            }
        } else {
            if (selectedMonth === 12) {
                setSelectedMonth(1);
                setSelectedYear(y => y + 1);
            } else {
                setSelectedMonth(m => m + 1);
            }
        }
    };

    const groupedByDate = statement?.transactions?.reduce((acc, t) => {
        const key = t.date;
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
    }, {}) || {};

    const getDayTotal = (transactions) => {
        return transactions.reduce((sum, t) => {
            return sum + (t.type === 'INCOME' ? t.amount : -t.amount);
        }, 0);
    };

    const exportToPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(`Extrato - ${account.nickname || account.bankName}`, 20, 20);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`${MONTHS[selectedMonth - 1]} de ${selectedYear}`, 20, 28);

        let y = 45;
        doc.setFontSize(10);
        doc.setTextColor(60);
        doc.text(`Saldo Anterior: ${formatCurrency(statement?.summary?.openingBalance || 0)}`, 20, y);
        y += 8;
        doc.text(`Entradas: +${formatCurrency(statement?.summary?.totalIncome || 0)}`, 20, y);
        y += 8;
        doc.text(`Saídas: -${formatCurrency(statement?.summary?.totalExpense || 0)}`, 20, y);
        y += 8;
        doc.setFontSize(11);
        doc.text(`Saldo Final: ${formatCurrency(statement?.summary?.closingBalance || 0)}`, 20, y);

        y += 20;

        Object.entries(groupedByDate).forEach(([date, items]) => {
            if (y > 265) { doc.addPage(); y = 20; }

            const dateObj = new Date(date + 'T12:00:00');
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }), 20, y);
            y += 8;

            items.forEach(t => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.setFontSize(9);
                doc.setTextColor(60);
                const time = t.time || '';
                doc.text(`${time}`, 20, y);
                doc.text(t.description.substring(0, 45), 35, y);
                doc.setTextColor(t.type === 'INCOME' ? 34 : 200, t.type === 'INCOME' ? 197 : 80, t.type === 'INCOME' ? 94 : 80);
                doc.text(`${t.type === 'INCOME' ? '+' : '-'}${formatCurrency(t.amount)}`, 155, y);
                y += 6;
            });
            y += 6;
        });

        doc.save(`extrato_${account.bankName}_${selectedYear}_${selectedMonth}.pdf`);
    };
    // -------------------------

    // Charts Logic
    const completedTransactions = allTransactions.filter(t => t.status !== 'PENDING' && t.status !== 'CANCELLED');
    const pendingTransactions = allTransactions.filter(t => t.status === 'PENDING');

    const chartTransactionsSource = chartFilterStatus === 'all'
        ? allTransactions
        : chartFilterStatus === 'COMPLETED'
            ? completedTransactions
            : pendingTransactions;

    const categoryBreakdown = chartTransactionsSource
        .filter(t => t.type === chartFilterType)
        .reduce((acc, tx) => {
            const cat = tx.category || 'Outros';
            acc[cat] = (acc[cat] || 0) + parseFloat(tx.amount);
            return acc;
        }, {});

    const chartTotal = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);

    const categoryChartData = Object.entries(categoryBreakdown)
        .map(([name, value], i) => ({
            name,
            value,
            percent: chartTotal > 0 ? Math.round((value / chartTotal) * 100) : 0,
            color: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'][i % 7]
        }))
        .sort((a, b) => b.value - a.value);

    return (
        <AppShell>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Back Button & Title */}
                    <div className={styles.pageHeader}>
                        <button className={styles.backBtn} onClick={() => router.push('/banks')}>
                            <FiArrowLeft /> Voltar
                        </button>
                    </div>

                    {/* Account Hero */}
                    <motion.div
                        className={styles.heroCard}
                        style={{ '--accent': account.color || '#6366f1' }}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className={styles.heroInfo}>
                            {account.icon ? (
                                <img src={account.icon} alt={account.bankName} className={styles.heroIcon} />
                            ) : (
                                <div className={styles.heroIconPlaceholder} style={{ background: account.color }}>
                                    {account.bankName?.charAt(0)}
                                </div>
                            )}
                            <div className={styles.heroText}>
                                <h1>{account.nickname || account.bankName}</h1>
                                <span className={styles.accountType}>{account.type?.replace('_', ' ')}</span>
                            </div>
                        </div>

                        <div className={styles.heroBalance}>
                            <span className={styles.balanceLabel}>Saldo Total</span>
                            <span className={styles.balanceValue}>{formatCurrency(account.balance)}</span>
                            {stats.reservedForGoals > 0 && (
                                <span className={styles.reservedBadge}>
                                    {formatCurrency(stats.reservedForGoals)} em metas
                                </span>
                            )}
                        </div>
                    </motion.div>

                    {/* Tabs */}
                    <div className={styles.tabsContainer}>
                        <div className={styles.tabs}>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <tab.icon />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            className={styles.tabContent}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {loadingTab ? (
                                <div className={styles.tabLoading}>
                                    <FiRefreshCw className={styles.spinner} />
                                </div>
                            ) : (
                                <>
                                    {/* SUMMARY TAB */}
                                    {activeTab === 'summary' && (
                                        <AccountDashboard 
                                            account={account} 
                                            statement={statement} 
                                            transactions={transactions} 
                                            cards={cards} 
                                        />
                                    )}

                                    {/* STATEMENT TAB */}
                                    {activeTab === 'statement' && (
                                        <div className={statementStyles.page} style={{ padding: 0, minHeight: 'auto', background: 'transparent' }}>
                                            <div className={statementStyles.header} style={{ marginBottom: '1rem' }}>
                                                <div>
                                                    <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Extrato Financeiro</h2>
                                                    <p className={statementStyles.subtitle}>Movimentações detalhadas da sua conta</p>
                                                </div>
                                                <button className={styles.btnSecondary} onClick={exportToPDF}>
                                                    <FiDownload /> Exportar PDF
                                                </button>
                                            </div>

                                            <div className={statementStyles.monthNav}>
                                                <button onClick={() => navigateMonth('prev')} aria-label="Mês anterior">
                                                    <FiChevronLeft />
                                                </button>
                                                <div className={statementStyles.monthDisplay}>
                                                    <span className={statementStyles.monthName}>{MONTHS[selectedMonth - 1]}</span>
                                                    <span className={statementStyles.yearName}>{selectedYear}</span>
                                                </div>
                                                <button onClick={() => navigateMonth('next')} aria-label="Próximo mês">
                                                    <FiChevronRight />
                                                </button>
                                            </div>

                                            <div className={statementStyles.summary}>
                                                <div className={statementStyles.summaryGrid}>
                                                    <div className={statementStyles.summaryItem}>
                                                        <span className={statementStyles.label}>Saldo Anterior</span>
                                                        <span className={statementStyles.value}>{formatCurrency(statement?.summary?.openingBalance || 0)}</span>
                                                    </div>
                                                    <div className={statementStyles.summaryItem}>
                                                        <span className={statementStyles.label}>Total de Entradas</span>
                                                        <span className={`${statementStyles.value} ${statementStyles.credit}`}>+{formatCurrency(statement?.summary?.totalIncome || 0)}</span>
                                                    </div>
                                                    <div className={statementStyles.summaryItem}>
                                                        <span className={statementStyles.label}>Total de Saídas</span>
                                                        <span className={`${statementStyles.value} ${statementStyles.debit}`}>-{formatCurrency(statement?.summary?.totalExpense || 0)}</span>
                                                    </div>
                                                    <div className={statementStyles.summaryItem}>
                                                        <span className={statementStyles.label}>Saldo Final</span>
                                                        <span className={`${statementStyles.value} ${statementStyles.highlight}`}>{formatCurrency(statement?.summary?.closingBalance || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={statementStyles.transactionsList}>
                                                {loadingTab ? (
                                                    <div className={statementStyles.loading}>Carregando extrato...</div>
                                                ) : Object.keys(groupedByDate).length > 0 ? (
                                                    Object.entries(groupedByDate).map(([date, items]) => {
                                                        const dateObj = new Date(date + 'T12:00:00');
                                                        const dayTotal = getDayTotal(items);

                                                        return (
                                                            <motion.div
                                                                key={date}
                                                                className={statementStyles.dayBlock}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                            >
                                                                <div className={statementStyles.dayHeader}>
                                                                    <div className={statementStyles.dayInfo}>
                                                                        <span className={statementStyles.dayNumber}>{dateObj.getDate()}</span>
                                                                        <div className={statementStyles.dayMeta}>
                                                                            <span className={statementStyles.dayWeek}>
                                                                                {dateObj.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                                                            </span>
                                                                            <span className={statementStyles.dayMonth}>
                                                                                {dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`${statementStyles.dayTotal} ${dayTotal >= 0 ? statementStyles.credit : statementStyles.debit}`}>
                                                                        {dayTotal >= 0 ? '+' : ''}{formatCurrency(dayTotal)}
                                                                    </div>
                                                                </div>

                                                                <div className={statementStyles.dayTransactions}>
                                                                    {items.map((t) => (
                                                                        <div key={t.id} className={statementStyles.transaction}>
                                                                            <div className={statementStyles.txTime}>{t.time || '--:--'}</div>
                                                                            <div className={statementStyles.txContent}>
                                                                                <span className={statementStyles.txDesc}>{t.description}</span>
                                                                            </div>
                                                                            <div className={`${statementStyles.txAmount} ${t.type === 'INCOME' ? statementStyles.credit : statementStyles.debit}`}>
                                                                                {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className={statementStyles.empty}>
                                                        <p>Nenhuma movimentação encontrada neste período</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* CARDS TAB */}
                                    {activeTab === 'cards' && (
                                        <div className={styles.cardsList}>
                                            {cards.length > 0 && (
                                                <div className={styles.tabActions}>
                                                    <button
                                                        className={styles.addBtn}
                                                        onClick={() => setShowCardModal(true)}
                                                    >
                                                        <FiPlus /> Novo Cartão
                                                    </button>
                                                </div>
                                            )}

                                            {cards.length === 0 ? (
                                                <div className={styles.emptyTab}>
                                                    <FiCreditCard />
                                                    <p>Nenhum cartão vinculado a esta conta</p>
                                                    <button
                                                        className={styles.linkBtn}
                                                        onClick={() => setShowCardModal(true)}
                                                    >
                                                        Novo Cartão
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className={styles.cardsGrid}>
                                                    {cards.map(card => (
                                                        <Link key={card.id} href={`/cards?cardId=${card.id}`} style={{ textDecoration: 'none' }}>
                                                            <div className={styles.cardItemWrapper}>
                                                                <CreditCard
                                                                    name={card.name}
                                                                    brand={card.brand}
                                                                    lastFourDigits={card.lastFourDigits}
                                                                    creditLimit={card.creditLimit}
                                                                    availableLimit={card.availableLimit}
                                                                    blockedLimit={card.blockedLimit || 0}
                                                                    closingDay={card.closingDay}
                                                                    dueDay={card.dueDay}
                                                                    color={card.color}
                                                                    holderName={card?.holderName || "NOME DO TITULAR"}
                                                                    validThru="12/28"
                                                                    icon={account?.icon || card.bankIcon}
                                                                />
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TRANSACTIONS TAB */}
                                    {activeTab === 'transactions' && (
                                        <div className={txStyles.transactionsList} style={{ marginTop: '1rem' }}>
                                            {transactions.length === 0 ? (
                                                <div className={txStyles.emptyState}>
                                                    <FiActivity />
                                                    <p>Nenhuma transação nesta conta</p>
                                                    <Link href={`/transactions?new=true&bankAccountId=${accountId}`} className={styles.linkBtn} style={{ marginTop: '1rem' }}>
                                                        Adicionar Transação
                                                    </Link>
                                                </div>
                                            ) : (
                                                transactions.slice(0, 20).map(tx => {
                                                    const detectedBrand = detectBrand(tx.description);
                                                    const brandIcon = tx.imageUrl || tx.icon || tx.subscription?.icon || getBrandIcon(tx.brandKey) || detectedBrand?.icon;

                                                    return (
                                                        <div key={tx.id} className={`${txStyles.transactionItem} ${tx.status === 'PENDING' ? txStyles.pendingItem : ''}`} onClick={() => router.push(`/transactions`)}>
                                                            <div className={`${txStyles.transactionIcon} ${tx.type === 'INCOME' ? txStyles.income : txStyles.expense}`} style={{ background: brandIcon ? 'transparent' : undefined }}>
                                                                {brandIcon ? (
                                                                    <img src={brandIcon} alt={tx.description} className={txStyles.brandLogo} />
                                                                ) : (
                                                                    tx.type === 'INCOME' ? <FiTrendingUp /> : <FiTrendingDown />
                                                                )}
                                                            </div>
                                                            <div className={txStyles.transactionInfo}>
                                                                <div className={txStyles.descRow}>
                                                                    <span className={txStyles.transactionDesc}>{tx.description}</span>
                                                                    {(tx.status === 'PENDING' || tx.status === 'PAID' && tx.source === 'CARD' && new Date(tx.date) > new Date()) && <span className={txStyles.pendingBadge}><FiClock /> Agendado</span>}
                                                                </div>
                                                                <div className={txStyles.transactionMeta}>
                                                                    <span className={txStyles.transactionCategory}>{tx.category || 'Outros'}</span>
                                                                    {tx.isRecurring && (
                                                                        <span className={txStyles.recurringBadge}><FiRepeat /> Recorrente</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className={txStyles.transactionAmount}>
                                                                <span className={`${tx.type === 'INCOME' ? txStyles.income : txStyles.expense} ${(tx.status === 'PENDING' || tx.status === 'PAID') ? txStyles.pendingText : ''}`}>
                                                                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                                </span>
                                                                <span className={txStyles.transactionDateHighlight}>
                                                                    {formatDate(tx.date)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                            {transactions.length > 20 && (
                                                <Link href={`/transactions?bankAccountId=${accountId}`} className={styles.viewMoreLink}>
                                                    Ver todas as transações da conta ({transactions.length})
                                                </Link>
                                            )}
                                        </div>
                                    )}

                                    {/* GOALS TAB */}
                                    {activeTab === 'goals' && (
                                        <div className={styles.goalsList}>
                                            {goals.length === 0 ? (
                                                <div className={styles.emptyTab}>
                                                    <FiTarget />
                                                    <p>Nenhuma meta vinculada a esta conta</p>
                                                    <Link href="/goals?new=true" className={styles.linkBtn}>
                                                        Criar Meta
                                                    </Link>
                                                </div>
                                            ) : (
                                                goals.map(goal => {
                                                    const progress = goal.targetAmount
                                                        ? Math.min(100, (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100)
                                                        : 0;
                                                    return (
                                                        <div key={goal.id} className={styles.goalItem} style={{ '--goal-color': goal.color }}>
                                                            <div className={styles.goalHeader}>
                                                                <span className={styles.goalName}>{goal.name}</span>
                                                                <span className={styles.goalProgress}>{progress.toFixed(0)}%</span>
                                                            </div>
                                                            <div className={styles.progressBar}>
                                                                <div
                                                                    className={styles.progressFill}
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                            <div className={styles.goalValues}>
                                                                <span>{formatCurrency(goal.currentAmount)}</span>
                                                                {goal.targetAmount && (
                                                                    <span className={styles.goalTarget}>
                                                                        de {formatCurrency(goal.targetAmount)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
            <Dock />

            {/* Card Modal */}
            <CardModal
                isOpen={showCardModal}
                onClose={() => setShowCardModal(false)}
                onSave={handleCardSave}
                bankAccounts={[account]} // Pre-select current account
            />
        </AppShell>
    );
}
