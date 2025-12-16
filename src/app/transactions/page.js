'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FiPlus, FiFilter, FiCalendar, FiTrendingUp, FiTrendingDown, FiEdit, FiTrash2,
    FiRepeat, FiCreditCard, FiDollarSign, FiLayers, FiTarget, FiAlertCircle, FiX
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
import { mockTransactions } from '@/utils/mockData';
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
    const [customDate, setCustomDate] = useState({ start: '', end: '' });

    const [showFilters, setShowFilters] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const [transactionMode, setTransactionMode] = useState('single');
    const [newTransaction, setNewTransaction] = useState({
        type: 'EXPENSE',
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
        frequency: 'MONTHLY',
        cardId: '',
        installments: ''
    });

    // Constants
    const dateFilters = [
        { id: 'today', label: 'Hoje' },
        { id: 'week', label: '7 dias' },
        { id: 'month', label: 'Este Mês' },
        { id: 'year', label: 'Este Ano' },
        { id: 'custom', label: 'Personalizado' }
    ];

    const types = ['Todas', 'INCOME', 'EXPENSE'];

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

                const [txRes, catRes, cardsRes] = await Promise.all([
                    transactionsAPI.list({ startDate: startStr, endDate: endStr }),
                    transactionsAPI.getCategories(),
                    cardsAPI.list() // Fetch cards
                ]);

                // Apply local filters that API might not cover or for instant UI updates
                let filtered = txRes?.data?.transactions || [];

                // Note: Better to filter on backend, but filtering here for interaction speed if dataset is small
                if (filterType !== 'Todas') {
                    filtered = filtered.filter(t => t.type === filterType);
                }
                if (filterCategory !== 'Todas') {
                    filtered = filtered.filter(t => t.category === filterCategory);
                }
                if (filterCard === 'card-only') {
                    filtered = filtered.filter(t => t.cardId);
                } else if (filterCard === 'no-card') {
                    filtered = filtered.filter(t => !t.cardId);
                }

                setTransactions(filtered);
                setApiCategories(catRes?.data || []);
                setCards(cardsRes?.data || []); // Set cards
            } catch (error) {
                console.error("Error loading transactions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [filterDate, filterType, filterCategory, filterCard, customDate]);

    // Derived totals
    const totals = transactions.reduce((acc, tx) => {
        const amount = parseFloat(tx.amount);
        if (tx.type === 'INCOME') acc.income += amount;
        else acc.expense += amount;
        return acc;
    }, { income: 0, expense: 0 });

    const handleAddTransaction = async () => {
        try {
            await transactionsAPI.create({
                ...newTransaction,
                amount: parseFloat(newTransaction.amount),
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
            date: new Date().toISOString().split('T')[0],
            isRecurring: false,
            frequency: 'MONTHLY',
            cardId: '',
            installments: '',
        });
        setTransactionMode('single');
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
                            <button className={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
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

                    {/* Summary */}
                    <motion.div
                        className={styles.summaryRow}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card variant="glass" className={styles.summaryCard}>
                            <FiTrendingUp className={styles.incomeIcon} />
                            <div>
                                <span className={styles.summaryLabel}>Receitas</span>
                                <span className={`${styles.summaryValue} ${styles.income}`}>{formatCurrency(totals.income)}</span>
                            </div>
                        </Card>
                        <Card variant="glass" className={styles.summaryCard}>
                            <FiTrendingDown className={styles.expenseIcon} />
                            <div>
                                <span className={styles.summaryLabel}>Despesas</span>
                                <span className={`${styles.summaryValue} ${styles.expense}`}>{formatCurrency(totals.expense)}</span>
                            </div>
                        </Card>
                        <Card variant="glass" className={styles.summaryCard}>
                            <div className={styles.balanceIcon}>B</div>
                            <div>
                                <span className={styles.summaryLabel}>Saldo</span>
                                <span className={`${styles.summaryValue} ${totals.income - totals.expense >= 0 ? styles.income : styles.expense}`}>
                                    {formatCurrency(totals.income - totals.expense)}
                                </span>
                            </div>
                        </Card>
                    </motion.div>

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
                                            {type === 'INCOME' ? 'Receitas' : type === 'EXPENSE' ? 'Despesas' : type}
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
                                            className={styles.transactionItem}
                                            variants={item}
                                        >
                                            <div className={`${styles.transactionIcon} ${tx.type === 'INCOME' ? styles.income : styles.expense}`}>
                                                {tx.isRecurring ? <FiRepeat /> : tx.type === 'INCOME' ? <FiTrendingUp /> : <FiTrendingDown />}
                                            </div>
                                            <div className={styles.transactionInfo}>
                                                <span className={styles.transactionDesc}>{tx.description}</span>
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
                                                <span className={tx.type === 'INCOME' ? styles.income : styles.expense}>
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

                    <div className={styles.formRow}>
                        <Input
                            label="Valor"
                            type="number"
                            placeholder="0,00"
                            leftIcon={<FiDollarSign />}
                            value={newTransaction.amount}
                            onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                        />
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Categoria</label>
                            <select
                                className={styles.selectInput}
                                value={newTransaction.category}
                                onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                            >
                                <option value="">Selecione...</option>
                                {categories.filter(c => c !== 'Todas').map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Input
                        label="Data"
                        type="date"
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                        fullWidth
                    />

                    {/* Recurring Options */}
                    {transactionMode === 'recurring' && (
                        <div className={styles.recurringSection}>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>Frequência</label>
                                <select
                                    className={styles.selectInput}
                                    value={newTransaction.frequency}
                                    onChange={(e) => setNewTransaction(prev => ({ ...prev, frequency: e.target.value }))}
                                >
                                    <option value="WEEKLY">Semanal</option>
                                    <option value="MONTHLY">Mensal</option>
                                    <option value="YEARLY">Anual</option>
                                </select>
                            </div>
                            <span className={styles.helperText}>Esta transação será repetida automaticamente.</span>
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

                    {/* Card Selection - ALWAYS VISIBLE FOR EXPENSES */}
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
        </div>
    );
}
