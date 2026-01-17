'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    FiPlus, FiFilter, FiCalendar, FiTrendingUp, FiTrendingDown, FiEdit, FiTrash2,
    FiRepeat, FiCreditCard, FiDollarSign, FiLayers, FiTarget, FiAlertCircle, FiX,
    FiClock, FiPieChart, FiCheck
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import AppShell from '@/components/AppShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import BudgetExceededModal from '@/components/modals/BudgetExceededModal';
import CategoryModal from '@/components/modals/CategoryModal';
import BankAccountModal from '@/components/modals/BankAccountModal';
import QuickTransactionModal from '@/components/modals/QuickTransactionModal';
import { usePrivateCurrency } from '@/components/ui/PrivateValue';

import { formatDate } from '@/utils/formatters';
import { transactionsAPI, cardsAPI, budgetsAPI } from '@/services/api';
import categoriesService from '@/services/categoriesService';
import bankAccountService from '@/services/bankAccountService';
import { mockTransactions } from '@/utils/mockData';
import subscriptionIcons from '@/data/subscriptionIcons.json';
import cardBanks from '@/data/cardBanks.json';
import { getBrandIcon } from '@/hooks/useBrandIcon';
import { detectBrand } from '@/utils/brandDetection';
import styles from './page.module.css';


function TransactionsContent() {
    // URL params for auto-open modal
    const searchParams = useSearchParams();
    const router = useRouter();

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
    const [filterBank, setFilterBank] = useState('all');
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
    // Removed inline category state in favor of component
    const [categoryList, setCategoryList] = useState([]);

    // Bank Accounts for selector
    const [bankAccounts, setBankAccounts] = useState([]);
    const [defaultBankAccountId, setDefaultBankAccountId] = useState('');

    // Budget Allocations for linking
    const [budgetAllocations, setBudgetAllocations] = useState([]);

    // Budget Exceeded Modal state
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [budgetExceededData, setBudgetExceededData] = useState(null);
    const [pendingTransaction, setPendingTransaction] = useState(null);
    const [showBankModal, setShowBankModal] = useState(false);



    // Edit and Delete states
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [deleteSuccess, setDeleteSuccess] = useState(false);

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
        bankAccountId: '', // Bank account for balance tracking
        brandKey: '', // For brand detection
        autoDetectedBrand: false // Flag to track if icon was auto-detected
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

    // Auto-open modal from URL param
    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            setShowAddModal(true);
        }
    }, [searchParams]);

    // Debug: Log bank accounts when modal opens
    useEffect(() => {
        if (showAddModal) {
            console.log('🏦 [TRANSACTIONS MODAL] Bank Accounts:', bankAccounts);
            console.log('🏦 [TRANSACTIONS MODAL] Default Bank ID:', defaultBankAccountId);
        }
    }, [showAddModal, bankAccounts, defaultBankAccountId]);

    // Auto-fill bankAccountId when default account is loaded (low friction UX)
    useEffect(() => {
        if (defaultBankAccountId && !newTransaction.bankAccountId) {
            setNewTransaction(prev => ({ ...prev, bankAccountId: defaultBankAccountId }));
        }
    }, [defaultBankAccountId]);

    // 🎯 Real-time Brand Detection
    // Detecta marca enquanto usuário digita e auto-preenche ícone
    useEffect(() => {
        if (!newTransaction.description || newTransaction.description.length < 3) return;

        // Só auto-detecta se o usuário não escolheu manualmente um ícone
        if (newTransaction.autoDetectedBrand === false || newTransaction.imageUrl === '') {
            const detected = detectBrand(newTransaction.description);
            if (detected && detected.icon) {
                setNewTransaction(prev => ({
                    ...prev,
                    imageUrl: detected.icon,
                    brandKey: detected.brandKey,
                    autoDetectedBrand: true
                }));
            }
        }
    }, [newTransaction.description]);

    // Load data from API - Extracted to be reusable as callback
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

            const [txRes, catRes, cardsRes, categoriesRes, allocationsRes, bankAccountsRes] = await Promise.all([
                transactionsAPI.list({ startDate: startStr, endDate: endStr }),
                transactionsAPI.getCategories(),
                cardsAPI.list(),
                categoriesService.list(),
                budgetsAPI.getCurrentAllocations().catch(() => ({ data: { allocations: [] } })),
                bankAccountService.list().catch((err) => { console.error('Bank accounts fetch error:', err); return []; })
            ]);

            console.log('🏦 [TRANSACTIONS] Raw bankAccountsRes:', bankAccountsRes);

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
            if (filterBank !== 'all') {
                filtered = filtered.filter(t => t.bankAccountId === filterBank);
            }

            // Filter by recurring if selected
            if (filterType === 'RECURRING') {
                filtered = filtered.filter(t => t.isRecurring || t.subscriptionId);
            }

            setTransactions(filtered);
            setCards(cardsRes.data || []);
            setApiCategories(categoriesRes?.data || []);
            setCategoryList(categoriesRes?.data || []);

            // Bank accounts with default
            // bankAccountService.list() returns array directly, not { data: [] }
            const accounts = Array.isArray(bankAccountsRes) ? bankAccountsRes : (bankAccountsRes?.data || []);

            // Hydrate with dictionary data for dynamic icons
            const hydratedAccounts = accounts.map(acc => {
                const dictionaryEntry = cardBanks.banks[acc.bankCode?.toLowerCase()] ||
                    Object.values(cardBanks.banks).find(b => b.name === acc.bankName) ||
                    Object.values(cardBanks.banks).find(b => b.name === acc.nickname);
                return {
                    ...acc,
                    icon: dictionaryEntry?.icon || acc.icon,
                    color: dictionaryEntry?.color || acc.color
                };
            });

            console.log('🏦 [TRANSACTIONS] Parsed accounts:', hydratedAccounts);
            setBankAccounts(hydratedAccounts);
            const defaultAcc = accounts.find(a => a.isDefault) || accounts[0];
            if (defaultAcc) {
                setDefaultBankAccountId(defaultAcc.id);
            }
            setBudgetAllocations(allocationsRes?.data?.allocations || []);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load and filter changes
    useEffect(() => {
        loadData();
    }, [filterDate, filterType, filterCategory, filterCard, filterBank, filterStatus, customDate]);

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

    const handleAddTransaction = async (forceOverbudget = false) => {
        // Validation for Subscriptions (Recurring)
        if (transactionMode === 'recurring' && newTransaction.type === 'EXPENSE' && !newTransaction.cardId) {
            alert("Assinaturas (recorrentes) devem estar obrigatoriamente associadas a um cartão de crédito.");
            return;
        }

        try {
            // Parse amount: "1.000,00" -> 1000.00
            const rawAmount = parseFloat(newTransaction.amount.replace(/\./g, '').replace(',', '.'));

            const payload = {
                ...newTransaction,
                amount: rawAmount,
                isRecurring: transactionMode === 'recurring',
                installments: transactionMode === 'installment' ? { current: 1, total: parseInt(newTransaction.installments) } : null,
                forceOverbudget
            };

            if (editingTransaction) {
                // Update existing transaction
                await transactionsAPI.update(editingTransaction.id, payload);
            } else {
                // Create new transaction
                await transactionsAPI.create(payload);
            }

            setShowAddModal(false);
            setEditingTransaction(null);
            resetForm();
            setShowBudgetModal(false);
            setBudgetExceededData(null);
            setPendingTransaction(null);
            // Reload transactions - extract array from response
            const txRes = await transactionsAPI.list();
            setTransactions(txRes?.data?.transactions || []);
        } catch (error) {
            // Check if this is a BUDGET_EXCEEDED error
            // Error is already response.data due to api.js interceptor
            const errorData = error;

            if (errorData?.code === 'BUDGET_EXCEEDED' && errorData?.budgetData) {
                // Save pending transaction and show budget modal
                const rawAmount = parseFloat(newTransaction.amount.replace(/\./g, '').replace(',', '.'));
                setPendingTransaction({
                    ...newTransaction,
                    amount: rawAmount,
                    isRecurring: transactionMode === 'recurring',
                    installments: transactionMode === 'installment' ? { current: 1, total: parseInt(newTransaction.installments) } : null
                });
                setBudgetExceededData(errorData.budgetData);
                setShowBudgetModal(true);
                return;
            }

            const message = errorData?.error || errorData?.message || (typeof errorData === 'string' ? errorData : 'Erro desconhecido');
            alert("Error creating transaction: " + message);
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
            bankAccountId: defaultBankAccountId, // Pre-fill with default account (low friction)
        });
        setTransactionMode('single');
    };

    // Callback when category is created via modal
    const handleCategoryCreated = (newCat) => {
        if (newCat) {
            setCategoryList(prev => [...prev, newCat]);
            setNewTransaction(prev => ({ ...prev, categoryId: newCat.id, category: newCat.name }));
        }
    };

    const handleBankCreated = async () => {
        // Reload bank accounts
        try {
            const res = await bankAccountService.list();
            setBankAccounts(res.data || []);
            // Auto-select the last added account (assuming it's at the end or we find it)
            // Ideally backend returns the new account, but for now just reload
        } catch (error) {
            console.error("Failed to reload bank accounts:", error);
        }
    };

    const getCardName = (cardId) => {
        // Implementation would need cards loaded or card name in transaction object
        return "Cartão";
    };

    // Handle Edit Transaction
    const handleEdit = (tx) => {
        setEditingTransaction(tx);
        setNewTransaction({
            type: tx.type,
            description: tx.description,
            amount: tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            category: tx.category || '',
            categoryId: tx.categoryId || '',
            date: tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0],
            isRecurring: tx.isRecurring || false,
            frequency: tx.frequency || 'MONTHLY',
            recurringDay: tx.recurringDay || '',
            status: tx.status || 'COMPLETED',
            cardId: tx.cardId || '',
            installments: tx.installments?.total?.toString() || '',
            imageUrl: tx.imageUrl || '',
            bankAccountId: tx.bankAccountId || defaultBankAccountId,
        });
        setTransactionMode(tx.isRecurring ? 'recurring' : tx.installments ? 'installment' : 'single');
        setShowAddModal(true);
    };

    // Handle Delete Transaction
    const handleDelete = async () => {
        if (!transactionToDelete) return;
        try {
            await transactionsAPI.delete(transactionToDelete.id);
            setShowDeleteModal(false);
            setTransactionToDelete(null);
            setDeleteSuccess(true);
            // Reload transactions - extract array from response
            const txRes = await transactionsAPI.list();
            setTransactions(txRes?.data?.transactions || []);
            // Hide success message after 3 seconds
            setTimeout(() => setDeleteSuccess(false), 3000);
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Erro ao excluir transação: ' + (error.message || 'Erro desconhecido'));
        }
    };

    // Open delete confirmation
    const openDeleteModal = (tx) => {
        setTransactionToDelete(tx);
        setShowDeleteModal(true);
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
                            <div className={styles.desktopOnly}>
                                <Button
                                    leftIcon={<FiFilter />}
                                    size="lg"
                                    variant="secondary"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={showFilters ? styles.activeFilter : ''}
                                >
                                    Filtros
                                </Button>
                            </div>
                            <Button
                                leftIcon={<FiRepeat />}
                                size="lg"
                                onClick={() => router.push('/banks?transfer=true')}
                                variant="secondary"
                            >
                                Transferir
                            </Button>
                            <Button
                                leftIcon={<FiPlus />}
                                size="lg"
                                onClick={() => setShowAddModal(true)}
                            >
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



                    {/* Filter Trigger Button (Mobile Only) */}
                    <div className={`${styles.filterTriggerContainer} ${styles.mobileOnly}`}>
                        <Button
                            leftIcon={<FiFilter />}
                            size="lg"
                            fullWidth
                            variant="secondary"
                            onClick={() => setShowFilters(!showFilters)}
                            className={showFilters ? styles.activeFilter : ''}
                        >
                            Filtros
                        </Button>
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


                            {/* Bank Account Filter */}
                            <div className={styles.filterSection}>
                                <label className={styles.filterSectionLabel}>Banco / Conta</label>
                                <select
                                    className={styles.filterSelect}
                                    value={filterBank}
                                    onChange={(e) => setFilterBank(e.target.value)}
                                >
                                    <option value="all">Todas as Contas</option>
                                    {bankAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.nickname || acc.bankName}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Filter */}

                            {/* Category Filter */}
                            <div className={styles.filterSection}>
                                <label className={styles.filterSectionLabel}>Categoria</label>
                                <select
                                    className={styles.filterSelect}
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    {categories.map(cat => {
                                        const isObj = typeof cat === 'object';
                                        const value = isObj ? cat.id : cat;
                                        const label = isObj ? cat.name : cat;
                                        return (
                                            <option key={value} value={value}>{label}</option>
                                        );
                                    })}
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
                                    transactions.map((tx) => {
                                        // Resolve icon: 1. DB/API 2. Subscription 3. BrandKey 4. Detect from Text
                                        const detectedBrand = detectBrand(tx.description);
                                        const brandIcon = tx.imageUrl || tx.icon || tx.subscription?.icon || getBrandIcon(tx.brandKey) || detectedBrand?.icon;

                                        return (
                                            <motion.div
                                                key={tx.id}
                                                className={`${styles.transactionItem} ${tx.status === 'PENDING' ? styles.pendingItem : ''}`}
                                                variants={item}
                                            >
                                                <div
                                                    className={`${styles.transactionIcon} ${tx.type === 'INCOME' ? styles.income : styles.expense}`}
                                                    style={{ background: brandIcon ? 'transparent' : undefined }}
                                                >
                                                    {brandIcon ? (
                                                        <img
                                                            src={brandIcon}
                                                            alt={tx.description}
                                                            className={styles.brandLogos || styles.brandLogo} // Use brandLogo class if exists or fallback
                                                        />
                                                    ) : (
                                                        tx.type === 'INCOME' ? <FiTrendingUp /> : <FiTrendingDown />
                                                    )}
                                                </div>
                                                <div className={styles.transactionInfo}>
                                                    <div className={styles.descRow}>
                                                        <span className={styles.transactionDesc}>{tx.description}</span>
                                                        {(tx.status === 'PENDING' || tx.status === 'PAID' && tx.source === 'CARD' && new Date(tx.date) > new Date()) && <span className={styles.pendingBadge}><FiClock /> Agendado</span>}
                                                        {(new Date(tx.date) > new Date() && tx.status !== 'PENDING' && tx.status !== 'PAID') && (
                                                            <span className={styles.futureBadge}>Futuro</span>
                                                        )}
                                                    </div>
                                                    <div className={styles.transactionMeta}>
                                                        <span className={styles.transactionCategory}>{tx.category}</span>
                                                        {tx.isRecurring && (
                                                            <span className={styles.recurringBadge}><FiRepeat /> Recorrente</span>
                                                        )}
                                                        {(tx.subscriptionId || tx.source === 'SUBSCRIPTION') && (
                                                            <span className={styles.recurringBadge}><FiCheck /> Assinatura</span>
                                                        )}
                                                        {/* Show card name for card transactions */}
                                                        {tx.source === 'CARD' && tx.sourceType && (
                                                            <span className={styles.cardBadge}><FiCreditCard /> {tx.sourceType}</span>
                                                        )}
                                                        {/* Show Bank Account for manual transactions */}
                                                        {(!tx.cardId && tx.bankAccountId) && (
                                                            (() => {
                                                                const acc = bankAccounts.find(a => a.id === tx.bankAccountId);
                                                                return acc ? (
                                                                    <span className={styles.bankBadge}><FiHome /> {acc.nickname || acc.bankName}</span>
                                                                ) : null;
                                                            })()
                                                        )}
                                                        {tx.installments && (
                                                            <span className={styles.installmentBadge}>
                                                                <FiLayers /> {tx.installments.current}/{tx.installments.total}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles.transactionAmount}>
                                                    <span className={`${tx.type === 'INCOME' ? styles.income : styles.expense} ${(tx.status === 'PENDING' || tx.status === 'PAID') ? styles.pendingText : ''}`}>
                                                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                    </span>
                                                    <span className={styles.transactionDateHighlight}>
                                                        {formatDate(tx.date)}
                                                    </span>
                                                </div>
                                                {
                                                    (tx.source === 'MANUAL' || tx.source === 'CARD') && (
                                                        <div className={styles.transactionActions}>
                                                            <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); handleEdit(tx); }} title="Editar"><FiEdit /></button>
                                                            <button className={`${styles.actionBtn} ${styles.danger}`} onClick={(e) => { e.stopPropagation(); openDeleteModal(tx); }} title="Excluir"><FiTrash2 /></button>
                                                        </div>
                                                    )
                                                }
                                            </motion.div>
                                        );
                                    })
                                )}
                            </motion.div>
                        )}
                    </Card>
                </div>
            </main >

            <Dock />

            {/* Add Transaction Modal - Using unified QuickTransactionModal component */}
            <QuickTransactionModal
                isOpen={showAddModal && !editingTransaction}
                onClose={() => { setShowAddModal(false); resetForm(); }}
                onSuccess={loadData}
            />

            {/* Budget Exceeded Modal */}
            <BudgetExceededModal
                isOpen={showBudgetModal}
                onClose={() => {
                    setShowBudgetModal(false);
                    setBudgetExceededData(null);
                    setPendingTransaction(null);
                }}
                onConfirm={() => handleAddTransaction(true)}
                budgetData={budgetExceededData}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setTransactionToDelete(null); }}
                title="Confirmar Exclusão"
                size="sm"
            >
                <div style={{ padding: '1rem 0', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Tem certeza que deseja excluir a transação <strong>"{transactionToDelete?.description}"</strong>?
                    </p>
                    <p style={{ color: 'var(--accent-danger)', fontSize: '0.875rem' }}>
                        Esta ação não pode ser desfeita.
                    </p>
                </div>
                <div className={styles.modalActions}>
                    <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setTransactionToDelete(null); }}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Excluir
                    </Button>
                </div>
            </Modal>

            {/* Delete Success Toast */}
            {
                deleteSuccess && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        style={{
                            position: 'fixed',
                            top: 'calc(var(--header-height) + 16px)',
                            right: '24px',
                            background: 'var(--accent-success)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 9999
                        }}
                    >
                        <FiCheck /> Transação excluída com sucesso!
                    </motion.div>
                )
            }
        </div >
    );
}

// Loading fallback
function TransactionsLoading() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <FiTrendingUp style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    );
}

// Export with Suspense boundary
export default function TransactionsPage() {
    return (
        <Suspense fallback={<TransactionsLoading />}>
            <TransactionsContent />
        </Suspense>
    );
}

