'use client';

/**
 * Checkout Page - Assinatura MyWallet
 * ========================================
 * Fluxo: Seleciona plano -> Redirect para Mercado Pago
 * ========================================
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCheck, FiStar, FiShield,
    FiArrowRight, FiLoader,
    FiCheckCircle, FiXCircle, FiClock
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import styles from './page.module.css';

const PLANS = [
    {
        id: 'MONTHLY',
        name: 'Mensal',
        price: 29.90,
        priceLabel: 'R$ 29,90',
        period: '/mês',
        description: 'Cancele quando quiser',
        features: ['Acesso completo', 'Transações ilimitadas', 'Suporte por email'],
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
        features: ['Tudo do mensal', '+2 meses grátis', 'Suporte prioritário'],
        popular: true,
        color: '#8b5cf6'
    }
];

export default function CheckoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading, refreshUser } = useAuth();

    const [selectedPlan, setSelectedPlan] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'failure' | 'pending'

    // Check URL params for payment status (after MP redirect)
    useEffect(() => {
        const statusParam = searchParams.get('status');
        const planParam = searchParams.get('plan');

        if (statusParam) {
            setStatus(statusParam);
            if (planParam) setSelectedPlan(planParam);

            // If success, refresh user data
            if (statusParam === 'success' && refreshUser) {
                refreshUser();
            }
        }
    }, [searchParams, refreshUser]);

    // Check if user already has active subscription
    useEffect(() => {
        if (!authLoading && user) {
            if (user.subscriptionStatus === 'ACTIVE' && user.plan !== 'FREE') {
                router.push('/dashboard');
            }
        }
    }, [user, authLoading, router]);

    const handleSubscribe = async (planId) => {
        setSelectedPlan(planId);
        setProcessing(true);

        try {
            const response = await api.post('/subscriptions/subscribe', {
                planType: planId
            });

            // Redirect to Mercado Pago
            if (response.sandboxInitPoint || response.initPoint) {
                // Use sandbox in development
                const redirectUrl = response.sandboxInitPoint || response.initPoint;
                window.location.href = redirectUrl;
            } else {
                throw new Error('URL de pagamento não recebida');
            }
        } catch (err) {
            console.error('Erro no checkout:', err);
            setProcessing(false);
            setStatus('failure');
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
                        width={200}
                        height={60}
                        priority
                    />
                </motion.div>

                <AnimatePresence mode="wait">
                    {/* Payment Status Pages */}
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
                            <h1 className={styles.resultTitle}>Pagamento confirmado!</h1>
                            <p className={styles.resultText}>
                                Sua assinatura foi ativada com sucesso.
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
                                Não foi possível processar seu pagamento. Tente novamente ou use outro método.
                            </p>
                            <button
                                className={styles.retryBtn}
                                onClick={() => { setStatus(null); setSelectedPlan(null); }}
                            >
                                Tentar novamente
                            </button>
                        </motion.div>
                    )}

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

                    {/* Plan Selection (when no status) */}
                    {!status && (
                        <motion.div
                            key="plans"
                            className={styles.stepContent}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                        >
                            <h1 className={styles.title}>Escolha seu plano</h1>
                            <p className={styles.subtitle}>
                                {processing ? 'Redirecionando para o Mercado Pago...' : 'Pagamento seguro via Mercado Pago'}
                            </p>

                            {processing ? (
                                <div className={styles.processingBox}>
                                    <FiLoader className={styles.spinner} />
                                    <span>Preparando pagamento...</span>
                                </div>
                            ) : (
                                <div className={styles.plansGrid}>
                                    {PLANS.map((plan, index) => (
                                        <motion.button
                                            key={plan.id}
                                            className={`${styles.planCard} ${plan.popular ? styles.popular : ''}`}
                                            onClick={() => handleSubscribe(plan.id)}
                                            initial={{ opacity: 0, y: 40 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{ y: -8, scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            style={{ '--accent-color': plan.color }}
                                            disabled={processing}
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
                                                Assinar agora <FiArrowRight />
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            {/* Security Badge */}
                            <div className={styles.securityBadge}>
                                <FiShield />
                                <span>Pagamento 100% seguro via Mercado Pago</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
