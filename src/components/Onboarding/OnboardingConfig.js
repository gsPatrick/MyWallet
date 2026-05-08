'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiArrowRight, FiArrowLeft, FiCheck, FiDollarSign,
    FiCreditCard, FiRepeat, FiCheckCircle, FiPlus, FiTrash2, FiEdit2, FiTrendingUp
} from 'react-icons/fi';
import api, { brokersAPI, bankAccountsAPI } from '@/services/api';
import { cardsAPI, subscriptionsAPI } from '@/services/api';
import Link from 'next/link';
import CardModal from '@/components/modals/CardModal';
import SubscriptionModal from '@/components/modals/SubscriptionModal';
import BROKERS_LIST from '@/data/brokers.json';
import BankAccountsStep from './steps/BankAccountsStep';
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
    const [bankAccounts, setBankAccounts] = useState([]); // NEW: Store bank accounts
    const [detectedSubscriptions, setDetectedSubscriptions] = useState([]); // NEW: Detected from import

    // Modal states
    const [showCardModal, setShowCardModal] = useState(false);
    const [showSubModal, setShowSubModal] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [editingSub, setEditingSub] = useState(null);

    // Brokers State
    const [brokers, setBrokers] = useState([]);
    // Use static data from JSON (like cardBanks)
    const availableBrokers = BROKERS_LIST;

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
                console.log('💰 [ONBOARDING] Saving initial config...');
                const response = await api.put('/auth/onboarding-config', {
                    initialBalance: parseCurrencyValue(initialBalance),
                    salary: parseCurrencyValue(salary),
                    salaryDay: parseInt(salaryDay) || 5
                });

                // ✅ Robust Profile ID capture
                const result = response?.data || response;
                const profileId = result?.profileId || result?.data?.profileId;

                if (profileId) {
                    console.log('✅ [ONBOARDING] Profile ID received:', profileId);
                    localStorage.setItem('investpro_profile_id', profileId);
                }

                // Fetch bank accounts immediately to ensure Wallet is available for Cards step
                try {
                    const accountsResponse = await bankAccountsAPI.list();
                    const accountsList = accountsResponse?.data || accountsResponse;
                    if (Array.isArray(accountsList)) {
                        console.log('🏦 [ONBOARDING] Bank accounts fetched:', accountsList.length);
                        setBankAccounts(accountsList);
                    }
                } catch (err) {
                    console.error('⚠️ [ONBOARDING] Failed to fetch bank accounts:', err);
                }

                setStep('bankAccounts');
            } catch (e) {
                console.error('❌ [ONBOARDING] Error saving config:', e);
                alert('Erro ao salvar configurações iniciais. Verifique sua conexão.');
            }
            setLoading(false);
        } else if (step === 'bankAccounts') {
            // All bank accounts added via modal already have IDs.
            // If any were added manually without ID (shouldn't happen now), we could save them here.
            setStep('cards');
        } else if (step === 'cards') {
            setLoading(true);
            try {
                console.log('🃏 [ONBOARDING] Processing cards...', cards);
                const processedCards = [];

                for (const card of cards) {
                    // Only create if it doesn't have an ID yet
                    if (!card.id) {
                        // Ensure bankAccountId is a UUID, not an index
                        if (typeof card.bankAccountId === 'number') {
                            const realBank = bankAccounts[card.bankAccountId];
                            if (realBank?.id) {
                                card.bankAccountId = realBank.id;
                            } else {
                                // If no bank found, use the first available one as fallback
                                card.bankAccountId = bankAccounts[0]?.id || null;
                            }
                        }

                        console.log('🃏 [ONBOARDING] Creating new card:', card);
                        const response = await cardsAPI.create(card);
                        const result = response?.data || response;
                        
                        // Robust response handling
                        const savedCard = result?.id ? result : (result?.data?.id ? result.data : null);

                        if (savedCard) {
                            console.log('✅ [ONBOARDING] Card created:', savedCard.id);
                            processedCards.push(savedCard);
                        } else {
                            console.warn('⚠️ [ONBOARDING] Unexpected card API response:', response);
                            processedCards.push(card); // Fallback
                        }
                    } else {
                        console.log('ℹ️ [ONBOARDING] Card already exists:', card.id);
                        processedCards.push(card);
                    }
                }

                setCards(processedCards);
                setStep('subscriptions');
            } catch (e) {
                console.error('❌ [ONBOARDING] Error saving cards:', e);
                alert('Erro ao salvar cartões. Alguns itens podem não ter sido salvos.');
            }
            setLoading(false);
        } else if (step === 'subscriptions') {
            setLoading(true);
            try {
                console.log('📦 [ONBOARDING] Creating subscriptions...', subscriptions);
                for (const sub of subscriptions) {
                    // Fix cardId reference if it was an index
                    if (typeof sub.cardId === 'number') {
                        const realCard = cards[sub.cardId];
                        sub.cardId = realCard?.id || null;
                    }
                    
                    // Ensure startDate is not empty
                    if (!sub.startDate) {
                        sub.startDate = new Date().toISOString().split('T')[0];
                    }

                    await subscriptionsAPI.create(sub);
                }
                setStep('brokers');
            } catch (e) {
                console.error('❌ [ONBOARDING] Error saving subscriptions:', e);
                alert('Erro ao salvar assinaturas.');
            }
            setLoading(false);
        } else if (step === 'brokers') {
            setLoading(true);
            try {
                console.log('📈 [ONBOARDING] Creating brokers...', brokers);
                for (const broker of brokers) {
                    await brokersAPI.createFromDictionary(broker.code);
                }
            } catch (e) {
                console.error('❌ [ONBOARDING] Error saving brokers:', e);
            }
            setLoading(false);
            setStep('complete');
        } else {
            onComplete?.();
        }
    };

    const handleBack = () => {
        if (step === 'salary') setStep('balance');
        else if (step === 'bankAccounts') setStep('salary');
        else if (step === 'cards') setStep('bankAccounts');
        else if (step === 'subscriptions') setStep('cards');
        else if (step === 'brokers') setStep('subscriptions');
    };

    // Broker handlers
    const toggleBroker = (broker) => {
        const exists = brokers.find(b => b.code === broker.code);
        if (exists) {
            setBrokers(brokers.filter(b => b.code !== broker.code));
        } else {
            setBrokers([...brokers, broker]);
        }
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
                                width: step === 'balance' ? '14%' :
                                    step === 'salary' ? '28%' :
                                        step === 'bankAccounts' ? '42%' :
                                            step === 'cards' ? '57%' :
                                                step === 'subscriptions' ? '71%' :
                                                    step === 'brokers' ? '85%' : '100%'
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

                        {/* STEP: Bank Accounts (Centralized Import) */}
                        {step === 'bankAccounts' && (
                            <motion.div
                                key="bankAccounts"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <BankAccountsStep
                                    accounts={bankAccounts}
                                    setAccounts={setBankAccounts}
                                    onNext={handleNext}
                                    onBack={handleBack}
                                    loading={loading}
                                    onImportSuccess={(newSubs) => {
                                        if (newSubs && newSubs.length > 0) {
                                            setDetectedSubscriptions(prev => [...prev, ...newSubs]);
                                        }
                                    }}
                                />
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

                                {/* Detected Subscriptions Alert */}
                                {detectedSubscriptions.length > 0 && (
                                    <div className={styles.alertBox} style={{
                                        background: 'rgba(5, 150, 105, 0.2)',
                                        border: '1px solid #059669',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        marginBottom: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            background: '#059669',
                                            borderRadius: '50%',
                                            width: '24px', height: '24px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <FiCheck size={14} color="#fff" />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>
                                                {detectedSubscriptions.length} assinatura(s) encontrada(s)!
                                            </h4>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#ccc' }}>
                                                Identificamos potenciais assinaturas nos seus extratos. Confirme-as abaixo.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Subscriptions List */}
                                {(subscriptions.length > 0 || detectedSubscriptions.length > 0) ? (
                                    <div className={styles.itemsList}>
                                        {/* Render Detected Subscriptions first (if not added to main list yet) */}
                                        {/* Ideally we would merge them, but for now we rely on user manually adding via 'detected' specific UI or just knowing they are there?
                                            Actually, let's keep it simple: We won't auto-add to the main list because detection is 'potential'.
                                            But the user wants to see "Look we found these".
                                            Let's auto-add them to the list but flag them as "Unconfirmed"?
                                            Or just render them.
                                            Let's map detectedSubscriptions to simple list items with a "Add" button if not already in subscriptions?
                                         */}

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
                                ) : (
                                    null
                                )}

                                {/* If we have detected subs, maybe show a button to "Review Detected" or just auto-open a modal?
                                    For simplicity, let's just show the Add button.
                                    Ideally, we would iterate detectedSubscriptions and for each one NOT in subscriptions, show a card to "Confirm".
                                */}
                                {detectedSubscriptions.filter(d => !subscriptions.find(s => s.name === d.name)).map((det, i) => (
                                    <div key={`det-${i}`} className={styles.listItem} style={{ border: '1px dashed #059669' }}>
                                        <div className={styles.subIcon}>
                                            <img src={det.icon || ''} alt={det.name} onError={(e) => e.target.style.display = 'none'} />
                                        </div>
                                        <div className={styles.itemInfo}>
                                            <strong>{det.name}</strong>
                                            <span style={{ color: '#34d399' }}>Detectado: {formatCurrency(det.amount)}</span>
                                        </div>
                                        <div className={styles.itemActions}>
                                            <Button size="sm" onClick={() => {
                                                setSubscriptions([...subscriptions, { ...det }]);
                                                // Remove from view? It will be filtered out by the map above.
                                            }}>
                                                Confirmar
                                            </Button>
                                        </div>
                                    </div>
                                ))}

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

                        {/* STEP: Brokers (Corretoras) */}
                        {step === 'brokers' && (
                            <motion.div
                                key="brokers"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.iconWrapper}>
                                    <FiTrendingUp />
                                </div>
                                <h2>Suas corretoras de investimentos</h2>
                                <p className={styles.description}>
                                    Selecione as corretoras que você usa para investir (opcional)
                                </p>

                                {/* Available Brokers Grid */}
                                <div className={styles.brokersGrid}>
                                    {availableBrokers.map(broker => {
                                        const isSelected = brokers.find(b => b.code === broker.code);
                                        return (
                                            <button
                                                key={broker.code}
                                                className={`${styles.brokerOption} ${isSelected ? styles.selected : ''}`}
                                                onClick={() => toggleBroker(broker)}
                                                style={{ '--broker-color': broker.color }}
                                            >
                                                {broker.logoUrl ? (
                                                    <img src={broker.logoUrl} alt={broker.name} className={styles.brokerOptionLogo} />
                                                ) : (
                                                    <FiTrendingUp className={styles.brokerOptionIcon} />
                                                )}
                                                <span>{broker.name}</span>
                                                {isSelected && <FiCheck className={styles.checkIcon} />}
                                            </button>
                                        );
                                    })}
                                </div>

                                <p className={styles.hint}>
                                    💼 Uma corretora padrão "MyWallet Investimentos" será criada automaticamente
                                </p>
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
                                    {brokers.length > 0 && (
                                        <div>📈 {brokers.length} corretora(s) adicionada(s)</div>
                                    )}
                                    <div>📈 Corretora padrão criada automaticamente</div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation - Hide for BankAccounts step as it controls navigation internally */}
                    <div className={styles.navigation} style={{ display: step === 'bankAccounts' ? 'none' : 'flex' }}>
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
                bankAccounts={bankAccounts} // Pass fetched accounts
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
