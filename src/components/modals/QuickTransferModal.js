'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiRefreshCw, FiArrowRight, FiCheck } from 'react-icons/fi';
import bankAccountService from '@/services/bankAccountService';
import { goalsAPI } from '@/services/api';
import { useProfiles } from '@/contexts/ProfileContext';
import styles from './QuickTransferModal.module.css';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

export default function QuickTransferModal({ isOpen, onClose, onSuccess }) {
    const { profiles } = useProfiles();

    const [accounts, setAccounts] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    // Transfer states
    const [transferData, setTransferData] = useState({
        fromAccountId: '',
        toAccountId: '',
        toProfileId: '',
        amount: '',
        description: ''
    });
    const [transferLoading, setTransferLoading] = useState(false);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            loadData();
            setTransferData({
                fromAccountId: '',
                toAccountId: '',
                toProfileId: '',
                amount: '',
                description: ''
            });
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [accountsResponse, goalsResponse] = await Promise.all([
                bankAccountService.list(),
                goalsAPI.list().catch(() => [])
            ]);

            const accs = accountsResponse?.data || accountsResponse || [];
            setAccounts(accs);
            setGoals(goalsResponse?.data || goalsResponse || []);

            // Set default account if available and not set
            if (accs.length > 0 && !transferData.fromAccountId) {
                const defaultAcc = accs.find(a => a.isDefault) || accs[0];
                if (defaultAcc) {
                    setTransferData(prev => ({ ...prev, fromAccountId: defaultAcc.id }));
                }
            }
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
        } finally {
            setLoading(false);
        }
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

            onSuccess?.();
            onClose();

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

    // Get all accounts across all profiles for transfer (using local accounts for now as in original)
    const allAccountsForTransfer = accounts;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.modalOverlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
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
                            <button className={styles.closeBtn} onClick={onClose}>
                                <FiX />
                            </button>
                        </div>

                        {loading ? (
                            <div className={styles.loadingState}>
                                <FiRefreshCw className={styles.spinner} />
                                <span>Carregando contas...</span>
                            </div>
                        ) : (
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
                                                {acc.nickname || acc.bankName} {acc.type === 'CORRETORA' ? '(Corretora)' : ''} - {formatCurrency(acc.balance)}
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
                                                    {acc.nickname || acc.bankName} {acc.type === 'CORRETORA' ? '(Corretora)' : ''} - {formatCurrency(acc.balance)}
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
                                    <button type="button" className={styles.cancelBtn} onClick={onClose}>
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
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
