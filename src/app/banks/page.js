'use client';

/**
 * Banks Page
 * ========================================
 * Manage bank accounts, view balances, transfer between accounts
 * ========================================
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiChevronRight, FiChevronLeft,
    FiDollarSign, FiCreditCard, FiActivity, FiX, FiCheck,
    FiArrowRight, FiArrowLeft, FiBriefcase, FiUser, FiTarget
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import AppShell from '@/components/AppShell';
import BankAccountCard from '@/components/ui/BankAccountCard/BankAccountCard';
import GhostCard from '@/components/ui/GhostCard';
import { useProfiles } from '@/contexts/ProfileContext';
import bankAccountService from '@/services/bankAccountService';
import { goalsAPI } from '@/services/api';
import cardBanksData from '@/data/cardBanks.json';
import styles from './page.module.css';

const formatAccountNumber = (number) => {
    if (!number) return '';
    // If it already has hyphen, return as is
    if (number.includes('-')) return number;
    // Otherwise assume valid formatting is needed, simply take last digit as digit
    if (number.length > 1) {
        return `${number.slice(0, -1)}-${number.slice(-1)}`;
    }
    return number;
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

const accountTypes = [
    { value: 'CONTA_CORRENTE', label: 'Conta Corrente' },
    { value: 'CONTA_POUPANCA', label: 'Poupança' },
    { value: 'CONTA_PAGAMENTO', label: 'Conta de Pagamento' },
    { value: 'CONTA_SALARIO', label: 'Conta Salário' },
    { value: 'CARTEIRA', label: 'Carteira / Dinheiro' }
];

function BanksContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { profiles, activeProfile, setActiveProfileById } = useProfiles();

    const [accounts, setAccounts] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        bankKey: '',
        nickname: '',
        type: 'CONTA_CORRENTE',
        initialBalance: ''
    });

    // Transfer states
    const [transferData, setTransferData] = useState({
        fromAccountId: '',
        toAccountId: '',
        toProfileId: '',
        amount: '',
        description: ''
    });
    const [transferLoading, setTransferLoading] = useState(false);

    const loadAccounts = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🏦 [BANKS PAGE] Loading bank accounts...');
            console.log('🏦 [BANKS PAGE] Profile ID:', typeof window !== 'undefined' ? localStorage.getItem('investpro_profile_id') : 'N/A');

            const [accountsResponse, goalsResponse] = await Promise.all([
                bankAccountService.list(),
                goalsAPI.list().catch(() => [])
            ]);
            console.log('🏦 [BANKS PAGE] API Response:', accountsResponse);
            console.log('🏦 [BANKS PAGE] Goals Response:', goalsResponse);

            setAccounts(accountsResponse?.data || accountsResponse || []);
            setGoals(goalsResponse?.data || goalsResponse || []);
            setError(null);
        } catch (err) {
            console.error('🏦 [BANKS PAGE] Erro ao carregar contas:', err);
            setError('Erro ao carregar contas bancárias');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAccounts();

        // Check URL params for opening modals
        if (searchParams.get('new') === 'true') {
            setShowAddModal(true);
        }
        if (searchParams.get('transfer') === 'true') {
            setShowTransferModal(true);
        }
    }, [loadAccounts, searchParams]);

    // Bank options from cardBanks.json
    const bankOptions = Object.entries(cardBanksData.banks).map(([key, value]) => ({
        key,
        ...value
    }));

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBankSelect = (bankKey) => {
        const bank = cardBanksData.banks[bankKey];
        setFormData(prev => ({
            ...prev,
            bankKey,
            color: bank?.color,
            icon: bank?.icon
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const selectedBank = cardBanksData.banks[formData.bankKey];

        const data = {
            bankName: selectedBank?.name || formData.bankKey,
            bankCode: formData.bankKey,
            nickname: formData.nickname || null,
            type: formData.type,
            color: selectedBank?.color,
            icon: selectedBank?.icon,
            initialBalance: parseFloat(formData.initialBalance) || 0
        };

        try {
            if (editingAccount) {
                await bankAccountService.update(editingAccount.id, data);
            } else {
                await bankAccountService.create(data);
            }

            await loadAccounts();
            closeModal();
        } catch (err) {
            console.error('Erro ao salvar conta:', err);
            alert(err.response?.data?.message || 'Erro ao salvar conta');
        }
    };

    const handleDelete = async (accountId) => {
        if (!confirm('Tem certeza que deseja excluir esta conta?')) return;

        try {
            await bankAccountService.delete(accountId);
            await loadAccounts();
        } catch (err) {
            console.error('Erro ao excluir conta:', err);
            alert(err.response?.data?.message || 'Erro ao excluir conta');
        }
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setFormData({
            bankKey: account.bankCode || 'other',
            nickname: account.nickname || '',
            type: account.type || 'CONTA_CORRENTE',
            initialBalance: account.balance || 0
        });
        setShowAddModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setShowTransferModal(false);
        setEditingAccount(null);
        setFormData({
            bankKey: '',
            nickname: '',
            type: 'CONTA_CORRENTE',
            initialBalance: ''
        });
        setTransferData({
            fromAccountId: '',
            toAccountId: '',
            toProfileId: '',
            amount: '',
            description: ''
        });
    };

    const handleTransfer = async (e) => {
        e.preventDefault();

        if (!transferData.fromAccountId || !transferData.toAccountId || !transferData.amount) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        const amount = parseFloat(transferData.amount);

        // Gamification Check: Reserved Amounts
        const fromAccount = accounts.find(a => a.id === transferData.fromAccountId);
        if (fromAccount) {
            const reservedAmount = goals
                .filter(g => g.bankAccountId === fromAccount.id && g.status === 'ACTIVE')
                .reduce((sum, g) => sum + parseFloat(g.currentAmount || 0), 0);

            const currentBalance = parseFloat(fromAccount.balance || 0);
            const availableForTransfer = currentBalance - reservedAmount;

            if (amount > availableForTransfer) {
                const confirmed = window.confirm(
                    `⚠️ Atenção! Esta transferência utilizará valores reservados para suas metas.\n\n` +
                    `Saldo Total: ${formatCurrency(currentBalance)}\n` +
                    `Reservado em Metas: ${formatCurrency(reservedAmount)}\n` +
                    `Disponível Livre: ${formatCurrency(availableForTransfer)}\n\n` +
                    `Ao utilizar valores de metas, você poderá perder XP e cair de nível.\n\n` +
                    `Deseja continuar mesmo assim?`
                );

                if (!confirmed) return;
            }
        }

        try {
            setTransferLoading(true);
            await bankAccountService.createInternalTransfer({
                fromBankAccountId: transferData.fromAccountId,
                toBankAccountId: transferData.toAccountId,
                toProfileId: transferData.toProfileId || undefined,
                amount: parseFloat(transferData.amount),
                description: transferData.description || 'Transferência interna'
            });

            await loadAccounts();
            closeModal();

            // Gamification Reward Check
            const hasGoalLinkedToDestination = goals.some(g => g.bankAccountId === transferData.toAccountId && g.status === 'ACTIVE');
            if (hasGoalLinkedToDestination) {
                alert('🎉 Transferência realizada com sucesso!\n\nVocê transferiu para uma conta vinculada a metas. Continue assim para atingir seus objetivos e ganhar mais XP!');
            } else {
                alert('Transferência realizada com sucesso!');
            }
        } catch (err) {
            console.error('Erro na transferência:', err);
            alert(err.response?.data?.message || 'Erro ao realizar transferência');
        } finally {
            setTransferLoading(false);
        }
    };

    // Get all accounts across all profiles for transfer
    const allAccountsForTransfer = accounts;

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5; // 5 cards + 1 ghost card = 6 total items per page

    const totalItems = accounts.length;
    const totalPages = Math.ceil((totalItems + 1) / ITEMS_PER_PAGE);

    const paginatedAccounts = accounts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const showGhostCard = currentPage === totalPages;

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

    return (
        <AppShell>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <div className={styles.titleSection}>
                            <h1>Minhas Contas</h1>
                            <p>Gerencie suas contas bancárias e carteiras</p>
                        </div>
                        <div className={styles.headerActions}>
                            <button
                                className={styles.transferBtn}
                                onClick={() => setShowTransferModal(true)}
                            >
                                <FiRefreshCw /> Transferir
                            </button>
                            <button
                                className={styles.addBtn}
                                onClick={() => setShowAddModal(true)}
                            >
                                <FiPlus /> Nova Conta
                            </button>
                        </div>
                    </div>

                    {/* Total Balance Card */}
                    <motion.div
                        className={styles.heroCard}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className={styles.heroContent}>
                            <span className={styles.heroLabel}>Saldo Total em Contas</span>
                            <span className={`${styles.heroValue} ${totalBalance >= 0 ? styles.positive : styles.negative}`}>
                                {formatCurrency(totalBalance)}
                            </span>
                        </div>
                        <div className={styles.heroStats}>
                            <div className={styles.heroStat}>
                                <span className={styles.statNumber}>{accounts.length}</span>
                                <span className={styles.statLabel}>Contas</span>
                            </div>
                            <div className={styles.heroStat}>
                                <span className={styles.statNumber}>
                                    {accounts.filter(a => parseFloat(a.balance) > 0).length}
                                </span>
                                <span className={styles.statLabel}>Com saldo</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Loading & Error States */}
                    {loading && (
                        <div className={styles.loadingState}>
                            <FiRefreshCw className={styles.spinner} />
                            <span>Carregando contas...</span>
                        </div>
                    )}

                    {error && !loading && (
                        <div className={styles.errorState}>
                            <span>{error}</span>
                            <button onClick={loadAccounts}>Tentar novamente</button>
                        </div>
                    )}

                    {/* Account List */}
                    {!loading && !error && (
                        <>
                            <div className={styles.accountsGrid}>
                                {paginatedAccounts.map((account) => {
                                    const accountReserved = goals
                                        .filter(g => g.bankAccountId === account.id && g.status === 'ACTIVE')
                                        .reduce((sum, g) => sum + parseFloat(g.currentAmount || 0), 0);

                                    return (
                                        <div key={account.id} className={styles.accountWrapper}>
                                            <BankAccountCard
                                                bankName={account.nickname || account.bankName}
                                                accountNumber={formatAccountNumber(account.accountNumber) || '00000-0'}
                                                agency={account.agency || '0000'}
                                                balance={account.balance}
                                                reservedAmount={accountReserved}
                                                color={account.color || '#6366f1'}
                                                holderName={profiles.find(p => p.id === account.profileId)?.name || 'TITULAR'}
                                                icon={account.icon}
                                                onClick={() => router.push(`/banks/${account.id}`)}
                                                onEdit={() => handleEdit(account)}
                                                onDelete={() => handleDelete(account.id)}
                                            />
                                            <div className={styles.accountActionsRow}>
                                                {/* Actions could go here, but they are inside the detail page now */}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Show Ghost Card ONLY on the last page */}
                                {showGhostCard && (
                                    <div className={styles.ghostCardContainer}>
                                        <GhostCard
                                            label="ADICIONAR CONTA"
                                            onClick={() => setShowAddModal(true)}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className={styles.paginationControls}>
                                    <button
                                        className={styles.paginationBtn}
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                    >
                                        <FiChevronLeft /> Anterior
                                    </button>

                                    <span className={styles.pageIndicator}>
                                        Página {currentPage} de {totalPages}
                                    </span>

                                    <button
                                        className={styles.paginationBtn}
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                    >
                                        Próximo <FiChevronRight />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
            <Dock />

            {/* Add/Edit Account Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.modalHeader}>
                                <h2>{editingAccount ? 'Editar Conta' : 'Nova Conta Bancária'}</h2>
                                <button className={styles.closeBtn} onClick={closeModal}>
                                    <FiX />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className={styles.form}>
                                {/* Bank Selection */}
                                <div className={styles.formGroup}>
                                    <label>Banco</label>
                                    <div className={styles.bankGrid}>
                                        {bankOptions.slice(0, 12).map((bank) => (
                                            <button
                                                key={bank.key}
                                                type="button"
                                                className={`${styles.bankOption} ${formData.bankKey === bank.key ? styles.selected : ''}`}
                                                style={{ '--bank-color': bank.color }}
                                                onClick={() => handleBankSelect(bank.key)}
                                            >
                                                {bank.icon ? (
                                                    <img src={bank.icon} alt={bank.name} />
                                                ) : (
                                                    <span className={styles.bankInitial}>{bank.name.charAt(0)}</span>
                                                )}
                                                <span>{bank.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Nickname */}
                                <div className={styles.formGroup}>
                                    <label>Apelido (opcional)</label>
                                    <input
                                        type="text"
                                        name="nickname"
                                        value={formData.nickname}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Conta Principal, Reserva..."
                                    />
                                </div>

                                {/* Account Type */}
                                <div className={styles.formGroup}>
                                    <label>Tipo de Conta</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                    >
                                        {accountTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Initial Balance */}
                                <div className={styles.formGroup}>
                                    <label>Saldo Inicial</label>
                                    <input
                                        type="number"
                                        name="initialBalance"
                                        value={formData.initialBalance}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>

                                <div className={styles.formActions}>
                                    <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className={styles.submitBtn}>
                                        <FiCheck /> {editingAccount ? 'Salvar' : 'Criar Conta'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Transfer Modal */}
            <AnimatePresence>
                {showTransferModal && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.modalHeader}>
                                <h2>Transferência Interna</h2>
                                <button className={styles.closeBtn} onClick={closeModal}>
                                    <FiX />
                                </button>
                            </div>

                            <form onSubmit={handleTransfer} className={styles.form}>
                                {/* From Account */}
                                <div className={styles.formGroup}>
                                    <label>De (Conta de Origem)</label>
                                    <select
                                        value={transferData.fromAccountId}
                                        onChange={(e) => setTransferData(prev => ({ ...prev, fromAccountId: e.target.value }))}
                                        required
                                    >
                                        <option value="">Selecione a conta...</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.nickname || acc.bankName} - {formatCurrency(acc.balance)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Transfer Icon */}
                                <div className={styles.transferIcon}>
                                    <FiArrowRight />
                                </div>

                                {/* To Account */}
                                <div className={styles.formGroup}>
                                    <label>Para (Conta de Destino)</label>
                                    <select
                                        value={transferData.toAccountId}
                                        onChange={(e) => setTransferData(prev => ({ ...prev, toAccountId: e.target.value }))}
                                        required
                                    >
                                        <option value="">Selecione a conta...</option>
                                        {allAccountsForTransfer
                                            .filter(acc => acc.id !== transferData.fromAccountId)
                                            .map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.nickname || acc.bankName} - {formatCurrency(acc.balance)}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* Amount */}
                                <div className={styles.formGroup}>
                                    <label>Valor</label>
                                    <input
                                        type="number"
                                        value={transferData.amount}
                                        onChange={(e) => setTransferData(prev => ({ ...prev, amount: e.target.value }))}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0.01"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className={styles.formGroup}>
                                    <label>Descrição (opcional)</label>
                                    <input
                                        type="text"
                                        value={transferData.description}
                                        onChange={(e) => setTransferData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Ex: Transferência para reserva"
                                    />
                                </div>

                                <div className={styles.formActions}>
                                    <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.submitBtn}
                                        disabled={transferLoading}
                                    >
                                        {transferLoading ? (
                                            <><FiRefreshCw className={styles.spinner} /> Transferindo...</>
                                        ) : (
                                            <><FiCheck /> Transferir</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppShell >
    );
}

// Loading fallback
function BanksLoading() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    );
}

// Export with Suspense boundary
export default function BanksPage() {
    return (
        <Suspense fallback={<BanksLoading />}>
            <BanksContent />
        </Suspense>
    );
}

