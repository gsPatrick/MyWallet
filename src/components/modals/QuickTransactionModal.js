'use client';

import { useState, useEffect } from 'react';
import {
    FiTrendingUp, FiTrendingDown, FiDollarSign, FiRepeat, FiLayers,
    FiPlus, FiX, FiClock, FiCheck, FiCreditCard
} from 'react-icons/fi';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { transactionsAPI, cardsAPI, budgetsAPI } from '@/services/api';
import categoriesService from '@/services/categoriesService';
import bankAccountService from '@/services/bankAccountService';
import subscriptionIcons from '@/data/subscriptionIcons.json';
import styles from './QuickTransactionModal.module.css';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

export default function QuickTransactionModal({ isOpen, onClose, onSuccess }) {
    // ---- States copied from transactions/page.js ----
    const [transactionMode, setTransactionMode] = useState('single'); // single, recurring, installment
    const [showIconPicker, setShowIconPicker] = useState(false);
    // Note: CategoryModal and BankAccountModal states could be added here if we want to allow creation inside quick modal.
    // For now, let's stick to selection to keep it manageable, or add simple redirects/alerts.

    // Data Lists
    const [categoryList, setCategoryList] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [cards, setCards] = useState([]);

    // Form State
    const [newTransaction, setNewTransaction] = useState({
        description: '',
        amount: '',
        type: 'EXPENSE',
        category: '',
        categoryId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'COMPLETED',
        paymentMethod: 'MONEY',
        source: 'MANUAL', // MANUAL, IMPORT, CARD
        sourceType: 'Débito/Dinheiro', // Débito, Crédito, Dinheiro
        bankAccountId: '',
        cardId: '',
        installments: '',
        frequency: 'MONTHLY',
        recurringDay: '',
        imageUrl: ''
    });

    // Load Data on Open
    useEffect(() => {
        if (isOpen) {
            loadData();
            resetForm();
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            const [cats, banks, cardsRes] = await Promise.all([
                categoriesService.list(),
                bankAccountService.list(),
                cardsAPI.list()
            ]);

            // Ensure categoryList is always an array
            const categoriesData = Array.isArray(cats) ? cats : (cats?.data || cats?.categories || []);
            setCategoryList(Array.isArray(categoriesData) ? categoriesData : []);

            setBankAccounts(banks?.data || banks || []);
            setCards(cardsRes?.data || cardsRes || []);

            // Set default bank account if exists
            const banksData = banks?.data || banks || [];
            if (banksData.length > 0) {
                const defaultAcc = banksData.find(a => a.isDefault) || banksData[0];
                setNewTransaction(prev => ({ ...prev, bankAccountId: defaultAcc.id }));
            }
        } catch (error) {
            console.error('Error loading data for Quick Transaction:', error);
        }
    };

    const resetForm = () => {
        setNewTransaction({
            description: '',
            amount: '',
            type: 'EXPENSE',
            category: '',
            categoryId: '',
            date: new Date().toISOString().split('T')[0],
            status: 'COMPLETED',
            paymentMethod: 'MONEY',
            source: 'MANUAL', // MANUAL, IMPORT, CARD
            sourceType: 'Débito/Dinheiro',
            bankAccountId: bankAccounts.find(a => a.isDefault)?.id || bankAccounts[0]?.id || '',
            cardId: '',
            installments: '',
            frequency: 'MONTHLY',
            recurringDay: '',
            imageUrl: ''
        });
        setTransactionMode('single');
    };

    const handleAmountChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = (Number(value) / 100).toFixed(2);
        setNewTransaction(prev => ({ ...prev, amount: value }));
    };

    const handleAddTransaction = async (bypassBudget = false) => {
        try {
            // Basic Validation
            if (!newTransaction.description || !newTransaction.amount || !newTransaction.categoryId) {
                alert('Preencha os campos obrigatórios: Descrição, Valor e Categoria');
                return;
            }

            if (transactionMode !== 'single' && transactionMode !== 'recurring' && !newTransaction.cardId && !newTransaction.bankAccountId) {
                // For installments usually card is required or bank
            }

            const payload = { ...newTransaction };

            // Adjust payload based on mode
            if (transactionMode === 'recurring') {
                payload.isRecurring = true;
                // Ensure recurringDay is set
                if (!payload.recurringDay) payload.recurringDay = new Date().getDate();
            } else if (transactionMode === 'installment') {
                payload.isInstallment = true;
                if (!payload.installments) {
                    alert('Informe o número de parcelas');
                    return;
                }
            }

            if (payload.cardId) {
                payload.source = 'CARD';
                payload.sourceType = 'Crédito';
                payload.bankAccountId = null; // Card transactions might not link directly to bank account immediately
            }

            // Call API
            await transactionsAPI.create(payload, bypassBudget); // Pass bypassBudget if supported

            onSuccess?.();
            onClose();
            alert('Transação criada com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar transação:', error);
            if (error.response?.data?.code === 'BUDGET_EXCEEDED') {
                // Simplified Budget Exceeded Handling for Quick Modal
                const confirm = window.confirm(
                    `⚠️ Orçamento Excedido!\n\n` +
                    `Esta transação ultrapassa seu orçamento para ${error.response.data.budgetData?.categoryName || 'esta categoria'}.\n` +
                    `Deseja confirmar mesmo assim? (Isso pode afetar seu nível)`
                );
                if (confirm) {
                    handleAddTransaction(true); // Retry with bypass
                }
            } else {
                alert(error.response?.data?.message || 'Erro ao salvar transação');
            }
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
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
                                {/* Add Category Button disabled in Quick Modal to simplify, or could redirect */}
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

                    {/* Bank Account Selector - Conditional Visibility */}
                    {transactionMode === 'single' && (
                        <div className={styles.formRow}>
                            <div className={styles.inputGroup} style={{ width: '100%' }}>
                                <div className={styles.labelWithAction}>
                                    <label className={styles.inputLabel}>Conta/Banco</label>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {/* Bank Logo Indicator */}
                                    {newTransaction.bankAccountId && (() => {
                                        const selectedBank = bankAccounts.find(a => a.id === newTransaction.bankAccountId);
                                        return selectedBank?.icon ? (
                                            <img
                                                src={selectedBank.icon}
                                                alt={selectedBank.bankName}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    objectFit: 'contain',
                                                    borderRadius: '6px',
                                                    background: '#fff',
                                                    padding: '4px'
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '6px',
                                                background: selectedBank?.color || '#6b7280',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontWeight: 600,
                                                fontSize: '14px'
                                            }}>
                                                {(selectedBank?.bankName || 'B').charAt(0)}
                                            </div>
                                        );
                                    })()}
                                    <select
                                        className={styles.selectInput}
                                        value={newTransaction.bankAccountId}
                                        onChange={(e) => setNewTransaction(prev => ({ ...prev, bankAccountId: e.target.value }))}
                                        style={{
                                            flex: 1,
                                            borderLeft: newTransaction.bankAccountId
                                                ? `4px solid ${bankAccounts.find(a => a.id === newTransaction.bankAccountId)?.color || '#6b7280'}`
                                                : undefined
                                        }}
                                    >
                                        <option value="">Selecione uma conta...</option>
                                        {bankAccounts.length > 0 ? (
                                            bankAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.nickname || acc.bankName} {acc.isDefault ? '(Padrão)' : ''}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>Nenhuma conta cadastrada</option>
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

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
                    {transactionMode !== 'single' && (
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
                        <Button variant="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button onClick={() => handleAddTransaction(false)}>
                            Criar Transação
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Icon Picker Modal - reusing Modal because why not, but standardizing as quick modal sub-modal */}
            <Modal
                isOpen={showIconPicker}
                onClose={() => setShowIconPicker(false)}
                title="Escolher Ícone"
                size="lg"
            >
                <div className={styles.iconPickerContent}>
                    <div className={styles.iconGrid}>
                        {Object.entries(subscriptionIcons.subscriptions || {}).map(([key, service]) => (
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
        </>
    );
}
