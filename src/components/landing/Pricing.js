'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';
import styles from './Pricing.module.css';

const allFeatures = [
    'Dashboard completo',
    'Contas bancárias ilimitadas',
    'Cartões ilimitados',
    'Orçamentos inteligentes',
    'Metas financeiras',
    'Bot WhatsApp 24h',
    'Múltiplos perfis (PF/PJ)',
    'Investimentos e Dividendos',
    'Controle de DAS (MEI)',
    'Relatórios avançados',
    'Notificações push e email',
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
                    <span className={styles.badge}>Plano Único</span>
                    <h2 className={styles.title}>Acesso completo a tudo</h2>
                    <p className={styles.subtitle}>
                        Um plano. Todas as funcionalidades. Escolha como pagar.
                    </p>
                </motion.div>

                <div className={styles.cardsGrid}>
                    {/* Monthly */}
                    <motion.div
                        className={styles.card}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <div className={styles.cardHeader}>
                            <span className={styles.planName}>Mensal</span>
                            <p className={styles.planDescription}>Pague mês a mês</p>
                            <div className={styles.priceWrapper}>
                                <span className={styles.currency}>R$</span>
                                <span className={styles.price}>29,90</span>
                                <span className={styles.period}>/mês</span>
                            </div>
                        </div>

                        <ul className={styles.features}>
                            {allFeatures.map((feature) => (
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

                    {/* Annual */}
                    <motion.div
                        className={`${styles.card} ${styles.cardPopular}`}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className={styles.popularBadge}>
                            Mais escolhido
                        </div>

                        <div className={styles.cardHeader}>
                            <span className={styles.planName}>Anual</span>
                            <p className={styles.planDescription}>Pague uma vez por ano</p>
                            <div className={styles.priceWrapper}>
                                <span className={styles.currency}>R$</span>
                                <span className={styles.price}>358,80</span>
                                <span className={styles.period}>/ano</span>
                            </div>
                            <p className={styles.annualNote}>
                                R$ 29,90/mês
                            </p>
                        </div>

                        <ul className={styles.features}>
                            {allFeatures.map((feature) => (
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
