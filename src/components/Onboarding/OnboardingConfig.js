'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiArrowRight, FiArrowLeft, FiCheck, FiDollarSign,
    FiCreditCard, FiRepeat, FiCheckCircle, FiPlus, FiTrash2, FiEdit2
} from 'react-icons/fi';
import api from '@/services/api';
import { cardsAPI, subscriptionsAPI } from '@/services/api';
import CardModal from '@/components/modals/CardModal';
import SubscriptionModal from '@/components/modals/SubscriptionModal';
import styles from './OnboardingConfig.module.css';

// Currency input helper - allows free typing with comma/period
const handleCurrencyInput = (value) => {
    // Allow digits, comma, and period
    let cleaned = value.replace(/[^\d.,]/g, '');

    // Replace period with comma (Brazilian format)
    cleaned = cleaned.replace(/\./g, ',');

    // Only allow one comma
    const firstCommaIndex = cleaned.indexOf(',');
    if (firstCommaIndex !== -1) {
        const beforeComma = cleaned.slice(0, firstCommaIndex + 1);
        const afterComma = cleaned.slice(firstCommaIndex + 1).replace(/,/g, '');
        cleaned = beforeComma + afterComma.slice(0, 2);
    }

    return cleaned;
};

// Format currency for display
const formatCurrencyDisplay = (value) => {
    if (!value) return '';
    const parts = value.split(',');
    let integerPart = parts[0]?.replace(/^0+/, '') || '0';
    const decimalPart = parts[1] || '';
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return value.includes(',') ? `${integerPart},${decimalPart}` : integerPart;
};

const parseCurrencyValue = (maskedValue) => {
    if (!maskedValue) return 0;
    const normalized = maskedValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
};

export default function OnboardingConfig({ onComplete }) {
    const [step, setStep] = useState('balance');
    const [loading, setLoading] = useState(false);

    // Form states
    const [initialBalance, setInitialBalance] = useState('');
    const [salary, setSalary] = useState('');
    const [salaryDay, setSalaryDay] = useState('5');

    // Cards & Subscriptions
    const [cards, setCards] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);

    // Modal states
    const [showCardModal, setShowCardModal] = useState(false);
    const [showSubModal, setShowSubModal] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [editingSub, setEditingSub] = useState(null);

    const handleCurrencyChange = (value, setter) => {
        const cleaned = handleCurrencyInput(value);
        setter(cleaned);
    };

    const handleCurrencyBlur = (value, setter) => {
        const formatted = formatCurrencyDisplay(value);
        setter(formatted);
    };

    const handleNext = async () => {
        if (step === 'balance') {
            setStep('salary');
        } else if (step === 'salary') {
            setLoading(true);
            try {
                await api.put('/auth/onboarding-config', {
                    initialBalance: parseCurrencyValue(initialBalance),
                    salary: parseCurrencyValue(salary),
                    salaryDay: parseInt(salaryDay) || 5
                });
            } catch (e) {
                console.error('Error saving config:', e);
            }
            setLoading(false);
            setStep('cards');
        } else if (step === 'cards') {
            setLoading(true);
            try {
                console.log('🃏 [ONBOARDING] Creating cards...', cards);
                const createdCards = [];
                for (const card of cards) {
                    console.log('🃏 [ONBOARDING] Sending card to API:', card);
                    const response = await cardsAPI.create(card);
                    console.log('🃏 [ONBOARDING] Card API response:', response);
                    if (response && response.data) {
                        console.log('🃏 [ONBOARDING] Card created with ID:', response.data.id);
                        createdCards.push(response.data);
                    }
                }
                console.log('🃏 [ONBOARDING] All created cards:', createdCards);
                setCards(createdCards);
            } catch (e) {
                console.error('❌ [ONBOARDING] Error saving cards:', e);
            }
            setLoading(false);
            setStep('subscriptions');
        } else if (step === 'subscriptions') {
            setLoading(true);
            try {
                console.log('📦 [ONBOARDING] Creating subscriptions...', subscriptions);
                console.log('📦 [ONBOARDING] Available cards state:', cards);
                for (const sub of subscriptions) {
                    console.log('📦 [ONBOARDING] Sending subscription to API:', sub);
                    console.log('📦 [ONBOARDING] Subscription cardId:', sub.cardId, '| Type:', typeof sub.cardId);
                    const result = await subscriptionsAPI.create(sub);
                    console.log('📦 [ONBOARDING] Subscription API response:', result);
                }
            } catch (e) {
                console.error('❌ [ONBOARDING] Error saving subscriptions:', e);
            }
            setLoading(false);
            setStep('complete');
        } else {
            onComplete?.();
        }
    };

    const handleBack = () => {
        if (step === 'salary') setStep('balance');
        else if (step === 'cards') setStep('salary');
        else if (step === 'subscriptions') setStep('cards');
    };

    // Card Modal handlers
    const openCardModal = (card = null, index = null) => {
        setEditingCard(card ? { ...card, _index: index } : null);
        setShowCardModal(true);
    };

    const handleSaveCard = (cardData) => {
        if (editingCard?._index !== undefined) {
            const updated = [...cards];
            updated[editingCard._index] = cardData;
            setCards(updated);
        } else {
            setCards([...cards, cardData]);
        }
        setShowCardModal(false);
        setEditingCard(null);
    };

    const removeCard = (idx) => {
        setCards(cards.filter((_, i) => i !== idx));
    };

    // Subscription Modal handlers
    const openSubModal = (sub = null, index = null) => {
        setEditingSub(sub ? { ...sub, _index: index } : null);
        setShowSubModal(true);
    };

    const handleSaveSub = (subData) => {
        if (editingSub?._index !== undefined) {
            const updated = [...subscriptions];
            updated[editingSub._index] = subData;
            setSubscriptions(updated);
        } else {
            setSubscriptions([...subscriptions, subData]);
        }
        setShowSubModal(false);
        setEditingSub(null);
    };

    const removeSub = (idx) => {
        setSubscriptions(subscriptions.filter((_, i) => i !== idx));
    };

    const formatCurrency = (value) => {
        const numValue = typeof value === 'string' ? parseCurrencyValue(value) : value;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue || 0);
    };

    return (
        <>
            <div className={styles.overlay}>
                <div className={styles.container}>
                    {/* Progress */}
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{
                                width: step === 'balance' ? '20%' :
                                    step === 'salary' ? '40%' :
                                        step === 'cards' ? '60%' :
                                            step === 'subscriptions' ? '80%' : '100%'
                            }}
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        {/* STEP: Balance */}
                        {step === 'balance' && (
                            <motion.div
                                key="balance"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.iconWrapper}>
                                    <FiDollarSign />
                                </div>
                                <h2>Qual é seu saldo atual?</h2>
                                <p className={styles.description}>
                                    Informe o saldo total que você tem disponível hoje
                                </p>

                                <div className={styles.inputGroup}>
                                    <label>Saldo Total</label>
                                    <div className={styles.currencyInput}>
                                        <span>R$</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={initialBalance}
                                            onChange={(e) => handleCurrencyChange(e.target.value, setInitialBalance)}
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>

                                <p className={styles.hint}>
                                    💡 Você pode pular essa etapa e ajustar depois
                                </p>
                            </motion.div>
                        )}

                        {/* STEP: Salary */}
                        {step === 'salary' && (
                            <motion.div
                                key="salary"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.iconWrapper}>
                                    <FiDollarSign />
                                </div>
                                <h2>Configure seu salário</h2>
                                <p className={styles.description}>
                                    O sistema irá criar uma receita recorrente automática
                                </p>

                                <div className={styles.inputRow}>
                                    <div className={styles.inputGroup}>
                                        <label>Valor Líquido</label>
                                        <div className={styles.currencyInput}>
                                            <span>R$</span>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={salary}
                                                onChange={(e) => handleCurrencyChange(e.target.value, setSalary)}
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Dia do recebimento</label>
                                        <select value={salaryDay} onChange={(e) => setSalaryDay(e.target.value)}>
                                            {[...Array(31)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <p className={styles.hint}>
                                    💰 Seu salário aparecerá como "Salário" nas transações
                                </p>
                            </motion.div>
                        )}

                        {/* STEP: Cards */}
                        {step === 'cards' && (
                            <motion.div
                                key="cards"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.iconWrapper}>
                                    <FiCreditCard />
                                </div>
                                <h2>Seus cartões de crédito</h2>
                                <p className={styles.description}>
                                    Cadastre seus cartões para controlar faturas (opcional)
                                </p>

                                {/* Cards List */}
                                {cards.length > 0 && (
                                    <div className={styles.itemsList}>
                                        {cards.map((card, idx) => (
                                            <div key={idx} className={styles.listItem}>
                                                <div
                                                    className={styles.cardColor}
                                                    style={{ background: card.color }}
                                                />
                                                <div className={styles.itemInfo}>
                                                    <strong>{card.name}</strong>
                                                    <span>{card.brand} •••• {card.lastFourDigits}</span>
                                                </div>
                                                <div className={styles.itemActions}>
                                                    <button onClick={() => openCardModal(card, idx)}>
                                                        <FiEdit2 />
                                                    </button>
                                                    <button onClick={() => removeCard(idx)} className={styles.danger}>
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button className={styles.addButton} onClick={() => openCardModal()}>
                                    <FiPlus /> Adicionar Cartão
                                </button>
                            </motion.div>
                        )}

                        {/* STEP: Subscriptions */}
                        {step === 'subscriptions' && (
                            <motion.div
                                key="subscriptions"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.iconWrapper}>
                                    <FiRepeat />
                                </div>
                                <h2>Assinaturas e recorrências</h2>
                                <p className={styles.description}>
                                    Adicione suas assinaturas mensais (opcional)
                                </p>

                                {/* Subscriptions List */}
                                {subscriptions.length > 0 && (
                                    <div className={styles.itemsList}>
                                        {subscriptions.map((sub, idx) => (
                                            <div key={idx} className={styles.listItem}>
                                                <div className={styles.subIcon}>
                                                    {sub.icon ? (
                                                        <img src={sub.icon} alt={sub.name} />
                                                    ) : (
                                                        <FiRepeat />
                                                    )}
                                                </div>
                                                <div className={styles.itemInfo}>
                                                    <strong>{sub.name}</strong>
                                                    <span>{formatCurrency(sub.amount)}/mês</span>
                                                </div>
                                                <div className={styles.itemActions}>
                                                    <button onClick={() => openSubModal(sub, idx)}>
                                                        <FiEdit2 />
                                                    </button>
                                                    <button onClick={() => removeSub(idx)} className={styles.danger}>
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {subscriptions.length > 0 && (
                                    <div className={styles.totalBar}>
                                        Total mensal: <strong>{formatCurrency(subscriptions.reduce((acc, s) => acc + parseFloat(s.amount || 0), 0))}</strong>
                                    </div>
                                )}

                                <button className={styles.addButton} onClick={() => openSubModal()}>
                                    <FiPlus /> Adicionar Assinatura
                                </button>
                            </motion.div>
                        )}

                        {/* STEP: Complete */}
                        {step === 'complete' && (
                            <motion.div
                                key="complete"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={styles.stepContent}
                            >
                                <div className={`${styles.iconWrapper} ${styles.success}`}>
                                    <FiCheckCircle />
                                </div>
                                <h2>Tudo pronto! 🎉</h2>
                                <p className={styles.description}>
                                    Seu MyWallet está configurado e pronto para usar!
                                </p>

                                <div className={styles.summary}>
                                    {parseCurrencyValue(initialBalance) > 0 && (
                                        <div>✅ Saldo inicial: {formatCurrency(initialBalance)}</div>
                                    )}
                                    {parseCurrencyValue(salary) > 0 && (
                                        <div>✅ Salário: {formatCurrency(salary)} (dia {salaryDay})</div>
                                    )}
                                    {cards.length > 0 && (
                                        <div>✅ {cards.length} cartão(ões) cadastrado(s)</div>
                                    )}
                                    {subscriptions.length > 0 && (
                                        <div>✅ {subscriptions.length} assinatura(s) cadastrada(s)</div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className={styles.navigation}>
                        {step !== 'balance' && step !== 'complete' && (
                            <button className={styles.backBtn} onClick={handleBack}>
                                <FiArrowLeft /> Voltar
                            </button>
                        )}

                        <button
                            className={`${styles.nextBtn} ${step === 'complete' ? styles.completeBtn : ''}`}
                            onClick={handleNext}
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' :
                                step === 'complete' ? 'Começar a usar' :
                                    step === 'cards' || step === 'subscriptions' ? 'Continuar' :
                                        'Próximo'}
                            {!loading && step !== 'complete' && <FiArrowRight />}
                            {!loading && step === 'complete' && <FiCheck />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Card Modal */}
            <CardModal
                isOpen={showCardModal}
                onClose={() => { setShowCardModal(false); setEditingCard(null); }}
                onSave={handleSaveCard}
                editingCard={editingCard}
            />

            {/* Subscription Modal */}
            <SubscriptionModal
                isOpen={showSubModal}
                onClose={() => { setShowSubModal(false); setEditingSub(null); }}
                onSave={handleSaveSub}
                editingSub={editingSub}
                cards={cards}
            />
        </>
    );
}
