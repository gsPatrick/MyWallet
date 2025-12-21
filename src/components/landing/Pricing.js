'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';
import styles from './Pricing.module.css';

const monthlyFeatures = [
    'Dashboard completo',
    'Cartões e contas ilimitados',
    'Orçamentos inteligentes',
    'Bot WhatsApp 24h',
    'Metas financeiras',
    'Notificações',
];

const annualFeatures = [
    'Tudo do plano mensal',
    'Controle de DAS (MEI)',
    'Investimentos',
    'Múltiplos perfis',
    'Relatórios avançados',
    'Suporte prioritário',
];

export default function Pricing() {
    return (
        <section id="pricing" className={styles.section}>
            <div className={styles.container}>
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <span className={styles.badge}>Planos</span>
                    <h2 className={styles.title}>Escolha o plano ideal para você</h2>
                    <p className={styles.subtitle}>
                        Sem surpresas. Cancele quando quiser.
                    </p>
                </motion.div>

                <div className={styles.cardsGrid}>
                    {/* Monthly Plan */}
                    <motion.div
                        className={styles.card}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <div className={styles.cardHeader}>
                            <span className={styles.planName}>Mensal</span>
                            <div className={styles.priceWrapper}>
                                <span className={styles.currency}>R$</span>
                                <span className={styles.price}>29,90</span>
                                <span className={styles.period}>/mês</span>
                            </div>
                        </div>

                        <ul className={styles.features}>
                            {monthlyFeatures.map((feature) => (
                                <li key={feature}>
                                    <FiCheck className={styles.checkIcon} />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Link href="/signup" className={styles.ctaBtn}>
                            Começar agora
                        </Link>
                    </motion.div>

                    {/* Annual Plan - Popular */}
                    <motion.div
                        className={`${styles.card} ${styles.cardPopular}`}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className={styles.popularBadge}>
                            Mais popular
                        </div>

                        <div className={styles.cardHeader}>
                            <span className={styles.planName}>Anual</span>
                            <div className={styles.priceWrapper}>
                                <span className={styles.currency}>R$</span>
                                <span className={styles.price}>297</span>
                                <span className={styles.period}>/ano</span>
                            </div>
                            <p className={styles.annualNote}>
                                Equivale a R$ 24,75/mês
                            </p>
                            <div className={styles.saveBadge}>2 meses grátis</div>
                        </div>

                        <ul className={styles.features}>
                            {annualFeatures.map((feature) => (
                                <li key={feature}>
                                    <FiCheck className={styles.checkIcon} />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Link href="/signup" className={styles.ctaBtnPopular}>
                            Começar agora
                        </Link>
                    </motion.div>
                </div>

                <p className={styles.guarantee}>
                    7 dias de garantia • Pagamento 100% seguro • Cancele quando quiser
                </p>
            </div>
        </section>
    );
}
