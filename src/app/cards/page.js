'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiPlus, FiCreditCard, FiCalendar, FiRepeat, FiEdit2, FiTrash2,
    FiX, FiDollarSign, FiTag, FiClock, FiLink, FiChevronLeft, FiChevronRight
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
import { usePrivateCurrency } from '@/components/ui/PrivateValue';
import { formatDate } from '@/utils/formatters';
import { cardsAPI, subscriptionsAPI, openFinanceAPI } from '@/services/api';
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
    const [isLoading, setIsLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('cards');
    const [showCardModal, setShowCardModal] = useState(false);
    const [showSubModal, setShowSubModal] = useState(false);

    // Edit states
    const [editingCard, setEditingCard] = useState(null);
    const [editingSub, setEditingSub] = useState(null);

    const [selectedCard, setSelectedCard] = useState(null);
    const [invoiceMonth, setInvoiceMonth] = useState({ month: 12, year: 2024 });
    const [subscriptionCardFilter, setSubscriptionCardFilter] = useState('ALL'); // ALL or cardId
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [cardsRes, subsRes] = await Promise.all([
                    cardsAPI.list(),
                    subscriptionsAPI.list()
                ]);
                setCards(cardsRes?.data || []);
                setSubscriptions(subsRes?.data || []);
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
            const [cardsRes, subsRes] = await Promise.all([
                cardsAPI.list(),
                subscriptionsAPI.list()
            ]);
            setCards(cardsRes?.data || []);
            setSubscriptions(subsRes?.data || []);
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
        try {
            if (editId) {
                await subscriptionsAPI.update(editId, payload);
            } else {
                await subscriptionsAPI.create(payload);
            }
            setShowSubModal(false);
            setEditingSub(null);
            loadData();
        } catch (error) {
            console.error("Error saving subscription:", error);
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
        try {
            // In a real scenario, this would likely get a redirect URL
            // specific to the institution or a general aggregator widget.
            // For now, we will simulate a request or redirect.
            alert("Iniciando fluxo de conexão Open Finance...");
            // Example: const { redirectUrl } = await openFinanceAPI.requestConsent(...);
            // window.location.href = redirectUrl;
        } catch (error) {
            console.error("Error connecting Open Finance:", error);
            alert("Erro ao conectar Open Finance. Tente novamente.");
        }
    };

    // Handle card click to show invoice
    const handleCardClick = (card, source = 'manual') => {
        setSelectedCard({ ...card, source });
        setInvoiceMonth({ month: 12, year: 2024 });
    };

    const closeInvoice = () => {
        setSelectedCard(null);
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
                            <Button leftIcon={<FiPlus />} onClick={() => openCardModal()}>Novo Cartão</Button>
                        )}
                        {activeTab === 'openfinance' && !selectedCard && (
                            <Link href="/open-finance" className={styles.linkBtn}>
                                <FiLink /> Gerenciar Conexões
                            </Link>
                        )}
                        {activeTab === 'subscriptions' && (
                            <Button leftIcon={<FiPlus />} onClick={() => openSubModal()}>Nova Assinatura</Button>
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
                            <button className={`${styles.tab} ${activeTab === 'openfinance' ? styles.active : ''}`} onClick={() => setActiveTab('openfinance')}>
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
                                    closingDay={selectedCard.closingDay}
                                    dueDay={selectedCard.dueDay}
                                    color={selectedCard.color}
                                    holderName="PATRICK SIQUEIRA"
                                    validThru="12/28"
                                />
                            </div>

                            {/* Invoice Details */}
                            <div className={styles.invoiceDetails}>
                                <div className={styles.invoiceHeader}>
                                    <h2>Fatura de {monthNames[invoiceMonth.month - 1]} {invoiceMonth.year}</h2>
                                    <div className={styles.monthSelector}>
                                        <button onClick={() => setInvoiceMonth(p => ({ ...p, month: Math.max(1, p.month - 1) }))}>
                                            <FiChevronLeft />
                                        </button>
                                        <span>{monthNames[invoiceMonth.month - 1]} {invoiceMonth.year}</span>
                                        <button onClick={() => setInvoiceMonth(p => ({ ...p, month: Math.min(12, p.month + 1) }))}>
                                            <FiChevronRight />
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.invoiceSummary}>
                                    <div className={styles.invoiceMain}>
                                        <div className={styles.invoiceTotal}>
                                            <span className={styles.invoiceLabel}>Total da Fatura</span>
                                            <span className={styles.invoiceValue}>{formatCurrency(currentInvoice.total)}</span>
                                        </div>
                                        <div className={`${styles.invoiceStatus} ${styles[currentInvoice.status.toLowerCase()]}`}>
                                            {currentInvoice.status === 'OPEN' ? 'Aberta' : 'Fechada'}
                                        </div>
                                    </div>
                                    <div className={styles.invoiceMeta}>
                                        <div>
                                            <span>Vencimento</span>
                                            <strong>{formatDate(currentInvoice.dueDate)}</strong>
                                        </div>
                                        <div>
                                            <span>Fechamento</span>
                                            <strong>Dia {selectedCard.closingDay}</strong>
                                        </div>
                                        <div>
                                            <span>Limite Disponível</span>
                                            <strong>{formatCurrency(selectedCard.availableLimit)}</strong>
                                        </div>
                                        <div>
                                            <span>Limite Total</span>
                                            <strong>{formatCurrency(selectedCard.creditLimit)}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.invoiceTransactions}>
                                    <h3>Lançamentos ({currentInvoice.transactions.length})</h3>
                                    <div className={styles.transactionsList}>
                                        {currentInvoice.transactions.map(tx => (
                                            <div key={tx.id} className={styles.txItem}>
                                                <div className={styles.txInfo}>
                                                    <span className={styles.txDesc}>{tx.description}</span>
                                                    <span className={styles.txDate}>
                                                        {formatDate(tx.date)}
                                                        {tx.installments && <span className={styles.installment}>{tx.installments}</span>}
                                                    </span>
                                                </div>
                                                <span className={styles.txAmount}>{formatCurrency(tx.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}


                    {/* My Cards Tab */}
                    {activeTab === 'cards' && !selectedCard && (
                        <motion.div className={styles.cardsGrid} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            {cards.length > 0 ? (
                                cards.map((card) => (
                                    <div key={card.id} className={styles.cardWrapper} onClick={() => handleCardClick(card, 'manual')}>
                                        <CreditCard
                                            name={card.name}
                                            brand={card.brand}
                                            lastFourDigits={card.lastFourDigits}
                                            creditLimit={card.creditLimit}
                                            availableLimit={card.availableLimit}
                                            closingDay={card.closingDay}
                                            dueDay={card.dueDay}
                                            color={card.color}
                                            holderName={card.holderName || "PATRICK SIQUEIRA"}
                                            validThru="12/28"
                                        />
                                        <span className={styles.cardHint}>Clique para ver a fatura</span>
                                    </div>
                                ))
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
                                            holderName="PATRICK SIQUEIRA"
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
                                <Button onClick={() => openSubModal()} leftIcon={<FiPlus />}>
                                    Nova Assinatura
                                </Button>
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
                                                {paginatedSubs.map((sub) => (
                                                    <div key={sub.id} className={styles.subscriptionItem}>
                                                        <div
                                                            className={styles.subscriptionIcon}
                                                            style={{ background: sub.icon ? 'transparent' : undefined }}
                                                        >
                                                            {sub.icon ? (
                                                                <img
                                                                    src={sub.icon}
                                                                    alt={sub.name}
                                                                    style={{ width: 32, height: 32, objectFit: 'contain' }}
                                                                />
                                                            ) : (
                                                                <FiRepeat />
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
                                                ))}
                                            </div>
                                            {totalPages > 1 && (
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
                                            )}
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
                            </Card>

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
