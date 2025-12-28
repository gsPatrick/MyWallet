'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiPlus, FiCreditCard, FiCalendar, FiRepeat, FiEdit2, FiTrash2,
    FiX, FiDollarSign, FiTag, FiClock, FiLink, FiChevronLeft, FiChevronRight,
    FiBarChart2, FiSliders, FiShoppingBag, FiCoffee, FiHome, FiTruck, FiMusic, FiFilm,
    FiFileText
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

import CreditCard from '@/components/ui/CreditCard/CreditCard';
import GhostCard from '@/components/ui/GhostCard';
import CardModal from '@/components/modals/CardModal';
import SubscriptionModal from '@/components/modals/SubscriptionModal';
import FutureFeatureModal from '@/components/modals/FutureFeatureModal';
import InvoicePaymentModal from '@/components/modals/InvoicePaymentModal';
import { usePrivateCurrency } from '@/components/ui/PrivateValue';
import { formatDate } from '@/utils/formatters';
import { cardsAPI, subscriptionsAPI, openFinanceAPI, transactionsAPI, bankAccountsAPI } from '@/services/api';
import invoiceService, { getStatusInfo, formatInvoicePeriod } from '@/services/invoiceService';
import cardBanks from '@/data/cardBanks.json';
import subscriptionData from '@/data/subscriptionIcons.json';
import styles from './page.module.css';

// Open Finance cards mock
const mockOpenFinanceCards = [
    {
        id: 'of1', bankName: 'Banco Itaú', brand: 'VISA', name: 'Platinum', lastFourDigits: '4532',
        creditLimit: 15000, availableLimit: 8500, closingDay: 15, dueDay: 25, color: '#1a1f71'
    },
    {
        id: 'of2', bankName: 'Nubank', brand: 'MASTERCARD', name: 'Roxinho', lastFourDigits: '8721',
        creditLimit: 8000, availableLimit: 5200, closingDay: 1, dueDay: 10, color: '#820AD1'
    },
];

const mockInvoiceData = {
    'of1': {
        total: 6500,
        dueDate: '2024-12-25',
        status: 'OPEN',
        transactions: [
            { id: 1, description: 'NETFLIX', amount: 55.90, date: '2024-12-12', installments: null },
            { id: 2, description: 'MERCADO LIVRE', amount: 299.90, date: '2024-12-11', installments: '3/12' },
            { id: 3, description: 'AMAZON PRIME', amount: 19.90, date: '2024-12-10', installments: null },
            { id: 4, description: 'UBER *TRIP', amount: 125.60, date: '2024-12-08', installments: null },
            { id: 5, description: 'RESTAURANTE', amount: 189.50, date: '2024-12-05', installments: null },
            { id: 6, description: 'POSTO IPIRANGA', amount: 250.00, date: '2024-12-03', installments: null },
            { id: 7, description: 'SUPERMERCADO EXTRA', amount: 510.00, date: '2024-12-01', installments: null },
        ]
    },
    'of2': {
        total: 2800,
        dueDate: '2024-12-10',
        status: 'OPEN',
        transactions: [
            { id: 1, description: 'PAG*IFOOD', amount: 89.50, date: '2024-12-14', installments: null },
            { id: 2, description: 'SPOTIFY', amount: 21.90, date: '2024-12-10', installments: null },
            { id: 3, description: 'UBER *TRIP', amount: 45.00, date: '2024-12-08', installments: null },
            { id: 4, description: 'APPLE.COM/BILL', amount: 37.90, date: '2024-12-04', installments: null },
        ]
    }
};

// Invoice data for manual cards
const mockManualInvoice = {
    total: 3200,
    dueDate: '2024-12-28',
    status: 'OPEN',
    transactions: [
        { id: 1, description: 'FARMÁCIA', amount: 85.90, date: '2024-12-13', installments: null },
        { id: 2, description: 'SHOPPING', amount: 450.00, date: '2024-12-10', installments: '2/6' },
        { id: 3, description: 'DENTISTA', amount: 300.00, date: '2024-12-08', installments: null },
        { id: 4, description: 'ACADEMIA', amount: 149.90, date: '2024-12-05', installments: null },
    ]
};

// Invoice state
export default function CardsPage() {
    // Privacy-aware formatting
    const { formatCurrency } = usePrivateCurrency();

    const [cards, setCards] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('cards');
    const [showCardModal, setShowCardModal] = useState(false);
    const [showSubModal, setShowSubModal] = useState(false);
    const [showFutureModal, setShowFutureModal] = useState(false);

    // Edit states
    const [editingCard, setEditingCard] = useState(null);
    const [editingSub, setEditingSub] = useState(null);

    const [selectedCard, setSelectedCard] = useState(null);
    const [invoiceMonth, setInvoiceMonth] = useState({ month: 12, year: 2024 });
    const [invoiceViewMode, setInvoiceViewMode] = useState('list'); // 'list' or 'charts' or 'limits' or 'subscriptions'
    const [editingLimitValue, setEditingLimitValue] = useState('');
    const [sliderValue, setSliderValue] = useState(0);
    const [cardTransactions, setCardTransactions] = useState([]);
    const [cardSubscriptions, setCardSubscriptions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [showDeleteCardModal, setShowDeleteCardModal] = useState(false);
    const [subscriptionCardFilter, setSubscriptionCardFilter] = useState('ALL'); // ALL or cardId
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Invoice states
    const [invoiceHistory, setInvoiceHistory] = useState([]);
    const [currentInvoiceData, setCurrentInvoiceData] = useState(null);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [cardsRes, subsRes, banksRes] = await Promise.all([
                    cardsAPI.list(),
                    subscriptionsAPI.list(),
                    bankAccountsAPI.list()
                ]);
                console.log('💳 [CARDS PAGE] Cards from API:', cardsRes?.data);
                console.log('📋 [CARDS PAGE] Subscriptions from API:', subsRes?.data);
                console.log('🏦 [CARDS PAGE] Bank Accounts from API:', banksRes?.data);
                setCards(cardsRes?.data || []);
                setSubscriptions(subsRes?.data || []);
                setBankAccounts(banksRes?.data || []);
            } catch (error) {
                console.error("Error loading cards:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const totalSubscriptions = subscriptions.reduce((sum, s) => sum + parseFloat(s.amount), 0);
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const openCardModal = (card = null) => {
        setEditingCard(card);
        setShowCardModal(true);
    };

    const openSubModal = (sub = null) => {
        setEditingSub(sub);
        setShowSubModal(true);
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [cardsRes, subsRes, banksRes] = await Promise.all([
                cardsAPI.list(),
                subscriptionsAPI.list(),
                bankAccountsAPI.list()
            ]);
            setCards(cardsRes?.data || []);
            setSubscriptions(subsRes?.data || []);
            setBankAccounts(banksRes?.data || []);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveCard = async (payload, editId) => {
        try {
            if (editId) {
                await cardsAPI.update(editId, payload);
            } else {
                await cardsAPI.create(payload);
            }
            setShowCardModal(false);
            setEditingCard(null);
            loadData();
        } catch (error) {
            console.error("Error saving card:", error);
            alert("Erro ao salvar cartão.");
        }
    };

    const handleSaveSub = async (payload, editId) => {
        console.log('📦 [CARDS PAGE] handleSaveSub called');
        console.log('📦 [CARDS PAGE] Payload:', payload);
        console.log('📦 [CARDS PAGE] Payload cardId:', payload.cardId, '| Type:', typeof payload.cardId);
        console.log('📦 [CARDS PAGE] Edit ID:', editId);
        console.log('📦 [CARDS PAGE] Available cards:', cards);
        try {
            if (editId) {
                console.log('📦 [CARDS PAGE] Updating subscription...');
                const result = await subscriptionsAPI.update(editId, payload);
                console.log('📦 [CARDS PAGE] Update result:', result);
            } else {
                console.log('📦 [CARDS PAGE] Creating new subscription...');
                const result = await subscriptionsAPI.create(payload);
                console.log('📦 [CARDS PAGE] Create result:', result);
            }
            setShowSubModal(false);
            setEditingSub(null);
            loadData();
        } catch (error) {
            console.error("❌ [CARDS PAGE] Error saving subscription:", error);
            alert("Erro ao salvar assinatura.");
        }
    };

    const handleSetBillingDay = (day) => {
        if (!day || day < 1 || day > 31) return;
        const today = new Date();
        const currentDay = today.getDate();
        let nextDate = new Date(today.getFullYear(), today.getMonth(), day);

        // If day has passed this month, move to next month
        if (day < currentDay) {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }

        setSubForm(prev => ({
            ...prev,
            nextBillingDate: nextDate.toISOString().split('T')[0]
        }));
    };

    const handleStartToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setSubForm(prev => ({ ...prev, nextBillingDate: today }));
    };

    // Handle Open Finance Connection
    const handleConnectOpenFinance = async () => {
        setShowFutureModal(true);
    };

    // Handle card click to show invoice
    const handleCardClick = async (card, source = 'manual') => {
        setSelectedCard({ ...card, source });
        setInvoiceMonth({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
        setInvoiceViewMode('list');

        // Load real transactions for this card
        setLoadingTransactions(true);
        setLoadingInvoices(true);
        try {
            const [txRes, invoiceRes, historyRes] = await Promise.all([
                transactionsAPI.list({ cardId: card.id, limit: 100 }),
                invoiceService.getCurrentInvoice(card.id).catch(() => null),
                invoiceService.listInvoices(card.id, { limit: 12 }).catch(() => ({ invoices: [] }))
            ]);

            setCardTransactions(txRes?.data?.transactions || []);
            setCurrentInvoiceData(invoiceRes);
            setInvoiceHistory(historyRes?.invoices || []);

            // Filter subscriptions for this card
            const cardSubs = subscriptions.filter(s => s.cardId === card.id);
            setCardSubscriptions(cardSubs);
        } catch (error) {
            console.error("Error loading card data:", error);
            setCardTransactions([]);
            setCardSubscriptions([]);
            setCurrentInvoiceData(null);
            setInvoiceHistory([]);
        } finally {
            setLoadingTransactions(false);
            setLoadingInvoices(false);
        }
    };

    const closeInvoice = () => {
        setSelectedCard(null);
        setInvoiceViewMode('list');
        setCardTransactions([]);
        setCardSubscriptions([]);
        setCurrentInvoiceData(null);
        setInvoiceHistory([]);
    };

    // Open payment modal
    const openPaymentModal = (invoice = null) => {
        setSelectedInvoiceForPayment(invoice || currentInvoiceData);
        setShowPaymentModal(true);
    };

    // Handle payment complete
    const handlePaymentComplete = async (result) => {
        // Reload invoice data
        if (selectedCard) {
            try {
                const [invoiceRes, historyRes] = await Promise.all([
                    invoiceService.getCurrentInvoice(selectedCard.id),
                    invoiceService.listInvoices(selectedCard.id)
                ]);
                setCurrentInvoiceData(invoiceRes);
                setInvoiceHistory(historyRes?.invoices || []);
            } catch (err) {
                console.error('Error reloading invoices:', err);
            }
        }
    };

    // Handle edit card from invoice view
    const handleEditCardFromInvoice = () => {
        setEditingCard(selectedCard);
        setShowCardModal(true);
    };

    // Handle delete card
    const handleDeleteCard = async () => {
        if (!selectedCard) return;
        try {
            await cardsAPI.deactivate(selectedCard.id);
            setShowDeleteCardModal(false);
            setSelectedCard(null);
            loadData();
        } catch (error) {
            console.error("Error deleting card:", error);
            alert("Erro ao excluir cartão.");
        }
    };

    // Open limits view
    const openLimitsView = () => {
        if (!selectedCard) return;
        // Format the limit value to Brazilian format (e.g., 9000 -> "9.000,00")
        const formattedLimit = selectedCard.creditLimit.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        setEditingLimitValue(formattedLimit);
        setSliderValue(selectedCard.availableLimit);
        setInvoiceViewMode('limits');
    };

    // Helper: Format currency for display (Brazilian format)
    const formatLimitInput = (value) => {
        const onlyNumbers = value.replace(/\D/g, '');
        if (!onlyNumbers) return '';
        const cents = parseInt(onlyNumbers, 10);
        return (cents / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Helper: Parse formatted value back to number
    const parseLimitValue = (formatted) => {
        if (!formatted) return 0;
        const number = formatted.replace(/\./g, '').replace(',', '.');
        return parseFloat(number) || 0;
    };

    // Handle limit input change
    const handleLimitInputChange = (e) => {
        const formatted = formatLimitInput(e.target.value);
        setEditingLimitValue(formatted);
        // When limit changes, recalculate available = new limit - used amount
        const newLimit = parseLimitValue(formatted);
        const usedAmount = selectedCard.creditLimit - selectedCard.availableLimit;
        const newAvailable = Math.max(0, newLimit - usedAmount);
        // Always update slider to reflect new available amount
        setSliderValue(newAvailable);
    };

    // Handle slider change
    const handleSliderChange = (e) => {
        setSliderValue(parseFloat(e.target.value));
    };

    // Handle save limits
    const handleSaveLimits = async () => {
        if (!selectedCard) return;
        const newLimit = parseLimitValue(editingLimitValue);
        const newAvailable = sliderValue;
        const usedAmount = selectedCard.creditLimit - selectedCard.availableLimit;
        const newBlocked = Math.max(0, newLimit - usedAmount - newAvailable);

        try {
            await cardsAPI.update(selectedCard.id, {
                creditLimit: newLimit,
                availableLimit: newAvailable,
                blockedLimit: newBlocked
            });
            setSelectedCard(prev => ({
                ...prev,
                creditLimit: newLimit,
                availableLimit: newAvailable,
                blockedLimit: newBlocked
            }));
            setInvoiceViewMode('list');
            loadData();
        } catch (error) {
            console.error("Error updating limits:", error);
            alert("Erro ao atualizar limites.");
        }
    };

    // Group transactions by date (day of week)
    const groupTransactionsByDate = (transactions) => {
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const groups = {};

        transactions.forEach(tx => {
            const date = new Date(tx.date);
            const dayName = dayNames[date.getDay()];
            const dateKey = `${date.getDate()}/${date.getMonth() + 1}`;
            const key = `${dayName} - ${dateKey}`;

            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(tx);
        });

        return groups;
    };

    // Get icon for transaction category
    const getCategoryIcon = (description, category) => {
        const desc = description?.toLowerCase() || '';
        if (desc.includes('spotify') || desc.includes('music')) return <FiMusic />;
        if (desc.includes('netflix') || desc.includes('amazon') || desc.includes('disney')) return <FiFilm />;
        if (desc.includes('uber') || desc.includes('99') || desc.includes('taxi')) return <FiTruck />;
        if (desc.includes('mercado') || desc.includes('supermercado') || desc.includes('carrefour')) return <FiShoppingBag />;
        if (desc.includes('restaurante') || desc.includes('ifood') || desc.includes('padaria')) return <FiCoffee />;
        if (desc.includes('aluguel') || desc.includes('condominio')) return <FiHome />;
        return <FiCreditCard />;
    };

    // Mock chart data for spending by month
    const getChartData = () => {
        const months = ['AGO', 'SET', 'OUT', 'NOV', 'DEZ', 'JAN', 'FEV', 'MAR'];
        const year = ['24', '24', '24', '24', '24', '25', '25', '25'];
        return months.map((m, i) => ({
            month: m,
            year: year[i],
            value: Math.random() * 2000 + 500,
            isCurrent: i === 4 // DEZ is current
        }));
    };

    // Get current invoice data
    const getInvoiceData = () => {
        if (!selectedCard) return null;
        if (selectedCard.source === 'openfinance') {
            return mockInvoiceData[selectedCard.id] || mockManualInvoice;
        }
        return mockManualInvoice;
    };

    const currentInvoice = getInvoiceData();

    return (
        <div className={styles.pageWrapper}>
            <Header />

            <main className={styles.main}>
                <FutureFeatureModal
                    isOpen={showFutureModal}
                    onClose={() => setShowFutureModal(false)}
                />
                <div className={styles.container}>
                    {/* Page Header */}
                    <motion.div
                        className={styles.pageHeader}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className={styles.headerText}>
                            <h1 className={styles.pageTitle}>Cartões & Assinaturas</h1>
                            <p className={styles.pageSubtitle}>Gerencie seus cartões e gastos recorrentes</p>
                        </div>
                        {activeTab === 'cards' && !selectedCard && (
                            <Button leftIcon={<FiPlus />} size="lg" onClick={() => openCardModal()}>Novo Cartão</Button>
                        )}
                        {activeTab === 'openfinance' && !selectedCard && (
                            <button className={styles.linkBtn} onClick={() => setShowFutureModal(true)}>
                                <FiLink /> Gerenciar Conexões
                            </button>
                        )}
                        {activeTab === 'subscriptions' && (
                            <Button leftIcon={<FiPlus />} size="lg" onClick={() => openSubModal()}>Nova Assinatura</Button>
                        )}
                        {selectedCard && (
                            <Button variant="secondary" leftIcon={<FiChevronLeft />} onClick={closeInvoice}>
                                Voltar
                            </Button>
                        )}
                    </motion.div>

                    {/* Tabs - hide when viewing invoice */}
                    {!selectedCard && (
                        <motion.div className={styles.tabs} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                            <button className={`${styles.tab} ${activeTab === 'cards' ? styles.active : ''}`} onClick={() => setActiveTab('cards')}>
                                <FiCreditCard /> Meus Cartões
                            </button>
                            <button className={`${styles.tab} ${activeTab === 'openfinance' ? styles.active : ''}`} onClick={() => setShowFutureModal(true)}>
                                <FiLink /> Open Finance
                            </button>
                            <button className={`${styles.tab} ${activeTab === 'subscriptions' ? styles.active : ''}`} onClick={() => setActiveTab('subscriptions')}>
                                <FiRepeat /> Assinaturas
                                <span className={styles.tabBadge}>{formatCurrency(totalSubscriptions)}/mês</span>
                            </button>
                        </motion.div>
                    )}

                    {/* Invoice View */}
                    {selectedCard && currentInvoice && (
                        <motion.div
                            className={styles.invoiceView}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            {/* Card Preview */}
                            <div className={styles.invoiceCard}>
                                <CreditCard
                                    name={selectedCard.name}
                                    brand={selectedCard.brand}
                                    lastFourDigits={selectedCard.lastFourDigits}
                                    creditLimit={selectedCard.creditLimit}
                                    availableLimit={selectedCard.availableLimit}
                                    blockedLimit={selectedCard.blockedLimit || 0}
                                    closingDay={selectedCard.closingDay}
                                    dueDay={selectedCard.dueDay}
                                    color={selectedCard.color}
                                    holderName={selectedCard?.holderName || "NOME DO TITULAR"}
                                    validThru="12/28"
                                />

                                {/* Action Buttons - Bank Style */}
                                <div className={styles.actionButtons}>
                                    <button
                                        className={`${styles.actionBtn} ${invoiceViewMode === 'list' || invoiceViewMode === 'charts' ? styles.active : ''}`}
                                        onClick={() => setInvoiceViewMode('list')}
                                    >
                                        <div className={styles.actionIcon}>
                                            <FiCreditCard />
                                        </div>
                                        <span>Fatura</span>
                                    </button>
                                    <button
                                        className={`${styles.actionBtn} ${invoiceViewMode === 'subscriptions' ? styles.active : ''}`}
                                        onClick={() => setInvoiceViewMode('subscriptions')}
                                    >
                                        <div className={styles.actionIcon}>
                                            <FiRepeat />
                                        </div>
                                        <span>Assinaturas</span>
                                    </button>
                                    <button
                                        className={`${styles.actionBtn} ${invoiceViewMode === 'history' ? styles.active : ''}`}
                                        onClick={() => setInvoiceViewMode('history')}
                                    >
                                        <div className={styles.actionIcon}>
                                            <FiFileText />
                                        </div>
                                        <span>Histórico</span>
                                    </button>
                                    <button
                                        className={`${styles.actionBtn} ${invoiceViewMode === 'limits' ? styles.active : ''}`}
                                        onClick={openLimitsView}
                                    >
                                        <div className={styles.actionIcon}>
                                            <FiSliders />
                                        </div>
                                        <span>Limites</span>
                                    </button>
                                    <button
                                        className={styles.actionBtn}
                                        onClick={handleEditCardFromInvoice}
                                    >
                                        <div className={styles.actionIcon}>
                                            <FiEdit2 />
                                        </div>
                                        <span>Editar</span>
                                    </button>
                                    <button
                                        className={`${styles.actionBtn} ${styles.danger}`}
                                        onClick={() => setShowDeleteCardModal(true)}
                                    >
                                        <div className={styles.actionIcon}>
                                            <FiTrash2 />
                                        </div>
                                        <span>Apagar</span>
                                    </button>
                                </div>
                            </div>

                            {/* Invoice Details */}
                            <div className={styles.invoiceDetails}>
                                {/* Header with Month Selector and View Toggle - Only in fatura views */}
                                {(invoiceViewMode === 'list' || invoiceViewMode === 'charts') && (
                                    <>
                                        <div className={styles.invoiceHeader}>
                                            <div className={styles.monthPill}>
                                                <button onClick={() => setInvoiceMonth(p => ({ ...p, month: Math.max(1, p.month - 1) }))}>
                                                    <FiChevronLeft />
                                                </button>
                                                <span>{monthNames[invoiceMonth.month - 1]} de {invoiceMonth.year}</span>
                                                <button onClick={() => setInvoiceMonth(p => ({ ...p, month: Math.min(12, p.month + 1) }))}>
                                                    <FiChevronRight />
                                                </button>
                                            </div>
                                            <button
                                                className={`${styles.viewToggle} ${invoiceViewMode === 'charts' ? styles.active : ''}`}
                                                onClick={() => setInvoiceViewMode(invoiceViewMode === 'charts' ? 'list' : 'charts')}
                                            >
                                                <FiBarChart2 /> Gráfico
                                            </button>
                                        </div>

                                        {/* Invoice Summary */}
                                        <div className={styles.invoiceSummary}>
                                            <div className={styles.invoiceMain}>
                                                <div className={`${styles.invoiceStatus} ${styles[currentInvoice.status.toLowerCase()]}`}>
                                                    {currentInvoice.status === 'OPEN' ? 'Fatura aberta' : 'Fatura fechada'}
                                                </div>
                                                <div className={styles.invoiceTotal}>
                                                    <span className={styles.invoiceValue}>{formatCurrency(currentInvoice.total)}</span>
                                                </div>
                                                <div className={styles.invoiceDue}>
                                                    Vencimento • {formatDate(currentInvoice.dueDate)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Charts View */}
                                        {invoiceViewMode === 'charts' && (
                                            <div className={styles.chartsSection}>
                                                <div className={styles.chartContainer}>
                                                    {getChartData().map((bar, idx) => (
                                                        <div key={idx} className={styles.chartBar}>
                                                            <div
                                                                className={`${styles.bar} ${bar.isCurrent ? styles.currentBar : ''}`}
                                                                style={{ height: `${(bar.value / 2500) * 100}%` }}
                                                            />
                                                            <span className={styles.barLabel}>
                                                                {bar.month} {bar.year}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className={styles.chartLegend}>
                                                    <div className={styles.legendItem}>
                                                        <span className={styles.legendDot} />
                                                        <span>Gastos mensais</span>
                                                    </div>
                                                    <div className={`${styles.legendItem} ${styles.current}`}>
                                                        <span className={styles.legendDot} />
                                                        <span>Mês atual</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Limits Summary - 4 Rows */}
                                        <div className={styles.limitsSummary}>
                                            <div className={styles.limitsInfoRows}>
                                                <div className={styles.limitsRow}>
                                                    <span>Limite Total</span>
                                                    <strong>{formatCurrency(selectedCard.creditLimit)}</strong>
                                                </div>
                                                <div className={styles.limitsRow}>
                                                    <span>Disponível</span>
                                                    <strong style={{ color: '#10b981' }}>{formatCurrency(selectedCard.availableLimit)}</strong>
                                                </div>
                                                <div className={styles.limitsRow}>
                                                    <span>Bloqueado</span>
                                                    <strong style={{ color: '#f59e0b' }}>{formatCurrency(selectedCard.blockedLimit || 0)}</strong>
                                                </div>
                                                <div className={styles.limitsRow}>
                                                    <span>Utilizado</span>
                                                    <strong style={{ color: '#6b7280' }}>{formatCurrency(selectedCard.creditLimit - selectedCard.availableLimit - (selectedCard.blockedLimit || 0))}</strong>
                                                </div>
                                            </div>
                                            <div className={styles.limitsBar}>
                                                <div
                                                    className={styles.limitsUsed}
                                                    style={{
                                                        width: `${((selectedCard.creditLimit - selectedCard.availableLimit - (selectedCard.blockedLimit || 0)) / selectedCard.creditLimit) * 100}%`
                                                    }}
                                                />
                                            </div>
                                            <div className={styles.limitsFooter}>
                                                <span>{Math.round(((selectedCard.creditLimit - selectedCard.availableLimit - (selectedCard.blockedLimit || 0)) / selectedCard.creditLimit) * 100)}% utilizado</span>
                                                <span>Fecha dia {selectedCard.closingDay} • Vence dia {selectedCard.dueDay}</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Transactions List - Grouped by Day */}
                                {invoiceViewMode === 'list' && (
                                    <div className={styles.invoiceTransactions}>
                                        <h3>Lançamentos ({cardTransactions.length})</h3>

                                        {loadingTransactions ? (
                                            <div className={styles.loadingTx}>Carregando transações...</div>
                                        ) : cardTransactions.length > 0 ? (
                                            Object.entries(groupTransactionsByDate(cardTransactions)).map(([dateGroup, txs]) => (
                                                <div key={dateGroup} className={styles.txGroup}>
                                                    <div className={styles.txGroupHeader}>{dateGroup}</div>
                                                    <div className={styles.transactionsList}>
                                                        {txs.map(tx => (
                                                            <div key={tx.id} className={styles.txItem}>
                                                                <div className={styles.txIcon}>
                                                                    {getCategoryIcon(tx.description)}
                                                                </div>
                                                                <div className={styles.txInfo}>
                                                                    <span className={styles.txDesc}>{tx.description}</span>
                                                                    <span className={styles.txTime}>
                                                                        {formatDate(tx.date)}
                                                                        {tx.installments && <span className={styles.installment}>{tx.currentInstallment}/{tx.installments}</span>}
                                                                    </span>
                                                                </div>
                                                                <span className={styles.txAmount}>{formatCurrency(tx.amount)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className={styles.emptyTx}>
                                                <FiCreditCard />
                                                <p>Nenhum lançamento neste cartão</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Subscriptions View */}
                                {invoiceViewMode === 'subscriptions' && (
                                    <div className={styles.subscriptionsView}>
                                        <div className={styles.subsViewHeader}>
                                            <h3>Assinaturas do Cartão</h3>
                                            <span className={styles.subsTotal}>
                                                Total: {formatCurrency(cardSubscriptions.reduce((sum, s) => sum + parseFloat(s.amount), 0))}/mês
                                            </span>
                                        </div>

                                        {cardSubscriptions.length > 0 ? (
                                            <div className={styles.subsViewList}>
                                                {cardSubscriptions.map(sub => {
                                                    // Dynamic lookup for subscription icon
                                                    const subKey = Object.keys(subscriptionData.subscriptions || {}).find(key =>
                                                        subscriptionData.subscriptions[key].name === sub.name
                                                    );
                                                    const dictionarySub = subKey ? subscriptionData.subscriptions[subKey] : null;
                                                    const displayIcon = dictionarySub?.icon || sub.icon;
                                                    const displayColor = dictionarySub?.color || sub.color;

                                                    return (
                                                        <div key={sub.id} className={styles.subsViewItem} style={{ borderLeft: `3px solid ${displayColor || 'transparent'}` }}>
                                                            <div className={styles.subsViewIcon}>
                                                                {displayIcon ? (
                                                                    displayIcon.startsWith('http') || displayIcon.startsWith('/') ? (
                                                                        <img src={displayIcon} alt={sub.name} />
                                                                    ) : (
                                                                        <span>{displayIcon}</span>
                                                                    )
                                                                ) : (
                                                                    <FiRepeat />
                                                                )}
                                                            </div>
                                                            <div className={styles.subsViewInfo}>
                                                                <span className={styles.subsViewName}>{sub.name}</span>
                                                                <span className={styles.subsViewFreq}>
                                                                    {sub.billingCycle === 'MONTHLY' ? 'Mensal' :
                                                                        sub.billingCycle === 'YEARLY' ? 'Anual' :
                                                                            sub.billingCycle === 'WEEKLY' ? 'Semanal' : sub.billingCycle}
                                                                </span>
                                                            </div>
                                                            <span className={styles.subsViewAmount}>
                                                                {formatCurrency(sub.amount)}<small>/mês</small>
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className={styles.emptyTx}>
                                                <FiRepeat />
                                                <p>Nenhuma assinatura vinculada a este cartão</p>
                                                <Button variant="secondary" onClick={() => openSubModal()}>
                                                    Adicionar Assinatura
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Invoice History View */}
                                {invoiceViewMode === 'history' && (
                                    <div className={styles.historyView}>
                                        <div className={styles.historyHeader}>
                                            <button
                                                className={styles.backBtn}
                                                onClick={() => setInvoiceViewMode('list')}
                                            >
                                                <FiChevronLeft /> Voltar
                                            </button>
                                            <h3>Histórico de Faturas</h3>
                                        </div>

                                        {/* Current Invoice Summary */}
                                        {currentInvoiceData && (
                                            <div className={styles.currentInvoiceCard}>
                                                <div className={styles.invoiceCardHeader}>
                                                    <span className={styles.invoiceLabel}>Fatura Atual</span>
                                                    <span
                                                        className={styles.invoiceStatusBadge}
                                                        style={{ backgroundColor: getStatusInfo(currentInvoiceData.status).color }}
                                                    >
                                                        {getStatusInfo(currentInvoiceData.status).emoji} {getStatusInfo(currentInvoiceData.status).label}
                                                    </span>
                                                </div>
                                                <div className={styles.invoiceAmounts}>
                                                    <div className={styles.invoiceAmountRow}>
                                                        <span>Total</span>
                                                        <strong>{formatCurrency(currentInvoiceData.totalAmount)}</strong>
                                                    </div>
                                                    {currentInvoiceData.paidAmount > 0 && (
                                                        <div className={styles.invoiceAmountRow}>
                                                            <span>Pago</span>
                                                            <strong style={{ color: '#10b981' }}>{formatCurrency(currentInvoiceData.paidAmount)}</strong>
                                                        </div>
                                                    )}
                                                    <div className={styles.invoiceAmountRow}>
                                                        <span>Restante</span>
                                                        <strong style={{ color: '#6366f1' }}>{formatCurrency(currentInvoiceData.remainingAmount)}</strong>
                                                    </div>
                                                </div>
                                                {currentInvoiceData.dueDate && (
                                                    <div className={styles.invoiceDueInfo}>
                                                        📅 Vence em: <strong>{new Date(currentInvoiceData.dueDate).toLocaleDateString('pt-BR')}</strong>
                                                    </div>
                                                )}
                                                {currentInvoiceData.remainingAmount > 0 && (
                                                    <Button
                                                        variant="primary"
                                                        size="lg"
                                                        onClick={() => openPaymentModal(currentInvoiceData)}
                                                        style={{ marginTop: '1rem', width: '100%' }}
                                                    >
                                                        <FiDollarSign /> Pagar Fatura
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        {/* Invoice History List */}
                                        <div className={styles.historyList}>
                                            <h4>Faturas Anteriores</h4>
                                            {loadingInvoices ? (
                                                <div className={styles.loadingTx}>Carregando histórico...</div>
                                            ) : invoiceHistory.length > 0 ? (
                                                <div className={styles.invoiceHistoryItems}>
                                                    {invoiceHistory.map(inv => {
                                                        const statusInfo = getStatusInfo(inv.status);
                                                        return (
                                                            <div key={inv.id} className={styles.invoiceHistoryItem}>
                                                                <div className={styles.invoiceHistoryLeft}>
                                                                    <span className={styles.invoiceHistoryPeriod}>
                                                                        {formatInvoicePeriod(inv.referenceMonth, inv.referenceYear)}
                                                                    </span>
                                                                    <span
                                                                        className={styles.invoiceHistoryStatus}
                                                                        style={{ color: statusInfo.color }}
                                                                    >
                                                                        {statusInfo.emoji} {statusInfo.label}
                                                                    </span>
                                                                </div>
                                                                <div className={styles.invoiceHistoryRight}>
                                                                    <span className={styles.invoiceHistoryAmount}>
                                                                        {formatCurrency(inv.totalAmount)}
                                                                    </span>
                                                                    {inv.remainingAmount > 0 && inv.status !== 'PAID' && (
                                                                        <button
                                                                            className={styles.paySmallBtn}
                                                                            onClick={() => openPaymentModal(inv)}
                                                                        >
                                                                            Pagar
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className={styles.emptyTx}>
                                                    <FiFileText />
                                                    <p>Nenhuma fatura encontrada</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Limits View - Inline */}
                                {invoiceViewMode === 'limits' && (
                                    <div className={styles.limitsView}>
                                        <div className={styles.limitsViewHeader}>
                                            <button
                                                className={styles.backBtn}
                                                onClick={() => setInvoiceViewMode('list')}
                                            >
                                                <FiChevronLeft /> Voltar
                                            </button>
                                            <h3>Meus Limites</h3>
                                        </div>

                                        <div className={styles.limitsEditSection}>
                                            <div className={styles.limitInputGroup}>
                                                <label>Limite liberado pelo banco</label>
                                                <div className={styles.limitInputWrapper}>
                                                    <span className={styles.currencyPrefix}>R$</span>
                                                    <input
                                                        type="text"
                                                        value={editingLimitValue}
                                                        onChange={handleLimitInputChange}
                                                        placeholder="0,00"
                                                        className={styles.limitInput}
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.sliderSection}>
                                                <label>
                                                    {sliderValue > 0 ? (
                                                        <>Limite Disponível: <strong style={{ color: '#10b981' }}>{formatCurrency(sliderValue)}</strong></>
                                                    ) : (
                                                        <span style={{ color: '#ef4444' }}>-{formatCurrency(Math.abs(sliderValue))} • Sem limite para uso</span>
                                                    )}
                                                </label>

                                                {/* Visual Bar: Used (gray) | Blocked (orange/yellow) | Available (green) */}
                                                <div className={styles.limitBarContainer}>
                                                    {/* Used segment (gray - fixed) */}
                                                    <div
                                                        className={styles.limitBarUsed}
                                                        style={{
                                                            width: `${((selectedCard.creditLimit - selectedCard.availableLimit) / (parseLimitValue(editingLimitValue) || 1)) * 100}%`
                                                        }}
                                                    />
                                                    {/* Blocked + Available track */}
                                                    <div className={styles.limitBarTrack}>
                                                        {/* Available segment (green) - controlled by slider */}
                                                        <div
                                                            className={styles.limitBarAvailable}
                                                            style={{
                                                                width: `${(sliderValue / (Math.max(1, parseLimitValue(editingLimitValue) - (selectedCard.creditLimit - selectedCard.availableLimit)))) * 100}%`
                                                            }}
                                                        />
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max={Math.max(0, parseLimitValue(editingLimitValue) - (selectedCard.creditLimit - selectedCard.availableLimit))}
                                                            step="100"
                                                            value={sliderValue}
                                                            onChange={(e) => setSliderValue(parseFloat(e.target.value))}
                                                            className={styles.rangeSlider}
                                                        />
                                                    </div>
                                                </div>

                                                <div className={styles.sliderLabels}>
                                                    <span>0</span>
                                                    <span>{formatCurrency(parseLimitValue(editingLimitValue))}</span>
                                                </div>
                                            </div>

                                            <div className={styles.limitsPreview}>
                                                <div className={styles.previewRow}>
                                                    <span>Limite liberado:</span>
                                                    <strong>{formatCurrency(parseLimitValue(editingLimitValue))}</strong>
                                                </div>
                                                <div className={styles.previewRow} style={{ color: '#6b7280' }}>
                                                    <span>Limite utilizado:</span>
                                                    <strong>{formatCurrency(selectedCard.creditLimit - selectedCard.availableLimit)}</strong>
                                                </div>
                                                <div className={styles.previewRow} style={{ color: '#f59e0b' }}>
                                                    <span>Limite bloqueado:</span>
                                                    <strong>{formatCurrency(
                                                        parseLimitValue(editingLimitValue) -
                                                        (selectedCard.creditLimit - selectedCard.availableLimit) -
                                                        sliderValue
                                                    )}</strong>
                                                </div>
                                                <div className={styles.previewRow} style={{ color: '#10b981' }}>
                                                    <span>Limite disponível:</span>
                                                    <strong>{formatCurrency(sliderValue)}</strong>
                                                </div>
                                            </div>

                                            <div className={styles.limitsActions}>
                                                <Button variant="secondary" onClick={() => setInvoiceViewMode('list')}>
                                                    Cancelar
                                                </Button>
                                                <Button onClick={handleSaveLimits}>
                                                    Salvar Limites
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}


                    {/* Delete Card Confirmation Modal */}
                    <Modal
                        isOpen={showDeleteCardModal}
                        onClose={() => setShowDeleteCardModal(false)}
                        title="Excluir Cartão"
                        size="sm"
                    >
                        <div className={styles.deleteModal}>
                            <p>Tem certeza que deseja excluir o cartão <strong>{selectedCard?.name}</strong>?</p>
                            <p className={styles.deleteWarning}>Esta ação não pode ser desfeita.</p>
                            <div className={styles.deleteActions}>
                                <Button variant="secondary" onClick={() => setShowDeleteCardModal(false)}>
                                    Cancelar
                                </Button>
                                <Button variant="danger" onClick={handleDeleteCard}>
                                    Excluir
                                </Button>
                            </div>
                        </div>
                    </Modal>

                    {/* Invoice Payment Modal */}
                    {showPaymentModal && selectedInvoiceForPayment && (
                        <InvoicePaymentModal
                            invoice={selectedInvoiceForPayment}
                            onClose={() => {
                                setShowPaymentModal(false);
                                setSelectedInvoiceForPayment(null);
                            }}
                            onPaymentComplete={handlePaymentComplete}
                        />
                    )}


                    {/* My Cards Tab */}
                    {activeTab === 'cards' && !selectedCard && (
                        <motion.div className={styles.cardsGrid} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            {cards.length > 0 ? (
                                cards.map((card) => {
                                    // Resolve dynamic icon/color from dictionary
                                    let dictionaryEntry = null;

                                    // 1. Try via linked bank account
                                    if (card.bankAccountId) {
                                        const successBank = bankAccounts.find(b => b.id === card.bankAccountId);
                                        if (successBank) {
                                            dictionaryEntry = cardBanks.banks[successBank.bankCode?.toLowerCase()] ||
                                                Object.values(cardBanks.banks).find(b => b.name === successBank.bankName);
                                        }
                                    }

                                    // 2. Try matching card name/bankName
                                    if (!dictionaryEntry) {
                                        const searchName = (card.bankName || card.name || '').toLowerCase();
                                        dictionaryEntry = Object.values(cardBanks.banks).find(b =>
                                            searchName.includes(b.name.toLowerCase()) ||
                                            (b.keywords && b.keywords.some(k => searchName.includes(k)))
                                        );
                                    }

                                    const displayIcon = dictionaryEntry?.icon;
                                    const displayColor = dictionaryEntry?.color || card.color || '#1a1a2e';

                                    return (
                                        <div key={card.id} className={styles.cardWrapper} onClick={() => handleCardClick(card, 'manual')}>
                                            <CreditCard
                                                name={card.name}
                                                brand={card.brand}
                                                lastFourDigits={card.lastFourDigits}
                                                creditLimit={card.creditLimit}
                                                availableLimit={card.availableLimit}
                                                closingDay={card.closingDay}
                                                dueDay={card.dueDay}
                                                color={displayColor}
                                                holderName={card.holderName || "NOME DO TITULAR"}
                                                validThru="12/28"
                                                icon={displayIcon}
                                            />
                                            <span className={styles.cardHint}>Clique para ver a fatura</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <GhostCard onClick={() => openCardModal()} />
                            )}
                            {/* Always show Ghost Card as the last item to add more if list is not empty */}
                            {cards.length > 0 && (
                                <GhostCard label="Adicionar outro" onClick={() => openCardModal()} />
                            )}
                        </motion.div>
                    )}

                    {/* Open Finance Tab */}
                    {activeTab === 'openfinance' && !selectedCard && (
                        <motion.div className={styles.cardsGrid} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            {/* Using same cards list logic if we had OF cards, for now using mock or empty */}
                            {/* NOTE: In real integration, we should fetch OF cards. If empty, show dead card or connect hint */}
                            {mockOpenFinanceCards.length > 0 ? (
                                mockOpenFinanceCards.map((card) => (
                                    <div key={card.id} className={styles.cardWrapper} onClick={() => handleCardClick(card, 'openfinance')}>
                                        <CreditCard
                                            name={`${card.bankName} ${card.name}`}
                                            brand={card.brand}
                                            lastFourDigits={card.lastFourDigits}
                                            creditLimit={card.creditLimit}
                                            availableLimit={card.availableLimit}
                                            closingDay={card.closingDay}
                                            dueDay={card.dueDay}
                                            color={card.color}
                                            holderName={card.holderName || "NOME DO TITULAR"}
                                            validThru="12/28"
                                        />
                                        <div className={styles.ofBadge}><FiLink /> Open Finance</div>
                                        <span className={styles.cardHint}>Clique para ver a fatura</span>
                                    </div>
                                ))
                            ) : (
                                <GhostCard
                                    label="Conectar via Open Finance"
                                    icon={FiLink}
                                    onClick={handleConnectOpenFinance}
                                />
                            )}
                            {/* Always show Add/Connect for Open Finance too */}
                            {mockOpenFinanceCards.length > 0 && (
                                <GhostCard
                                    label="Nova Conexão"
                                    icon={FiLink}
                                    onClick={handleConnectOpenFinance}
                                />
                            )}
                        </motion.div>
                    )}

                    {/* Subscriptions Tab */}
                    {activeTab === 'subscriptions' && !selectedCard && (
                        <motion.div className={styles.subsSection} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            {/* Card Filter */}
                            <div className={styles.filterBar}>
                                <div className={styles.filterGroup}>
                                    <FiCreditCard className={styles.filterIcon} />
                                    <select
                                        className={styles.filterSelect}
                                        value={subscriptionCardFilter}
                                        onChange={(e) => setSubscriptionCardFilter(e.target.value)}
                                    >
                                        <option value="ALL">Todas as assinaturas</option>
                                        <option value="NONE">Sem cartão vinculado</option>
                                        {cards.map(card => (
                                            <option key={card.id} value={card.id}>
                                                {card.name} •••• {card.lastFourDigits}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                            </div>

                            <Card className={styles.subsCard}>
                                {(() => {
                                    const filteredSubs = subscriptions.filter(sub => {
                                        if (subscriptionCardFilter === 'ALL') return true;
                                        if (subscriptionCardFilter === 'NONE') return !sub.cardId;
                                        return sub.cardId === subscriptionCardFilter;
                                    });
                                    const totalPages = Math.ceil(filteredSubs.length / itemsPerPage);
                                    const paginatedSubs = filteredSubs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                                    return filteredSubs.length > 0 ? (
                                        <>
                                            <div className={styles.subscriptionsList}>
                                                {paginatedSubs.map((sub) => {
                                                    // Dynamic lookup for subscription icon
                                                    const subKey = Object.keys(subscriptionData.subscriptions || {}).find(key =>
                                                        subscriptionData.subscriptions[key].name === sub.name
                                                    );
                                                    const dictionarySub = subKey ? subscriptionData.subscriptions[subKey] : null;
                                                    const displayIcon = dictionarySub?.icon || sub.icon;
                                                    const displayColor = dictionarySub?.color || sub.color;

                                                    return (
                                                        <div key={sub.id} className={styles.subscriptionItem}>
                                                            <div
                                                                className={styles.subscriptionIcon}
                                                                style={{ background: displayIcon ? 'transparent' : (displayColor || '#eee') }}
                                                            >
                                                                {displayIcon ? (
                                                                    displayIcon.startsWith('http') || displayIcon.startsWith('/') ? (
                                                                        <img
                                                                            src={displayIcon}
                                                                            alt={sub.name}
                                                                            style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: '50%' }}
                                                                        />
                                                                    ) : (
                                                                        <span style={{ fontSize: '1.2rem' }}>{displayIcon}</span>
                                                                    )
                                                                ) : (
                                                                    <span style={{ fontSize: '1.2rem', color: '#fff' }}>{sub.name.charAt(0)}</span>
                                                                )}
                                                            </div>
                                                            <div className={styles.subscriptionInfo}>
                                                                <span className={styles.subscriptionName}>{sub.name}</span>
                                                                <span className={styles.subscriptionCategory}>
                                                                    {sub.category}
                                                                    {sub.cardId && cards.find(c => c.id === sub.cardId) && (
                                                                        <> • <FiCreditCard style={{ fontSize: '0.7rem', verticalAlign: 'middle' }} /> {cards.find(c => c.id === sub.cardId)?.name}</>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className={styles.subscriptionAmount}>
                                                                <span className={styles.amount}>{formatCurrency(sub.amount)}</span>
                                                                <span className={styles.frequency}>/{sub.frequency === 'MONTHLY' ? 'mês' : sub.frequency}</span>
                                                            </div>
                                                            <div className={styles.subscriptionNext}>
                                                                <FiCalendar /><span>{formatDate(sub.nextBillingDate, 'short')}</span>
                                                            </div>
                                                            <div className={styles.subscriptionActions}>
                                                                <button className={styles.actionBtn} onClick={() => openSubModal(sub)}><FiEdit2 /></button>
                                                                <button className={`${styles.actionBtn} ${styles.danger}`}><FiTrash2 /></button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {
                                                totalPages > 1 && (
                                                    <div className={styles.pagination}>
                                                        <button
                                                            className={styles.pageBtn}
                                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                            disabled={currentPage === 1}
                                                        >
                                                            <FiChevronLeft />
                                                        </button>
                                                        <span className={styles.pageInfo}>
                                                            Página {currentPage} de {totalPages}
                                                        </span>
                                                        <button
                                                            className={styles.pageBtn}
                                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                            disabled={currentPage === totalPages}
                                                        >
                                                            <FiChevronRight />
                                                        </button>
                                                    </div>
                                                )
                                            }
                                        </>
                                    ) : (
                                        // Empty State for Subscriptions
                                        <div className={styles.emptySubs} onClick={() => openSubModal()}>
                                            <FiRepeat className={styles.emptyIcon} />
                                            <p>{subscriptionCardFilter === 'ALL' ? 'Nenhuma assinatura cadastrada' : 'Nenhuma assinatura neste filtro'}</p>
                                            <Button size="sm" variant="outline" leftIcon={<FiPlus />}>
                                                Adicionar Assinatura
                                            </Button>
                                        </div>
                                    );
                                })()}
                            </Card >

                            <div className={styles.summaryCards}>
                                <Card variant="glass" className={styles.summaryCard}>
                                    <FiDollarSign className={styles.summaryIcon} />
                                    <div>
                                        <span className={styles.summaryLabel}>Total Mensal</span>
                                        <span className={styles.summaryValue}>{formatCurrency(totalSubscriptions)}</span>
                                    </div>
                                </Card>
                                <Card variant="glass" className={styles.summaryCard}>
                                    <FiCalendar className={styles.summaryIcon} />
                                    <div>
                                        <span className={styles.summaryLabel}>Total Anual</span>
                                        <span className={styles.summaryValue}>{formatCurrency(totalSubscriptions * 12)}</span>
                                    </div>
                                </Card>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main >

            <Dock />

            {/* Card Modal */}
            <CardModal
                isOpen={showCardModal}
                onClose={() => { setShowCardModal(false); setEditingCard(null); }}
                onSave={handleSaveCard}
                editingCard={editingCard}
                bankAccounts={bankAccounts}
            />

            {/* Subscription Modal with Gallery */}
            <SubscriptionModal
                isOpen={showSubModal}
                onClose={() => { setShowSubModal(false); setEditingSub(null); }}
                onSave={handleSaveSub}
                editingSub={editingSub}
                cards={cards}
            />
        </div >
    );
}
