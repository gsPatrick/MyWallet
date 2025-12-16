'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCheck, FiArrowRight } from 'react-icons/fi';
import styles from './Pricing.module.css';

const features = [
    'Acesso completo',
    'Open Finance ilimitado',
    'Relatórios e análises',
    'Metas personalizadas',
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
                    <h2 className={styles.title}>Planos</h2>
                    <p className={styles.subtitle}>
                        Escolha o plano ideal para você
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
                                <span className={styles.price}>39,90</span>
                                <span className={styles.period}>/mês</span>
                            </div>
                        </div>

                        <ul className={styles.features}>
                            {features.map((feature) => (
                                <li key={feature}>
                                    <FiCheck className={styles.checkIcon} />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Link href="/signup" className={styles.ctaBtn}>
                            Começar
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
                            Mais escolhido
                        </div>

                        <div className={styles.cardHeader}>
                            <span className={styles.planName}>Anual</span>
                            <div className={styles.priceWrapper}>
                                <span className={styles.currency}>R$</span>
                                <span className={styles.price}>29,90</span>
                                <span className={styles.period}>/mês</span>
                            </div>
                            <p className={styles.annualNote}>
                                Cobrado R$ 358,80 por ano
                            </p>
                            <div className={styles.saveBadge}>Economize 25%</div>
                        </div>

                        <ul className={styles.features}>
                            {features.map((feature) => (
                                <li key={feature}>
                                    <FiCheck className={styles.checkIcon} />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Link href="/signup" className={styles.ctaBtnPopular}>
                            Começar
                            <FiArrowRight />
                        </Link>
                    </motion.div>
                </div>

                <p className={styles.guarantee}>
                    7 dias de garantia • Cancele quando quiser
                </p>
            </div>
        </section>
    );
}
