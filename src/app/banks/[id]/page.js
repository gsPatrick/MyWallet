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
    FiPieChart
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import AppShell from '@/components/AppShell';
import bankAccountService from '@/services/bankAccountService';
import { goalsAPI, cardsAPI, transactionsAPI } from '@/services/api';
import styles from './page.module.css';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

const tabs = [
    { id: 'summary', label: 'Resumo', icon: FiPieChart },
    { id: 'cards', label: 'Cartões', icon: FiCreditCard },
    { id: 'transactions', label: 'Transações', icon: FiActivity },
    { id: 'goals', label: 'Metas', icon: FiTarget }
];

import CardModal from '@/components/modals/CardModal';

export default function BankDetailPage() {
    const params = useParams();
    const router = useRouter();
    const accountId = params.id;

    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('summary');
    const [showCardModal, setShowCardModal] = useState(false);

    // Tab data
    const [cards, setCards] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loadingTab, setLoadingTab] = useState(false);

    // Statistics
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        reservedForGoals: 0
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
                case 'cards':
                    const cardsRes = await cardsAPI.list();
                    // Filter cards linked to this bank account
                    const linkedCards = (cardsRes?.data || []).filter(
                        card => card.bankAccountId === accountId
                    );
                    setCards(linkedCards);
                    break;

                case 'transactions':
                    const txRes = await transactionsAPI.list({ bankAccountId: accountId });
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
                        .filter(t => t.type === 'INCOME')
                        .reduce((s, t) => s + parseFloat(t.amount || 0), 0);
                    const expenses = accountTx
                        .filter(t => t.type === 'EXPENSE')
                        .reduce((s, t) => s + parseFloat(t.amount || 0), 0);
                    const reserved = accountGoals.reduce(
                        (s, g) => s + parseFloat(g.currentAmount || 0), 0
                    );

                    setStats({ totalIncome: income, totalExpenses: expenses, reservedForGoals: reserved });
                    setGoals(accountGoals);
                    break;
                }
            }
        } catch (err) {
            console.error(`Erro ao carregar dados da tab ${tab}:`, err);
        } finally {
            setLoadingTab(false);
        }
    }, [accountId]);

    useEffect(() => {
        if (accountId) {
            loadAccount();
        }
    }, [accountId, loadAccount]);

    useEffect(() => {
        if (account && activeTab) {
            loadTabData(activeTab);
        }
    }, [account, activeTab, loadTabData]);

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
                                        <div className={styles.summaryGrid}>
                                            <div className={styles.statCard}>
                                                <FiTrendingUp className={styles.iconSuccess} />
                                                <div>
                                                    <span className={styles.statLabel}>Entradas (mês)</span>
                                                    <span className={styles.statValue}>{formatCurrency(stats.totalIncome)}</span>
                                                </div>
                                            </div>
                                            <div className={styles.statCard}>
                                                <FiTrendingDown className={styles.iconDanger} />
                                                <div>
                                                    <span className={styles.statLabel}>Saídas (mês)</span>
                                                    <span className={styles.statValue}>{formatCurrency(stats.totalExpenses)}</span>
                                                </div>
                                            </div>
                                            <div className={styles.statCard}>
                                                <FiTarget className={styles.iconPrimary} />
                                                <div>
                                                    <span className={styles.statLabel}>Reservado (metas)</span>
                                                    <span className={styles.statValue}>{formatCurrency(stats.reservedForGoals)}</span>
                                                </div>
                                            </div>
                                            <div className={styles.statCard}>
                                                <FiDollarSign className={styles.iconWarning} />
                                                <div>
                                                    <span className={styles.statLabel}>Disponível</span>
                                                    <span className={styles.statValue}>{formatCurrency(availableBalance)}</span>
                                                </div>
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
                                                cards.map(card => (
                                                    <div key={card.id} className={styles.cardItem} style={{ '--card-color': card.color }}>
                                                        <div className={styles.cardInfo}>
                                                            <span className={styles.cardName}>{card.name}</span>
                                                            <span className={styles.cardDigits}>**** {card.lastFourDigits}</span>
                                                        </div>
                                                        <span className={styles.cardLimit}>
                                                            Limite: {formatCurrency(card.creditLimit)}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {/* TRANSACTIONS TAB */}
                                    {activeTab === 'transactions' && (
                                        <div className={styles.transactionsList}>
                                            {transactions.length === 0 ? (
                                                <div className={styles.emptyTab}>
                                                    <FiActivity />
                                                    <p>Nenhuma transação nesta conta</p>
                                                    <Link href="/transactions?new=true" className={styles.linkBtn}>
                                                        Adicionar Transação
                                                    </Link>
                                                </div>
                                            ) : (
                                                transactions.slice(0, 20).map(tx => (
                                                    <div key={tx.id} className={styles.txItem}>
                                                        <div className={styles.txInfo}>
                                                            <span className={styles.txDescription}>{tx.description}</span>
                                                            <span className={styles.txDate}>
                                                                {new Date(tx.date).toLocaleDateString('pt-BR')}
                                                            </span>
                                                        </div>
                                                        <span className={`${styles.txAmount} ${tx.type === 'INCOME' ? styles.income : styles.expense}`}>
                                                            {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount)}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                            {transactions.length > 20 && (
                                                <Link href={`/transactions?bankAccountId=${accountId}`} className={styles.viewMoreLink}>
                                                    Ver todas ({transactions.length})
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
