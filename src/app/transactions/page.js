'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FiPlus, FiFilter, FiCalendar, FiTrendingUp, FiTrendingDown, FiEdit, FiTrash2,
    FiRepeat, FiCreditCard, FiDollarSign, FiLayers, FiTarget, FiAlertCircle, FiX,
    FiClock, FiPieChart, FiCheck
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { usePrivateCurrency } from '@/components/ui/PrivateValue';
import { formatDate } from '@/utils/formatters';
import { transactionsAPI, cardsAPI } from '@/services/api';
import categoriesService from '@/services/categoriesService';
import { mockTransactions } from '@/utils/mockData';
import subscriptionIcons from '@/data/subscriptionIcons.json';
import styles from './page.module.css';

export default function TransactionsPage() {
    // Privacy-aware formatting
    const { formatCurrency } = usePrivateCurrency();
    // State
    const [transactions, setTransactions] = useState([]);
    const [cards, setCards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiCategories, setApiCategories] = useState([]);

    const [filterDate, setFilterDate] = useState('month');
    const [filterType, setFilterType] = useState('Todas');
    const [filterCategory, setFilterCategory] = useState('Todas');
    const [filterCard, setFilterCard] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [customDate, setCustomDate] = useState({ start: '', end: '' });

    // Chart-specific filters
    const [chartFilterType, setChartFilterType] = useState('EXPENSE');
    const [chartFilterStatus, setChartFilterStatus] = useState('all');

    const [showFilters, setShowFilters] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);

    const [transactionMode, setTransactionMode] = useState('single');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryList, setCategoryList] = useState([]);
    const [newTransaction, setNewTransaction] = useState({
        type: 'EXPENSE',
        description: '',
        amount: '',
        category: '',
        categoryId: '',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
        frequency: 'MONTHLY',
        recurringDay: '',
        status: 'COMPLETED', // COMPLETED or PENDING
        cardId: '',
        installments: '',
        imageUrl: '', // For subscriptions/logos
    });

    // Constants
    const dateFilters = [
        { id: 'today', label: 'Hoje' },
        { id: 'week', label: '7 dias' },
        { id: 'month', label: 'Este Mês' },
        { id: 'year', label: 'Este Ano' },
        { id: 'custom', label: 'Personalizado' }
    ];

    const types = ['Todas', 'INCOME', 'EXPENSE', 'RECURRING'];

    // Derived
    const categories = ['Todas', ...(apiCategories || [])]; // Handling potential null apiCategories

    // Load data from API
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Determine date range based on filter
                const now = new Date();
                let startDate = new Date();
                let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month default

                if (filterDate === 'today') {
                    startDate = now;
                    endDate = now;
                } else if (filterDate === 'week') {
                    startDate.setDate(now.getDate() - 7);
                } else if (filterDate === 'month') {
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                } else if (filterDate === 'year') {
                    startDate = new Date(now.getFullYear(), 0, 1);
                } else if (filterDate === 'custom' && customDate.start && customDate.end) {
                    startDate = new Date(customDate.start);
                    endDate = new Date(customDate.end);
                }

                // Format for API (YYYY-MM-DD)
                const startStr = startDate.toISOString().split('T')[0];
                const endStr = endDate.toISOString().split('T')[0];

                const [txRes, catRes, cardsRes, categoriesRes] = await Promise.all([
                    transactionsAPI.list({ startDate: startStr, endDate: endStr }),
                    transactionsAPI.getCategories(),
                    cardsAPI.list(),
                    categoriesService.list()
                ]);

                // Apply local filters
                let filtered = txRes?.data?.transactions || [];

                if (filterType !== 'Todas') {
                    filtered = filtered.filter(t => t.type === filterType);
                }
                if (filterCategory !== 'Todas') {
                    filtered = filtered.filter(t => t.category === filterCategory || t.categoryId === filterCategory);
                }
                if (filterCard === 'card-only') {
                    filtered = filtered.filter(t => t.cardId);
                } else if (filterCard === 'no-card') {
                    filtered = filtered.filter(t => !t.cardId);
                }
                if (filterStatus !== 'all') {
                    filtered = filtered.filter(t => t.status === filterStatus);
                }

                // Filter by recurring if selected
                if (filterType === 'RECURRING') {
                    filtered = filtered.filter(t => t.isRecurring || t.subscriptionId);
                }

                setTransactions(filtered);
                setApiCategories(catRes?.data || []);
                setCards(cardsRes?.data || []);
                setCategoryList(categoriesRes?.data || []);
            } catch (error) {
                console.error("Error loading transactions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [filterDate, filterType, filterCategory, filterCard, filterStatus, customDate]);

    // Derived totals - separate completed and pending
    const completedTransactions = transactions.filter(t => t.status !== 'PENDING' && t.status !== 'CANCELLED');
    const pendingTransactions = transactions.filter(t => t.status === 'PENDING');

    const totals = completedTransactions.reduce((acc, tx) => {
        const amount = parseFloat(tx.amount);
        if (tx.type === 'INCOME') acc.income += amount;
        else acc.expense += amount;
        return acc;
    }, { income: 0, expense: 0 });

    const pendingTotals = pendingTransactions.reduce((acc, tx) => {
        const amount = parseFloat(tx.amount);
        if (tx.type === 'INCOME') acc.income += amount;
        else acc.expense += amount;
        return acc;
    }, { income: 0, expense: 0 });

    // Category breakdown for pie chart (respects local chart filters)
    const chartTransactionsSource = chartFilterStatus === 'all'
        ? transactions
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

    const handleAmountChange = (e) => {
        const value = e.target.value;
        const digits = value.replace(/\D/g, '');
        const amount = parseInt(digits || '0') / 100;
        const formatted = amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        setNewTransaction(prev => ({ ...prev, amount: formatted }));
    };

    const handleAddTransaction = async () => {
        // Validation for Subscriptions (Recurring)
        if (transactionMode === 'recurring' && newTransaction.type === 'EXPENSE' && !newTransaction.cardId) {
            alert("Assinaturas (recorrentes) devem estar obrigatoriamente associadas a um cartão de crédito.");
            return;
        }

        try {
            // Parse amount: "1.000,00" -> 1000.00
            const rawAmount = parseFloat(newTransaction.amount.replace(/\./g, '').replace(',', '.'));

            await transactionsAPI.create({
                ...newTransaction,
                amount: rawAmount,
                isRecurring: transactionMode === 'recurring',
                installments: transactionMode === 'installment' ? { current: 1, total: parseInt(newTransaction.installments) } : null
            });
            setShowAddModal(false);
            resetForm();
            // Trigger reload (simplified)
            window.location.reload();
        } catch (error) {
            alert("Error creating transaction: " + error.message);
        }
    };

    const resetForm = () => {
        setNewTransaction({
            type: 'EXPENSE',
            description: '',
            amount: '',
            category: '',
            categoryId: '',
            date: new Date().toISOString().split('T')[0],
            isRecurring: false,
            frequency: 'MONTHLY',
            recurringDay: '',
            status: 'COMPLETED',
            cardId: '',
            installments: '',
        });
        setTransactionMode('single');
    };

    // Create new category inline
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const response = await categoriesService.create({
                name: newCategoryName.trim(),
                type: newTransaction.type,
                icon: 'FiFolder',
                color: '#6366f1'
            });
            const newCat = response?.data;
            if (newCat) {
                setCategoryList(prev => [...prev, newCat]);
                setNewTransaction(prev => ({ ...prev, categoryId: newCat.id, category: newCat.name }));
            }
            setNewCategoryName('');
            setShowCategoryModal(false);
        } catch (error) {
            alert('Erro ao criar categoria: ' + error.message);
        }
    };

    const getCardName = (cardId) => {
        // Implementation would need cards loaded or card name in transaction object
        return "Cartão";
    };

    // Budget tips - keeping mock for now as API endpoint might be different or complex
    const budgetTips = [];

    // Animations
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className={styles.pageWrapper}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Page Header */}
                    <motion.div
                        className={styles.pageHeader}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div>
                            <h1 className={styles.pageTitle}>Transações</h1>
                            <p className={styles.pageSubtitle}>Gerencie suas receitas, despesas e assinaturas</p>
                        </div>
                        <div className={styles.headerActions}>
                            <button id="filter-bar" className={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
                                <FiFilter />
                                Filtros
                            </button>
                            <Button leftIcon={<FiPlus />} onClick={() => setShowAddModal(true)}>
                                Nova Transação
                            </Button>
                        </div>
                    </motion.div>

                    {/* Budget Tips Banner */}
                    {budgetTips.length > 0 && (
                        <motion.div className={styles.tipsBanner} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                            <div className={styles.tipsHeader}>
                                <FiTarget className={styles.tipsIcon} />
                                <span>Acompanhamento do Orçamento</span>
                                <Link href="/budget-allocation" className={styles.tipsLink}>Ver detalhes</Link>
                            </div>
                            <div className={styles.tipsList}>
                                {budgetTips.map((tip, i) => (
                                    <div key={i} className={`${styles.tipItem} ${styles[tip.type]}`}>
                                        <span className={styles.tipDot} style={{ background: tip.color }} />
                                        {tip.message}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Charts Section */}
                    <div className={styles.chartsGrid}>
                        {/* Unified Summary Grid (Realized + Future) */}
                        <motion.div
                            id="summary-grid"
                            className={styles.summaryGrid}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            {/* Row 1: Income */}
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryHeader}>
                                    <span className={styles.summaryLabel}>Receita Realizada</span>
                                    <FiTrendingUp className={styles.incomeIcon} />
                                </div>
                                <span className={`${styles.summaryValue} ${styles.income}`}>{formatCurrency(totals.income)}</span>
                            </div>
                            <div className={`${styles.summaryCard} ${styles.predictionCard}`}>
                                <div className={styles.summaryHeader}>
                                    <span className={styles.summaryLabel}>Receita Futura</span>
                                    <FiClock className={styles.incomeIcon} />
                                </div>
                                <span className={`${styles.summaryValue} ${styles.income} ${styles.predictionText}`}>{formatCurrency(pendingTotals.income)}</span>
                            </div>

                            {/* Row 2: Expense */}
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryHeader}>
                                    <span className={styles.summaryLabel}>Despesa Realizada</span>
                                    <FiTrendingDown className={styles.expenseIcon} />
                                </div>
                                <span className={`${styles.summaryValue} ${styles.expense}`}>{formatCurrency(totals.expense)}</span>
                            </div>
                            <div className={`${styles.summaryCard} ${styles.predictionCard}`}>
                                <div className={styles.summaryHeader}>
                                    <span className={styles.summaryLabel}>Despesa Futura</span>
                                    <FiAlertCircle className={styles.expenseIcon} />
                                </div>
                                <span className={`${styles.summaryValue} ${styles.expense} ${styles.predictionText}`}>{formatCurrency(pendingTotals.expense)}</span>
                            </div>

                            {/* Row 3: Balance */}
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryHeader}>
                                    <span className={styles.summaryLabel}>Saldo Atual</span>
                                    <div className={styles.balanceIcon}>B</div>
                                </div>
                                <span className={`${styles.summaryValue} ${totals.income - totals.expense >= 0 ? styles.income : styles.expense}`}>
                                    {formatCurrency(totals.income - totals.expense)}
                                </span>
                            </div>
                            <div className={`${styles.summaryCard} ${styles.predictionCard}`}>
                                <div className={styles.summaryHeader}>
                                    <span className={styles.summaryLabel}>Saldo Previsto</span>
                                    <FiTarget className={styles.balanceIcon} />
                                </div>
                                <span className={`${styles.summaryValue} ${(totals.income - totals.expense + pendingTotals.income - pendingTotals.expense) >= 0 ? styles.income : styles.expense
                                    } ${styles.predictionText}`}>
                                    {formatCurrency(totals.income - totals.expense + pendingTotals.income - pendingTotals.expense)}
                                </span>
                            </div>
                        </motion.div>

                        {/* Category Pie Chart */}
                        <motion.div
                            className={styles.chartCard}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            <div className={styles.chartHeader}>
                                <h3>{chartFilterType === 'EXPENSE' ? 'Despesas' : 'Receitas'} por Categoria</h3>
                                <div className={styles.chartFilters}>
                                    <button
                                        className={`${styles.chartFilterBtn} ${chartFilterType === 'EXPENSE' ? styles.active : ''}`}
                                        onClick={() => setChartFilterType('EXPENSE')}
                                    >
                                        Despesas
                                    </button>
                                    <button
                                        className={`${styles.chartFilterBtn} ${chartFilterType === 'INCOME' ? styles.active : ''}`}
                                        onClick={() => setChartFilterType('INCOME')}
                                    >
                                        Receitas
                                    </button>
                                </div>
                            </div>
                            <div className={styles.chartSubFilters}>
                                <button
                                    className={`${styles.chartSubBtn} ${chartFilterStatus === 'all' ? styles.active : ''}`}
                                    onClick={() => setChartFilterStatus('all')}
                                >
                                    Todos
                                </button>
                                <button
                                    className={`${styles.chartSubBtn} ${chartFilterStatus === 'COMPLETED' ? styles.active : ''}`}
                                    onClick={() => setChartFilterStatus('COMPLETED')}
                                >
                                    Realizados
                                </button>
                                <button
                                    className={`${styles.chartSubBtn} ${chartFilterStatus === 'PENDING' ? styles.active : ''}`}
                                    onClick={() => setChartFilterStatus('PENDING')}
                                >
                                    Futuros
                                </button>
                            </div>
                            <div className={styles.pieContainer}>
                                <div className={styles.pieChart}>
                                    <svg viewBox="0 0 100 100" className={styles.pieSvg}>
                                        {categoryChartData.length > 0 ? (
                                            (() => {
                                                let accumulated = 0;
                                                return categoryChartData.map((d, i) => {
                                                    const startAngle = (accumulated / 100) * 360;
                                                    accumulated += d.percent;
                                                    const endAngle = (accumulated / 100) * 360;
                                                    // Handle single item 100% case
                                                    if (d.percent >= 100) return <circle key={i} cx="50" cy="50" r="40" fill={d.color} />;

                                                    const largeArc = d.percent > 50 ? 1 : 0;
                                                    const startX = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                                                    const startY = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                                                    const endX = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                                                    const endY = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                                                    return (
                                                        <path
                                                            key={i}
                                                            d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
                                                            fill={d.color}
                                                        />
                                                    );
                                                });
                                            })()
                                        ) : (
                                            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-light)" strokeWidth="8" opacity="0.3" />
                                        )}
                                        <circle cx="50" cy="50" r="25" fill="var(--bg-secondary)" />
                                    </svg>
                                </div>
                                <div className={styles.pieLegend}>
                                    {categoryChartData.slice(0, 4).map((d, i) => (
                                        <div key={i} className={styles.legendItem}>
                                            <span className={styles.legendDot} style={{ background: d.color }}></span>
                                            <span className={styles.legendName}>{d.name}</span>
                                            <span className={styles.legendPercent}>{d.percent}%</span>
                                        </div>
                                    ))}
                                    {categoryChartData.length === 0 && (
                                        <span className={styles.emptyLegend}>Sem dados</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <motion.div
                            className={styles.filtersPanel}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                        >
                            {/* Date Filter */}
                            <div className={styles.filterSection}>
                                <label className={styles.filterSectionLabel}>Período</label>
                                <div className={styles.dateFilter}>
                                    {dateFilters.map(filter => (
                                        <button
                                            key={filter.id}
                                            className={`${styles.dateBtn} ${filterDate === filter.id ? styles.active : ''}`}
                                            onClick={() => {
                                                setFilterDate(filter.id);
                                                if (filter.id === 'custom') setShowDatePicker(true);
                                            }}
                                        >
                                            {filter.id === 'custom' ? <FiCalendar /> : null}
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Type Filter */}
                            <div className={styles.filterSection}>
                                <label className={styles.filterSectionLabel}>Tipo</label>
                                <div className={styles.filterGroup}>
                                    {types.map(type => (
                                        <button
                                            key={type}
                                            className={`${styles.filterBtn} ${filterType === type ? styles.active : ''}`}
                                            onClick={() => setFilterType(type)}
                                        >
                                            {type === 'INCOME' ? 'Receitas' : type === 'EXPENSE' ? 'Despesas' : type === 'RECURRING' ? 'Recorrentes' : type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Card Filter */}
                            <div className={styles.filterSection}>
                                <label className={styles.filterSectionLabel}>Cartão</label>
                                <div className={styles.filterGroup}>
                                    <button className={`${styles.filterBtn} ${filterCard === 'all' ? styles.active : ''}`} onClick={() => setFilterCard('all')}>
                                        Todos
                                    </button>
                                    <button className={`${styles.filterBtn} ${filterCard === 'card-only' ? styles.active : ''}`} onClick={() => setFilterCard('card-only')}>
                                        <FiCreditCard /> Somente Cartão
                                    </button>
                                    <button className={`${styles.filterBtn} ${filterCard === 'no-card' ? styles.active : ''}`} onClick={() => setFilterCard('no-card')}>
                                        Sem Cartão
                                    </button>
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className={styles.filterSection}>
                                <label className={styles.filterSectionLabel}>Status</label>
                                <div className={styles.filterGroup}>
                                    <button className={`${styles.filterBtn} ${filterStatus === 'all' ? styles.active : ''}`} onClick={() => setFilterStatus('all')}>
                                        Todos
                                    </button>
                                    <button className={`${styles.filterBtn} ${filterStatus === 'COMPLETED' ? styles.active : ''}`} onClick={() => setFilterStatus('COMPLETED')}>
                                        <FiCheck /> Realizados
                                    </button>
                                    <button className={`${styles.filterBtn} ${filterStatus === 'PENDING' ? styles.active : ''}`} onClick={() => setFilterStatus('PENDING')}>
                                        <FiClock /> Agendados
                                    </button>
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className={styles.filterSection}>
                                <label className={styles.filterSectionLabel}>Categoria</label>
                                <select
                                    className={styles.filterSelect}
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </motion.div>
                    )}

                    {/* Custom Date Picker */}
                    {showDatePicker && (
                        <motion.div className={styles.datePickerOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowDatePicker(false)}>
                            <motion.div className={styles.datePickerModal} initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
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

                    {/* Transactions List */}
                    <Card>
                        {isLoading ? (
                            <div className={styles.loadingState}>
                                <div className={styles.spinner} />
                                <p>Carregando transações...</p>
                            </div>
                        ) : (
                            <motion.div
                                className={styles.transactionsList}
                                variants={container}
                                initial="hidden"
                                animate="show"
                            >
                                {transactions.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <FiAlertCircle />
                                        <p>Nenhuma transação encontrada com os filtros selecionados.</p>
                                    </div>
                                ) : (
                                    transactions.map((tx) => (
                                        <motion.div
                                            key={tx.id}
                                            className={`${styles.transactionItem} ${tx.status === 'PENDING' ? styles.pendingItem : ''}`}
                                            variants={item}
                                        >
                                            <div
                                                className={`${styles.transactionIcon} ${tx.type === 'INCOME' ? styles.income : styles.expense}`}
                                                style={{ background: tx.imageUrl || tx.icon ? 'transparent' : undefined }}
                                            >
                                                {tx.imageUrl || tx.icon ? (
                                                    <img
                                                        src={tx.imageUrl || tx.icon}
                                                        alt={tx.description}
                                                        className={styles.transactionIconImg}
                                                    />
                                                ) : tx.isRecurring ? <FiRepeat /> : tx.type === 'INCOME' ? <FiTrendingUp /> : <FiTrendingDown />}
                                            </div>
                                            <div className={styles.transactionInfo}>
                                                <div className={styles.descRow}>
                                                    <span className={styles.transactionDesc}>{tx.description}</span>
                                                    {tx.status === 'PENDING' && <span className={styles.pendingBadge}><FiClock /> Agendado</span>}
                                                </div>
                                                <div className={styles.transactionMeta}>
                                                    <span className={styles.transactionCategory}>{tx.category}</span>
                                                    {tx.isRecurring && <span className={styles.recurringBadge}><FiRepeat /> Recorrente</span>}
                                                    {tx.installments && (
                                                        <span className={styles.installmentBadge}>
                                                            <FiLayers /> {tx.installments.current}/{tx.installments.total}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={styles.transactionAmount}>
                                                <span className={`${tx.type === 'INCOME' ? styles.income : styles.expense} ${tx.status === 'PENDING' ? styles.pendingText : ''}`}>
                                                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                </span>
                                                <span className={styles.transactionDate}>
                                                    <FiCalendar /> {formatDate(tx.date)}
                                                </span>
                                            </div>
                                            {tx.source === 'MANUAL' && (
                                                <div className={styles.transactionActions}>
                                                    <button className={styles.actionBtn}><FiEdit /></button>
                                                    <button className={`${styles.actionBtn} ${styles.danger}`}><FiTrash2 /></button>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </Card>
                </div>
            </main>

            <Dock />

            {/* Add Transaction Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => { setShowAddModal(false); resetForm(); }}
                title="Nova Transação"
                size="md"
            >
                <div className={styles.formGrid}>
                    {/* Transaction Type */}
                    <div className={styles.typeToggle}>
                        <button
                            className={`${styles.typeBtn} ${newTransaction.type === 'INCOME' ? styles.income : ''}`}
                            onClick={() => setNewTransaction(prev => ({ ...prev, type: 'INCOME' }))}
                        >
                            <FiTrendingUp /> Receita
                        </button>
                        <button
                            className={`${styles.typeBtn} ${newTransaction.type === 'EXPENSE' ? styles.expense : ''}`}
                            onClick={() => setNewTransaction(prev => ({ ...prev, type: 'EXPENSE' }))}
                        >
                            <FiTrendingDown /> Despesa
                        </button>
                    </div>

                    {/* Transaction Mode */}
                    <div className={styles.modeSection}>
                        <label className={styles.inputLabel}>Tipo de Lançamento</label>
                        <div className={styles.modeToggle}>
                            <button
                                type="button"
                                className={`${styles.modeBtn} ${transactionMode === 'single' ? styles.active : ''}`}
                                onClick={() => setTransactionMode('single')}
                            >
                                <FiDollarSign /> Único
                            </button>
                            <button
                                type="button"
                                className={`${styles.modeBtn} ${transactionMode === 'recurring' ? styles.active : ''}`}
                                onClick={() => setTransactionMode('recurring')}
                            >
                                <FiRepeat /> Recorrente
                            </button>
                            <button
                                type="button"
                                className={`${styles.modeBtn} ${transactionMode === 'installment' ? styles.active : ''}`}
                                onClick={() => setTransactionMode('installment')}
                            >
                                <FiLayers /> Parcelado
                            </button>
                        </div>
                    </div>

                    <Input
                        label="Descrição"
                        placeholder="Ex: Supermercado, Netflix, iPhone..."
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                        fullWidth
                    />

                    {/* Optional Icon Selector */}
                    <div className={styles.iconSelectorSection}>
                        <label className={styles.inputLabel}>Ícone (opcional)</label>
                        <div
                            className={styles.iconPreview}
                            onClick={() => setShowIconPicker(true)}
                        >
                            {newTransaction.imageUrl ? (
                                <img src={newTransaction.imageUrl} alt="Ícone" className={styles.selectedIconImg} />
                            ) : (
                                <span className={styles.iconPlaceholder}><FiPlus /> Escolher ícone</span>
                            )}
                        </div>
                        {newTransaction.imageUrl && (
                            <button
                                type="button"
                                className={styles.clearIconBtn}
                                onClick={() => setNewTransaction(prev => ({ ...prev, imageUrl: '' }))}
                            >
                                <FiX /> Remover
                            </button>
                        )}
                    </div>

                    <div className={styles.formRow}>
                        <Input
                            label="Valor"
                            type="text"
                            placeholder="0,00"
                            leftIcon={<FiDollarSign />}
                            value={newTransaction.amount}
                            onChange={handleAmountChange}
                        />
                        <div className={styles.inputGroup}>
                            <div className={styles.labelWithAction}>
                                <label className={styles.inputLabel}>Categoria</label>
                                <button type="button" className={styles.addCategoryBtn} onClick={() => setShowCategoryModal(true)}>
                                    <FiPlus /> Nova
                                </button>
                            </div>
                            <select
                                className={styles.selectInput}
                                value={newTransaction.categoryId}
                                onChange={(e) => {
                                    const cat = categoryList.find(c => c.id == e.target.value);
                                    setNewTransaction(prev => ({ ...prev, categoryId: e.target.value, category: cat ? cat.name : '' }));
                                }}
                            >
                                <option value="">Selecione...</option>
                                {categoryList
                                    .filter(c => c.type === 'BOTH' || c.type === newTransaction.type)
                                    .map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        {newTransaction.status === 'PENDING' && transactionMode !== 'recurring' && (
                            <Input
                                label="Data de Vencimento"
                                type="date"
                                value={newTransaction.date}
                                onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                            />
                        )}
                        <div className={styles.inputGroup} style={{ flex: newTransaction.status === 'PENDING' ? 1 : 'none', width: newTransaction.status === 'PENDING' ? 'auto' : '100%' }}>
                            {transactionMode !== 'recurring' && (
                                <>
                                    <label className={styles.inputLabel}>Data da Transação</label>
                                    <div className={styles.typeToggle} style={{ marginTop: '4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <button
                                            type="button"
                                            className={styles.typeBtn}
                                            style={{
                                                background: newTransaction.status === 'COMPLETED' ? '#22c55e' : '#f1f5f9',
                                                color: newTransaction.status === 'COMPLETED' ? 'white' : '#64748b',
                                                transition: 'all 0.2s',
                                                justifyContent: 'center',
                                                fontWeight: 600
                                            }}
                                            onClick={() => setNewTransaction(prev => ({
                                                ...prev,
                                                status: 'COMPLETED',
                                                date: new Date().toISOString().split('T')[0]
                                            }))}
                                        >
                                            <FiCheck /> Hoje
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.typeBtn}
                                            style={{
                                                background: newTransaction.status === 'PENDING' ? '#3b82f6' : '#f1f5f9',
                                                color: newTransaction.status === 'PENDING' ? 'white' : '#64748b',
                                                transition: 'all 0.2s',
                                                justifyContent: 'center',
                                                fontWeight: 600
                                            }}
                                            onClick={() => setNewTransaction(prev => ({ ...prev, status: 'PENDING' }))}
                                        >
                                            <FiClock /> Futuro
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Recurring Options */}
                    {transactionMode === 'recurring' && (
                        <div className={styles.recurringSection}>
                            <div className={styles.formRow}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>Frequência</label>
                                    <select
                                        className={styles.selectInput}
                                        value={newTransaction.frequency}
                                        onChange={(e) => setNewTransaction(prev => ({ ...prev, frequency: e.target.value }))}
                                    >
                                        <option value="MONTHLY">Mensal</option>
                                        <option value="WEEKLY">Semanal</option>
                                        <option value="YEARLY">Anual</option>
                                    </select>
                                </div>
                                <Input
                                    label="Dia de Cobrança"
                                    type="number"
                                    placeholder="Dia (1-31)"
                                    min="1"
                                    max="31"
                                    value={newTransaction.recurringDay}
                                    onChange={(e) => setNewTransaction(prev => ({ ...prev, recurringDay: e.target.value }))}
                                />
                            </div>



                            <span className={styles.helperText}>
                                Assinaturas devem ser vinculadas a um cartão de crédito.
                            </span>
                        </div>
                    )}

                    {/* Installment Options */}
                    {transactionMode === 'installment' && (
                        <div className={styles.installmentSection}>
                            <div className={styles.formRow}>
                                <Input
                                    label="Número de Parcelas"
                                    type="number"
                                    placeholder="12"
                                    min="2"
                                    max="48"
                                    value={newTransaction.installments}
                                    onChange={(e) => setNewTransaction(prev => ({ ...prev, installments: e.target.value }))}
                                />
                                <div className={styles.installmentPreview}>
                                    {newTransaction.amount && newTransaction.installments && (
                                        <>
                                            <span className={styles.previewLabel}>Valor por parcela:</span>
                                            <span className={styles.previewValue}>
                                                {formatCurrency(Number(newTransaction.amount) / Number(newTransaction.installments))}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Card Selection */}
                    {newTransaction.type === 'EXPENSE' && (
                        <div className={styles.cardSection}>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>Vincular ao Cartão</label>
                                <select
                                    className={styles.selectInput}
                                    value={newTransaction.cardId}
                                    onChange={(e) => setNewTransaction(prev => ({ ...prev, cardId: e.target.value }))}
                                >
                                    <option value="">Nenhum (Débito/Dinheiro/Pix)</option>
                                    {cards.map(card => (
                                        <option key={card.id} value={card.id}>
                                            {card.name} •••• {card.lastFourDigits}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <span className={styles.helperText}>Deixe em branco para pagamentos à vista.</span>
                        </div>
                    )}

                    <div className={styles.modalActions}>
                        <Button variant="secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAddTransaction}>Salvar</Button>
                    </div>
                </div>
            </Modal>

            {/* Create Category Modal */}
            <Modal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                title="Nova Categoria"
                size="sm"
            >
                <div className={styles.formGrid}>
                    <p className={styles.helperText}>Criando categoria para: <strong>{newTransaction.type === 'INCOME' ? 'Receita' : 'Despesa'}</strong></p>
                    <Input
                        label="Nome da Categoria"
                        placeholder="Ex: Entretenimento"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        fullWidth
                        autoFocus
                    />
                    <div className={styles.modalActions}>
                        <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>Cancelar</Button>
                        <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>Criar</Button>
                    </div>
                </div>
            </Modal>

            {/* Icon Picker Modal */}
            <Modal
                isOpen={showIconPicker}
                onClose={() => setShowIconPicker(false)}
                title="Escolher Ícone"
                size="lg"
            >
                <div className={styles.iconPickerContent}>
                    <div className={styles.iconGrid}>
                        {Object.entries(subscriptionIcons.services || {}).map(([key, service]) => (
                            <button
                                key={key}
                                className={styles.iconGridItem}
                                onClick={() => {
                                    setNewTransaction(prev => ({ ...prev, imageUrl: service.icon }));
                                    setShowIconPicker(false);
                                }}
                            >
                                <img src={service.icon} alt={service.name} className={styles.iconGridImg} />
                                <span>{service.name}</span>
                            </button>
                        ))}
                    </div>
                    <div className={styles.modalActions}>
                        <Button variant="secondary" onClick={() => setShowIconPicker(false)}>Cancelar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
