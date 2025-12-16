'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiLink, FiRefreshCw, FiPlus, FiCheckCircle, FiAlertCircle,
    FiClock, FiDollarSign, FiCreditCard, FiTrendingUp, FiTrendingDown,
    FiCalendar, FiX, FiChevronLeft, FiChevronRight, FiHome, FiShoppingBag,
    FiZap, FiCoffee, FiFilm, FiBriefcase
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import GhostAccount from '@/components/ui/GhostAccount';
import GhostMiniCard from '@/components/ui/GhostMiniCard';
import GhostConsent from '@/components/ui/GhostConsent';
import { usePrivateCurrency } from '@/components/ui/PrivateValue';
import { formatDate } from '@/utils/formatters';
import { openFinanceAPI, transactionsAPI } from '@/services/api';
import { mockTransactions } from '@/utils/mockData'; // Keep for structure reference if needed, but using API
import styles from './page.module.css';

// Mock data based on API structure
const mockConsents = [
    { id: 1, transmitterName: 'Banco Itaú', status: 'AUTHORIZED', expiresAt: '2025-06-15', scopes: ['accounts', 'credit-cards', 'transactions'] },
    { id: 2, transmitterName: 'Nubank', status: 'AUTHORIZED', expiresAt: '2025-08-20', scopes: ['accounts', 'transactions'] },
    { id: 3, transmitterName: 'XP Investimentos', status: 'EXPIRED', expiresAt: '2024-11-01', scopes: ['accounts'] },
];

const mockBankAccounts = [
    { id: 1, bankName: 'Banco Itaú', type: 'CONTA_CORRENTE', accountNumber: '12345-6', branchCode: '1234', balance: 15420.50, lastSyncAt: new Date() },
    { id: 2, bankName: 'Banco Itaú', type: 'CONTA_POUPANCA', accountNumber: '12345-7', branchCode: '1234', balance: 8500.00, lastSyncAt: new Date() },
    { id: 3, bankName: 'Nubank', type: 'CONTA_PAGAMENTO', accountNumber: '98765-4', branchCode: '0001', balance: 3250.75, lastSyncAt: new Date() },
];

const mockCreditCards = [
    {
        id: 1, bankName: 'Banco Itaú', brand: 'VISA', name: 'Platinum', lastFourDigits: '4532',
        creditLimit: 15000, availableLimit: 8500, closingDay: 15, dueDay: 25
    },
    {
        id: 2, bankName: 'Nubank', brand: 'MASTERCARD', name: 'Roxinho', lastFourDigits: '8721',
        creditLimit: 8000, availableLimit: 5200, closingDay: 1, dueDay: 10
    },
];



// Card invoice mock
const mockInvoice = {
    currentMonth: { month: 12, year: 2024, total: 2450.80, dueDate: '2024-12-25', status: 'OPEN' },
    transactions: [
        { id: 1, description: 'NETFLIX', amount: 55.90, date: '2024-12-12' },
        { id: 2, description: 'MERCADO LIVRE', amount: 299.90, date: '2024-12-11' },
        { id: 3, description: 'AMAZON PRIME', amount: 19.90, date: '2024-12-10' },
        { id: 4, description: 'UBER *TRIP', amount: 125.60, date: '2024-12-08' },
        { id: 5, description: 'RESTAURANTE', amount: 189.50, date: '2024-12-05' },
        { id: 6, description: 'POSTO IPIRANGA', amount: 250.00, date: '2024-12-03' },
        { id: 7, description: 'SUPERMERCADO', amount: 510.00, date: '2024-12-01' },
    ]
};

const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: FiHome },
    { id: 'accounts', label: 'Contas', icon: FiBriefcase },
    { id: 'cards', label: 'Cartões', icon: FiCreditCard },
    { id: 'transactions', label: 'Transações', icon: FiDollarSign },
    { id: 'consents', label: 'Consentimentos', icon: FiLink },
];

const categoryIcons = {
    'Transporte': FiCoffee,
    'Alimentação': FiShoppingBag,
    'Streaming': FiFilm,
    'Contas': FiZap,
    'Compras': FiShoppingBag,
    'Receita': FiTrendingUp,
};

export default function OpenFinancePage() {
    // Privacy-aware formatting
    const { formatCurrency } = usePrivateCurrency();

    const [activeTab, setActiveTab] = useState('overview');
    const [syncing, setSyncing] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [invoiceMonth, setInvoiceMonth] = useState({ month: 12, year: 2024 });

    const [consents, setConsents] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [creditCards, setCreditCards] = useState([]);
    const [transactions, setTransactions] = useState([]); // In a real app, this would be fetched
    const [isLoading, setIsLoading] = useState(true);

    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    // Credit is harder to mock without card data structure, assuming safe defaults
    const totalCredit = creditCards.reduce((sum, c) => sum + (parseFloat(c.usedLimit || 0)), 0);

    const [showWarningModal, setShowWarningModal] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [consentsRes, accountsRes, cardsRes, transactionsRes] = await Promise.all([
                openFinanceAPI.listConsents(),
                openFinanceAPI.listAccounts(),
                openFinanceAPI.listCards().catch(() => ({ data: [] })),
                transactionsAPI.list() // Fetch all transactions
            ]);

            const loadedConsents = consentsRes?.data || [];
            setConsents(loadedConsents);
            setAccounts(accountsRes?.data || []);

            // Credit cards from API
            const loadedCards = cardsRes?.data || [];
            setCreditCards(loadedCards);
            // Set first card as selected if available
            if (loadedCards.length > 0 && !selectedCard) {
                setSelectedCard(loadedCards[0]);
            }

            // Filter for Open Finance transactions if possible (assuming 'source' field or similar)
            // For now, loading all, but ideally backend should filter or we filter by source='OPEN_FINANCE'
            // If 'source' doesn't exist, we might show all or filter by non-MANUAL
            const allTransactions = transactionsRes?.data?.transactions || [];
            // Assuming we want to show transactions related to connected accounts
            // Use client-side filtering logic if needed, e.g. t.source === 'OPEN_FINANCE'
            const ofTransactions = allTransactions.filter(t => t.source === 'OPEN_FINANCE');

            // Fallback to all if no OF specific found (for demo/dev) or show empty
            setTransactions(ofTransactions.length > 0 ? ofTransactions : []);

            // Check if no connected accounts/consents

            // Check if no connected accounts/consents
            if (loadedConsents.length === 0) {
                setShowWarningModal(true);
            }

        } catch (error) {
            console.error("Error loading open finance data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        await new Promise(r => setTimeout(r, 2000));
        setSyncing(false);
    };

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                {/* Header */}
                <div className={styles.pageHeader}>
                    <div className={styles.headerLeft}>
                        <h1>Open Finance</h1>
                        <span className={styles.badge}>{consents.filter(c => c.status === 'AUTHORIZED').length} bancos conectados</span>
                    </div>
                    <div className={styles.headerActions}>
                        <button className={styles.syncBtn} onClick={handleSync} disabled={syncing}>
                            <FiRefreshCw className={syncing ? styles.spinning : ''} />
                            {syncing ? 'Sincronizando...' : 'Sincronizar'}
                        </button>
                        <button className={styles.primaryBtn} onClick={() => setShowConnectModal(true)}>
                            <FiPlus /> Conectar Banco
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    {tabs.map(tab => {
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

                {/* Content */}
                <div className={styles.content}>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.overviewGrid}>
                            <div className={styles.summaryCards}>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Saldo Total</span>
                                    <span className={styles.summaryValue}>{formatCurrency(totalBalance)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Fatura Aberta</span>
                                    <span className={`${styles.summaryValue} ${styles.danger}`}>-{formatCurrency(totalCredit)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Patrimônio Líquido</span>
                                    <span className={styles.summaryValue}>{formatCurrency(totalBalance - totalCredit)}</span>
                                </div>
                            </div>

                            <div className={styles.quickView}>
                                <div className={styles.quickSection}>
                                    <h3>Contas</h3>
                                    {accounts.length > 0 ? (
                                        accounts.slice(0, 3).map(acc => (
                                            <div key={acc.id} className={styles.quickItem}>
                                                <div className={styles.quickInfo}>
                                                    <span className={styles.quickName}>{acc.bankName} - {acc.type.replace('_', ' ')}</span>
                                                    <span className={styles.quickMeta}>Ag {acc.branchCode} • C/C {acc.accountNumber}</span>
                                                </div>
                                                <span className={styles.quickValue}>{formatCurrency(acc.balance)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.ghostQuickItem} onClick={() => setShowConnectModal(true)}>
                                            <div className={styles.ghostQuickIcon}>
                                                <FiDollarSign />
                                            </div>
                                            <div className={styles.ghostQuickInfo}>
                                                <span className={styles.ghostQuickTitle}>Adicionar Conta</span>
                                                <span className={styles.ghostQuickHint}>Conecte seu banco via Open Finance</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.quickSection}>
                                    <h3>Cartões</h3>
                                    {creditCards.length > 0 ? (
                                        creditCards.map(card => (
                                            <div key={card.id} className={styles.quickItem} onClick={() => { setSelectedCard(card); setActiveTab('cards'); }}>
                                                <div className={styles.quickInfo}>
                                                    <span className={styles.quickName}>{card.bankName} {card.brand}</span>
                                                    <span className={styles.quickMeta}>•••• {card.lastFourDigits} • Vence dia {card.dueDay}</span>
                                                </div>
                                                <span className={`${styles.quickValue} ${styles.danger}`}>
                                                    -{formatCurrency(card.creditLimit - card.availableLimit)}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.ghostQuickItem} onClick={() => setShowConnectModal(true)}>
                                            <div className={styles.ghostCardPreview}>
                                                <div className={styles.ghostCardVisual}>
                                                    <FiCreditCard />
                                                    <span>•••• ••••</span>
                                                </div>
                                            </div>
                                            <div className={styles.ghostQuickInfo}>
                                                <span className={styles.ghostQuickTitle}>Sincronizar Cartão</span>
                                                <span className={styles.ghostQuickHint}>Conecte seus cartões via Open Finance</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Accounts Tab */}
                    {activeTab === 'accounts' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.accountsGrid}>
                            {accounts.map(acc => (
                                <div key={acc.id} className={styles.accountCard}>
                                    <div className={styles.accountHeader}>
                                        <span className={styles.accountBank}>{acc.bankName}</span>
                                        <span className={`${styles.accountType} ${styles[acc.type.toLowerCase().replace('_', '')]}`}>
                                            {acc.type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className={styles.accountDetails}>
                                        <span>Agência: {acc.branchCode}</span>
                                        <span>Conta: {acc.accountNumber}</span>
                                    </div>
                                    <span className={styles.accountBalance}>{formatCurrency(acc.balance)}</span>
                                    <span className={styles.accountSync}>
                                        <FiClock /> Sincronizado agora
                                    </span>
                                </div>
                            ))}
                            {/* Ghost Account */}
                            <GhostAccount onClick={() => setShowConnectModal(true)} />
                        </motion.div>
                    )}

                    {/* Cards Tab */}
                    {activeTab === 'cards' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.cardsLayout}>
                            {/* Cards List */}
                            <div className={styles.cardsList}>
                                <h3>Cartões Open Finance</h3>
                                {creditCards.map(card => (
                                    <button
                                        key={card.id}
                                        className={`${styles.cardItem} ${selectedCard?.id === card.id ? styles.selected : ''}`}
                                        onClick={() => setSelectedCard(card)}
                                    >
                                        <div className={styles.cardVisual} style={{ background: card.brand === 'VISA' ? '#1a1f71' : '#eb001b' }}>
                                            <span className={styles.cardBrand}>{card.brand}</span>
                                            <span className={styles.cardDigits}>•••• {card.lastFourDigits}</span>
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <span className={styles.cardName}>{card.bankName} {card.name}</span>
                                            <div className={styles.cardLimits}>
                                                <span>Usado: {formatCurrency(card.creditLimit - card.availableLimit)}</span>
                                                <span>Limite: {formatCurrency(card.creditLimit)}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {/* Ghost Mini Card */}
                                <GhostMiniCard onClick={() => setShowConnectModal(true)} />
                            </div>

                            {/* Invoice View */}
                            <div className={styles.invoiceSection}>
                                {selectedCard ? (
                                    <>
                                        <div className={styles.invoiceHeader}>
                                            <h3>Fatura {selectedCard.bankName}</h3>
                                            <div className={styles.monthSelector}>
                                                <button onClick={() => setInvoiceMonth(prev => ({ ...prev, month: prev.month - 1 }))}>
                                                    <FiChevronLeft />
                                                </button>
                                                <span>{monthNames[invoiceMonth.month - 1]} {invoiceMonth.year}</span>
                                                <button onClick={() => setInvoiceMonth(prev => ({ ...prev, month: prev.month + 1 }))}>
                                                    <FiChevronRight />
                                                </button>
                                            </div>
                                        </div>

                                        <div className={styles.invoiceSummary}>
                                            <div className={styles.invoiceTotal}>
                                                <span className={styles.invoiceLabel}>Total da Fatura</span>
                                                <span className={styles.invoiceValue}>{formatCurrency(mockInvoice.currentMonth.total)}</span>
                                            </div>
                                            <div className={styles.invoiceMeta}>
                                                <div>
                                                    <span>Vencimento</span>
                                                    <strong>{formatDate(mockInvoice.currentMonth.dueDate)}</strong>
                                                </div>
                                                <div>
                                                    <span>Status</span>
                                                    <strong className={styles.statusOpen}>Aberta</strong>
                                                </div>
                                                <div>
                                                    <span>Fechamento</span>
                                                    <strong>Dia {selectedCard.closingDay}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.invoiceTransactions}>
                                            <h4>Lançamentos</h4>
                                            {mockInvoice.transactions.map(tx => (
                                                <div key={tx.id} className={styles.invoiceTx}>
                                                    <div className={styles.invoiceTxInfo}>
                                                        <span className={styles.invoiceTxDesc}>{tx.description}</span>
                                                        <span className={styles.invoiceTxDate}>{formatDate(tx.date)}</span>
                                                    </div>
                                                    <span className={styles.invoiceTxAmount}>{formatCurrency(tx.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.emptyState}>
                                        <FiCreditCard />
                                        <p>Selecione um cartão para ver a fatura</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Transactions Tab */}
                    {activeTab === 'transactions' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.transactionsLayout}>
                            <div className={styles.transactionsList}>
                                {transactions.length > 0 ? (
                                    transactions.map(tx => {
                                        const Icon = categoryIcons[tx.category] || FiDollarSign;
                                        return (
                                            <div key={tx.id} className={styles.transactionItem}>
                                                <div className={`${styles.txIcon} ${tx.type === 'CREDIT' ? styles.credit : styles.debit}`}>
                                                    {tx.type === 'CREDIT' ? <FiTrendingUp /> : <Icon />}
                                                </div>
                                                <div className={styles.txDetails}>
                                                    <span className={styles.txDesc}>{tx.description}</span>
                                                    <span className={styles.txMeta}>
                                                        {tx.category} • {tx.sourceType === 'CREDIT_CARD' ? 'Cartão' : 'Conta'} • {formatDate(tx.date)}
                                                    </span>
                                                </div>
                                                <span className={`${styles.txAmount} ${tx.type === 'CREDIT' ? styles.credit : styles.debit}`}>
                                                    {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className={styles.emptyState}>
                                        <p>Nenhuma transação encontrada</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Consents Tab */}
                    {activeTab === 'consents' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.consentsLayout}>
                            {consents.map(consent => (
                                <div key={consent.id} className={styles.consentCard}>
                                    <div className={styles.consentHeader}>
                                        <span className={styles.consentBank}>{consent.transmitterName}</span>
                                        <span className={`${styles.consentStatus} ${styles[consent.status.toLowerCase()]}`}>
                                            {consent.status === 'AUTHORIZED' ? <><FiCheckCircle /> Ativo</> : <><FiAlertCircle /> Expirado</>}
                                        </span>
                                    </div>
                                    <div className={styles.consentScopes}>
                                        {consent.scopes.map(scope => (
                                            <span key={scope} className={styles.scope}>{scope}</span>
                                        ))}
                                    </div>
                                    <div className={styles.consentFooter}>
                                        <span><FiCalendar /> Expira em {formatDate(consent.expiresAt)}</span>
                                        {consent.status === 'AUTHORIZED' && (
                                            <button className={styles.revokeBtn}>Revogar</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {/* Ghost Consent */}
                            <GhostConsent onClick={() => setShowConnectModal(true)} />
                        </motion.div>
                    )}
                </div>
            </main>

            <Dock />

            {/* Connect Modal */}
            <Modal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} title="Conectar Instituição" size="sm">
                <div className={styles.connectList}>
                    {['Banco Itaú', 'Nubank', 'Bradesco', 'Santander', 'Banco do Brasil', 'XP Investimentos'].map(bank => (
                        <button key={bank} className={styles.connectItem}>
                            <FiBriefcase />
                            <span>{bank}</span>
                            <FiChevronRight />
                        </button>
                    ))}
                </div>
            </Modal>

            {/* Warning Modal */}
            <Modal isOpen={showWarningModal} onClose={() => setShowWarningModal(false)} title="Nenhuma conexão encontrada" size="sm">
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <FiAlertCircle size={48} color="var(--warning)" style={{ marginBottom: '16px' }} />
                    <p style={{ marginBottom: '24px', opacity: 0.8 }}>
                        Você ainda não possui nenhuma conta bancária conectada via Open Finance.
                        Conecte suas contas para ter uma visão completa das suas finanças.
                    </p>
                    <div className={styles.modalActions}>
                        <Button variant="secondary" onClick={() => setShowWarningModal(false)}>Agora não</Button>
                        <Button onClick={() => { setShowWarningModal(false); setShowConnectModal(true); }}>Conectar Banco</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
