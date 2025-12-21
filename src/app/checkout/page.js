'use client';

/**
 * Checkout Page - Assinatura MyWallet
 * ========================================
 * Fluxo: Seleciona plano -> Preenche cartão -> Confirma assinatura
 * Usando Checkout API com card_token_id
 * ========================================
 */

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCheck, FiStar, FiShield, FiCreditCard,
    FiArrowRight, FiArrowLeft, FiLoader,
    FiCheckCircle, FiXCircle, FiClock, FiUser, FiLock
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import styles from './page.module.css';

const MP_PUBLIC_KEY = 'APP_USR-773024d8-0716-46e7-b97c-724206a37121';

const PLANS = [
    {
        id: 'MONTHLY',
        name: 'Mensal',
        price: 29.90,
        priceLabel: 'R$ 29,90',
        period: '/mês',
        description: 'Cancele quando quiser',
        features: [
            'Dashboard completo',
            'Cartões e contas ilimitados',
            'Orçamentos inteligentes',
            'Bot WhatsApp 24h',
            'Metas financeiras',
            'Notificações',
        ],
        popular: false,
        color: '#6366f1'
    },
    {
        id: 'ANNUAL',
        name: 'Anual',
        price: 297.00,
        originalPrice: 358.80,
        priceLabel: 'R$ 297',
        period: '/ano',
        monthlyEquiv: 'R$ 24,75/mês',
        savings: '2 meses grátis',
        description: 'Melhor custo-benefício',
        features: [
            'Tudo do mensal',
            'Controle de DAS (MEI)',
            'Investimentos',
            'Múltiplos perfis',
            'Relatórios avançados',
            'Suporte prioritário',
        ],
        popular: true,
        color: '#8b5cf6'
    }
];

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading, refreshUser } = useAuth();

    const [step, setStep] = useState(1); // 1 = plans, 2 = card form
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);
    const [mpReady, setMpReady] = useState(false);

    // Card form data
    const [cardData, setCardData] = useState({
        cardNumber: '',
        cardholderName: '',
        expirationMonth: '',
        expirationYear: '',
        securityCode: '',
        identificationType: 'CPF',
        identificationNumber: ''
    });

    // MP SDK ref
    const mpRef = useRef(null);

    // Check URL params for payment status
    useEffect(() => {
        const statusParam = searchParams.get('status');
        const planParam = searchParams.get('plan');

        if (statusParam) {
            setStatus(statusParam);
            if (planParam) setSelectedPlan(planParam);

            if (statusParam === 'success' && refreshUser) {
                refreshUser();
            }
        }
    }, [searchParams, refreshUser]);

    // Load MP SDK
    useEffect(() => {
        if (typeof window !== 'undefined' && !mpRef.current) {
            const script = document.createElement('script');
            script.src = 'https://sdk.mercadopago.com/js/v2';
            script.async = true;
            script.onload = () => {
                try {
                    mpRef.current = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
                    setMpReady(true);
                    console.log('MP SDK loaded');
                } catch (err) {
                    console.error('MP SDK error:', err);
                }
            };
            document.body.appendChild(script);
        } else if (window.MercadoPago && !mpRef.current) {
            mpRef.current = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
            setMpReady(true);
        }
    }, []);

    // Check if user already has active subscription
    useEffect(() => {
        if (!authLoading && user) {
            if (user.subscriptionStatus === 'ACTIVE' && user.plan !== 'FREE') {
                router.push('/dashboard');
            }
        }
    }, [user, authLoading, router]);

    // Format card number
    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0; i < match.length; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(' ') : v;
    };

    // Format CPF
    const formatCPF = (value) => {
        const v = value.replace(/\D/g, '');
        if (v.length <= 11) {
            return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return v;
    };

    const handleCardChange = (field, value) => {
        if (field === 'cardNumber') {
            value = formatCardNumber(value);
        }
        if (field === 'identificationNumber') {
            value = formatCPF(value);
        }
        setCardData(prev => ({ ...prev, [field]: value }));
    };

    const handleSelectPlan = (planId) => {
        setSelectedPlan(planId);
        setStep(2);
        setError(null);
    };

    const handleBack = () => {
        setStep(1);
        setError(null);
    };

    const createCardToken = async () => {
        if (!mpRef.current) {
            throw new Error('SDK do Mercado Pago não carregado');
        }

        const [expMonth, expYear] = cardData.expirationMonth && cardData.expirationYear
            ? [cardData.expirationMonth, cardData.expirationYear]
            : ['', ''];

        const tokenData = {
            cardNumber: cardData.cardNumber.replace(/\s/g, ''),
            cardholderName: cardData.cardholderName,
            cardExpirationMonth: expMonth,
            cardExpirationYear: expYear.length === 2 ? '20' + expYear : expYear,
            securityCode: cardData.securityCode,
            identificationType: cardData.identificationType,
            identificationNumber: cardData.identificationNumber.replace(/\D/g, '')
        };

        console.log('Creating card token...');
        const response = await mpRef.current.createCardToken(tokenData);

        if (response.error) {
            throw new Error(response.error.message || 'Erro ao processar cartão');
        }

        console.log('Card token created:', response.id);
        return response.id;
    };

    const handleSubscribe = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setError(null);

        try {
            // 1. Create card token
            const cardTokenId = await createCardToken();

            // 2. Send to backend
            const response = await api.post('/subscriptions/subscribe', {
                planType: selectedPlan,
                cardTokenId: cardTokenId
            });

            console.log('Subscription response:', response);

            if (response.success) {
                setStatus('success');
                if (refreshUser) refreshUser();
            } else {
                throw new Error(response.error || 'Erro ao criar assinatura');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError(err.message || 'Erro ao processar pagamento');
            setStatus('failure');
        } finally {
            setProcessing(false);
        }
    };

    if (authLoading) {
        return (
            <div className={styles.loadingPage}>
                <FiLoader className={styles.spinner} />
                <span>Carregando...</span>
            </div>
        );
    }

    const selectedPlanData = PLANS.find(p => p.id === selectedPlan);

    return (
        <div className={styles.page}>
            <div className={styles.bgGradient} />

            <div className={styles.container}>
                {/* Logo */}
                <motion.div
                    className={styles.logoWrapper}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Image
                        src="/images/logoparafundopreto.png"
                        alt="MyWallet"
                        width={180}
                        height={65}
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </motion.div>

                <AnimatePresence mode="wait">
                    {/* Success State */}
                    {status === 'success' && (
                        <motion.div
                            key="success"
                            className={styles.resultContent}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <motion.div
                                className={styles.successIcon}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                            >
                                <FiCheckCircle />
                            </motion.div>
                            <h1 className={styles.resultTitle}>Assinatura ativada!</h1>
                            <p className={styles.resultText}>
                                Sua assinatura foi confirmada com sucesso.
                                Aproveite todos os recursos do MyWallet!
                            </p>
                            <button
                                className={styles.dashboardBtn}
                                onClick={() => router.push('/dashboard')}
                            >
                                Ir para o Dashboard <FiArrowRight />
                            </button>
                        </motion.div>
                    )}

                    {/* Failure State */}
                    {status === 'failure' && (
                        <motion.div
                            key="failure"
                            className={styles.resultContent}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <motion.div
                                className={styles.failureIcon}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                            >
                                <FiXCircle />
                            </motion.div>
                            <h1 className={styles.resultTitle}>Pagamento não aprovado</h1>
                            <p className={styles.resultText}>
                                {error || 'Não foi possível processar seu pagamento. Verifique os dados e tente novamente.'}
                            </p>
                            <button
                                className={styles.retryBtn}
                                onClick={() => { setStatus(null); setStep(2); }}
                            >
                                Tentar novamente
                            </button>
                        </motion.div>
                    )}

                    {/* Pending State */}
                    {status === 'pending' && (
                        <motion.div
                            key="pending"
                            className={styles.resultContent}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <motion.div
                                className={styles.pendingIcon}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                            >
                                <FiClock />
                            </motion.div>
                            <h1 className={styles.resultTitle}>Pagamento pendente</h1>
                            <p className={styles.resultText}>
                                Seu pagamento está sendo processado. Você receberá uma confirmação em breve.
                            </p>
                            <button
                                className={styles.dashboardBtn}
                                onClick={() => router.push('/dashboard')}
                            >
                                Ir para o Dashboard <FiArrowRight />
                            </button>
                        </motion.div>
                    )}

                    {/* Step 1: Plan Selection */}
                    {!status && step === 1 && (
                        <motion.div
                            key="plans"
                            className={styles.stepContent}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                        >
                            <h1 className={styles.title}>Escolha seu plano</h1>
                            <p className={styles.subtitle}>Pagamento seguro com cartão de crédito</p>

                            <div className={styles.plansGrid}>
                                {PLANS.map((plan, index) => (
                                    <motion.button
                                        key={plan.id}
                                        className={`${styles.planCard} ${plan.popular ? styles.popular : ''}`}
                                        onClick={() => handleSelectPlan(plan.id)}
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ y: -8, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{ '--accent-color': plan.color }}
                                    >
                                        {plan.popular && (
                                            <span className={styles.popularBadge}>
                                                <FiStar /> MAIS POPULAR
                                            </span>
                                        )}

                                        <div className={styles.planHeader}>
                                            <h3>{plan.name}</h3>
                                            <p>{plan.description}</p>
                                        </div>

                                        <div className={styles.planPrice}>
                                            {plan.originalPrice && (
                                                <span className={styles.originalPrice}>
                                                    R$ {plan.originalPrice.toFixed(2)}
                                                </span>
                                            )}
                                            <span className={styles.price}>
                                                {plan.priceLabel}
                                                <small>{plan.period}</small>
                                            </span>
                                            {plan.monthlyEquiv && (
                                                <span className={styles.monthlyEquiv}>{plan.monthlyEquiv}</span>
                                            )}
                                        </div>

                                        {plan.savings && (
                                            <span className={styles.savingsBadge}>{plan.savings}</span>
                                        )}

                                        <ul className={styles.featuresList}>
                                            {plan.features.map((f, i) => (
                                                <li key={i}><FiCheck /> {f}</li>
                                            ))}
                                        </ul>

                                        <div className={styles.selectBtn}>
                                            Selecionar <FiArrowRight />
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            <div className={styles.securityBadge}>
                                <FiShield />
                                <span>Pagamento 100% seguro • Cancele quando quiser</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Card Form */}
                    {!status && step === 2 && selectedPlanData && (
                        <motion.div
                            key="cardForm"
                            className={styles.stepContent}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                        >
                            <button className={styles.backBtn} onClick={handleBack}>
                                <FiArrowLeft /> Voltar
                            </button>

                            <div className={styles.selectedPlanBadge}>
                                <span>Plano {selectedPlanData.name}</span>
                                <strong>{selectedPlanData.priceLabel}{selectedPlanData.period}</strong>
                            </div>

                            <h1 className={styles.title}>Dados do cartão</h1>

                            <form className={styles.cardForm} onSubmit={handleSubscribe}>
                                <div className={styles.formGroup}>
                                    <label><FiUser /> Nome do titular</label>
                                    <input
                                        type="text"
                                        placeholder="Nome como está no cartão"
                                        value={cardData.cardholderName}
                                        onChange={(e) => handleCardChange('cardholderName', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label><FiCreditCard /> Número do cartão</label>
                                    <input
                                        type="text"
                                        placeholder="0000 0000 0000 0000"
                                        value={cardData.cardNumber}
                                        onChange={(e) => handleCardChange('cardNumber', e.target.value)}
                                        maxLength={19}
                                        required
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Mês</label>
                                        <select
                                            value={cardData.expirationMonth}
                                            onChange={(e) => handleCardChange('expirationMonth', e.target.value)}
                                            required
                                        >
                                            <option value="">MM</option>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                <option key={m} value={String(m).padStart(2, '0')}>
                                                    {String(m).padStart(2, '0')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Ano</label>
                                        <select
                                            value={cardData.expirationYear}
                                            onChange={(e) => handleCardChange('expirationYear', e.target.value)}
                                            required
                                        >
                                            <option value="">AA</option>
                                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(y => (
                                                <option key={y} value={String(y).slice(-2)}>
                                                    {String(y).slice(-2)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label><FiLock /> CVV</label>
                                        <input
                                            type="text"
                                            placeholder="123"
                                            value={cardData.securityCode}
                                            onChange={(e) => handleCardChange('securityCode', e.target.value)}
                                            maxLength={4}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>CPF do titular</label>
                                    <input
                                        type="text"
                                        placeholder="000.000.000-00"
                                        value={cardData.identificationNumber}
                                        onChange={(e) => handleCardChange('identificationNumber', e.target.value)}
                                        maxLength={14}
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className={styles.errorMessage}>
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={processing || !mpReady}
                                >
                                    {processing ? (
                                        <>
                                            <FiLoader className={styles.spinner} />
                                            Processando...
                                        </>
                                    ) : (
                                        <>
                                            <FiLock />
                                            Confirmar assinatura
                                        </>
                                    )}
                                </button>

                                <div className={styles.securityBadge}>
                                    <FiShield />
                                    <span>Seus dados estão protegidos com criptografia SSL</span>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Loading fallback
function CheckoutFallback() {
    return (
        <div className={styles.loadingPage}>
            <FiLoader className={styles.spinner} />
            <span>Carregando...</span>
        </div>
    );
}

// Export with Suspense boundary
export default function CheckoutPage() {
    return (
        <Suspense fallback={<CheckoutFallback />}>
            <CheckoutContent />
        </Suspense>
    );
}
