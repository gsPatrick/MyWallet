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

    const loadTabData = useCallback(async (tab) => {
        setLoadingTab(true);
        try {
            switch (tab) {
                case 'statement': {
                    const cardsRes = await cardsAPI.list();
                    const allCards = cardsRes?.data || [];
                    const bankCards = allCards.filter(card => 
                        String(card.bankAccountId) === String(accountId) || 
                        (account.bankName && card.bankName?.toLowerCase().includes(account.bankName.toLowerCase())) ||
                        (account.bankName && card.name?.toLowerCase().includes(account.bankName.toLowerCase()))
                    );
                    const cardIds = bankCards.map(c => c.id).join(',');

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
                    const cardsRes = await cardsAPI.list();
                    // Filter cards linked to this bank account OR matching by name if not linked
                    const linkedCards = (cardsRes?.data || []).filter(card => {
                        const cardBankAccountId = card.bankAccountId ? String(card.bankAccountId) : null;
                        const currentAccountId = accountId ? String(accountId) : null;
                        
                        // 1. Exact ID match
                        if (cardBankAccountId === currentAccountId) return true;
                        
                        // 2. Name match if card has no linked account
                        if (!cardBankAccountId && account) {
                            const accName = (account.bankName || "").toLowerCase().trim();
                            const accNick = (account.nickname || "").toLowerCase().trim();
                            const cardBank = (card.bankName || "").toLowerCase().trim();
                            
                            return (
                                (accName && (cardBank.includes(accName) || accName.includes(cardBank))) ||
                                (accNick && (cardBank.includes(accNick) || accNick.includes(cardBank)))
                            );
                        }
                        return false;
                    });
                    setCards(linkedCards);
                    break;
                }

                case 'transactions':
                    const cardsRes = await cardsAPI.list();
                    const allCards = cardsRes?.data || [];
                    const bankCards = allCards.filter(card => 
                        String(card.bankAccountId) === String(accountId) || 
                        (account.bankName && card.bankName?.toLowerCase().includes(account.bankName.toLowerCase())) ||
                        (account.bankName && card.name?.toLowerCase().includes(account.bankName.toLowerCase()))
                    );
                    const cardIds = bankCards.map(c => c.id).join(',');

                    const txRes = await transactionsAPI.list({ 
                        bankAccountId: accountId,
                        cardIds: cardIds || undefined
                    });
                    setTransactions(txRes?.data?.transactions || txRes?.transactions || []);
                    break;

                case 'goals': {
                    const goalsRes = await goalsAPI.list();
                    // Filter goals linked to this bank account
                    const linkedGoals = (goalsRes?.data || goalsRes || []).filter(
                        goal => goal.bankAccountId === accountId
                    );
                    setGoals(linkedGoals);

                    // Calculate reserved amount for goals
                    const reserved = linkedGoals.reduce(
                        (sum, g) => sum + parseFloat(g.currentAmount || 0), 0
                    );
                    setStats(prev => ({ ...prev, reservedForGoals: reserved }));
                    break;
                }

                case 'summary': {
                    // Load summary statistics
                    const [goalsData, txData] = await Promise.all([
                        goalsAPI.list(),
                        transactionsAPI.list({ bankAccountId: accountId })
                    ]);

                    const accountGoals = (goalsData?.data || goalsData || []).filter(
                        g => g.bankAccountId === accountId
                    );
                    const accountTx = txData?.data?.transactions || txData?.transactions || [];

                    const income = accountTx
                        .filter(t => t.type === 'INCOME' && t.status !== 'PENDING' && t.status !== 'CANCELLED')
                        .reduce((s, t) => s + parseFloat(t.amount || 0), 0);
                    const expenses = accountTx
                        .filter(t => t.type === 'EXPENSE' && t.status !== 'PENDING' && t.status !== 'CANCELLED')
                        .reduce((s, t) => s + parseFloat(t.amount || 0), 0);
                    
                    const pendingIncome = accountTx
                        .filter(t => t.type === 'INCOME' && t.status === 'PENDING')
                        .reduce((s, t) => s + parseFloat(t.amount || 0), 0);
                    const pendingExpenses = accountTx
                        .filter(t => t.type === 'EXPENSE' && t.status === 'PENDING')
                        .reduce((s, t) => s + parseFloat(t.amount || 0), 0);

                    const reserved = accountGoals.reduce(
                        (s, g) => s + parseFloat(g.currentAmount || 0), 0
                    );

                    setStats({ 
                        totalIncome: income, 
                        totalExpenses: expenses, 
                        pendingIncome, 
                        pendingExpenses,
                        reservedForGoals: reserved 
                    });
                    setGoals(accountGoals);
                    setAllTransactions(accountTx);
                    break;
                }
            }
        } catch (err) {
            console.error(`Erro ao carregar dados da tab ${tab}:`, err);
        } finally {
            setLoadingTab(false);
        }
    }, [accountId, account]);

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
                                        <div className={txStyles.chartsGrid}>
                                            <div className={txStyles.summaryGrid}>
                                                <div className={txStyles.summaryCard}>
                                                    <div className={txStyles.summaryHeader}>
                                                        <span className={txStyles.summaryLabel}>Receita Realizada</span>
                                                        <FiTrendingUp className={txStyles.incomeIcon} />
                                                    </div>
                                                    <span className={`${txStyles.summaryValue} ${txStyles.income}`}>{formatCurrency(stats.totalIncome)}</span>
                                                </div>
                                                <div className={`${txStyles.summaryCard} ${txStyles.predictionCard}`}>
                                                    <div className={txStyles.summaryHeader}>
                                                        <span className={txStyles.summaryLabel}>Receita Futura</span>
                                                        <FiClock className={txStyles.incomeIcon} />
                                                    </div>
                                                    <span className={`${txStyles.summaryValue} ${txStyles.income} ${txStyles.predictionText}`}>{formatCurrency(stats.pendingIncome)}</span>
                                                </div>
                                                <div className={txStyles.summaryCard}>
                                                    <div className={txStyles.summaryHeader}>
                                                        <span className={txStyles.summaryLabel}>Despesa Realizada</span>
                                                        <FiTrendingDown className={txStyles.expenseIcon} />
                                                    </div>
                                                    <span className={`${txStyles.summaryValue} ${txStyles.expense}`}>{formatCurrency(stats.totalExpenses)}</span>
                                                </div>
                                                <div className={`${txStyles.summaryCard} ${txStyles.predictionCard}`}>
                                                    <div className={txStyles.summaryHeader}>
                                                        <span className={txStyles.summaryLabel}>Despesa Futura</span>
                                                        <FiAlertCircle className={txStyles.expenseIcon} />
                                                    </div>
                                                    <span className={`${txStyles.summaryValue} ${txStyles.expense} ${txStyles.predictionText}`}>{formatCurrency(stats.pendingExpenses)}</span>
                                                </div>
                                            </div>

                                            <div className={txStyles.chartCard}>
                                                <div className={txStyles.chartHeader}>
                                                    <h3>{chartFilterType === 'EXPENSE' ? 'Despesas' : 'Receitas'} por Categoria</h3>
                                                    <div className={txStyles.chartFilters}>
                                                        <button
                                                            className={`${txStyles.chartFilterBtn} ${chartFilterType === 'EXPENSE' ? txStyles.active : ''}`}
                                                            onClick={() => setChartFilterType('EXPENSE')}
                                                        >
                                                            Despesas
                                                        </button>
                                                        <button
                                                            className={`${txStyles.chartFilterBtn} ${chartFilterType === 'INCOME' ? txStyles.active : ''}`}
                                                            onClick={() => setChartFilterType('INCOME')}
                                                        >
                                                            Receitas
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className={txStyles.chartSubFilters}>
                                                    <button
                                                        className={`${txStyles.chartSubBtn} ${chartFilterStatus === 'all' ? txStyles.active : ''}`}
                                                        onClick={() => setChartFilterStatus('all')}
                                                    >
                                                        Todos
                                                    </button>
                                                    <button
                                                        className={`${txStyles.chartSubBtn} ${chartFilterStatus === 'COMPLETED' ? txStyles.active : ''}`}
                                                        onClick={() => setChartFilterStatus('COMPLETED')}
                                                    >
                                                        Realizados
                                                    </button>
                                                    <button
                                                        className={`${txStyles.chartSubBtn} ${chartFilterStatus === 'PENDING' ? txStyles.active : ''}`}
                                                        onClick={() => setChartFilterStatus('PENDING')}
                                                    >
                                                        Futuros
                                                    </button>
                                                </div>
                                                <div className={txStyles.pieContainer}>
                                                    <div className={txStyles.pieChart}>
                                                        <svg viewBox="0 0 100 100" className={txStyles.pieSvg}>
                                                            {categoryChartData.length > 0 ? (
                                                                (() => {
                                                                    let accumulated = 0;
                                                                    return categoryChartData.map((d, i) => {
                                                                        const startAngle = (accumulated / 100) * 360;
                                                                        accumulated += d.percent;
                                                                        const endAngle = (accumulated / 100) * 360;
                                                                        if (d.percent >= 100) return <circle key={i} cx="50" cy="50" r="40" fill={d.color} />;
                                                                        const largeArc = d.percent > 50 ? 1 : 0;
                                                                        const startX = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                                                                        const startY = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                                                                        const endX = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                                                                        const endY = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                                                                        return (
                                                                            <path key={i} d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`} fill={d.color} />
                                                                        );
                                                                    });
                                                                })()
                                                            ) : (
                                                                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-light)" strokeWidth="8" opacity="0.3" />
                                                            )}
                                                            <circle cx="50" cy="50" r="25" fill="var(--bg-secondary)" />
                                                        </svg>
                                                    </div>
                                                    <div className={txStyles.pieLegend}>
                                                        {categoryChartData.slice(0, 4).map((d, i) => (
                                                            <div key={i} className={txStyles.legendItem}>
                                                                <span className={txStyles.legendDot} style={{ background: d.color }}></span>
                                                                <span className={txStyles.legendName}>{d.name}</span>
                                                                <span className={txStyles.legendPercent}>{d.percent}%</span>
                                                            </div>
                                                        ))}
                                                        {categoryChartData.length === 0 && (
                                                            <span className={txStyles.emptyLegend}>Sem dados</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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
