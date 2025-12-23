'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCheck, FiX } from 'react-icons/fi';
import styles from './Pricing.module.css';

const monthlyFeatures = [
    { text: 'Dashboard completo', included: true },
    { text: 'Até 3 contas bancárias', included: true },
    { text: 'Até 2 cartões', included: true },
    { text: 'Orçamentos (até 5)', included: true },
    { text: 'Metas financeiras', included: true },
    { text: 'Bot WhatsApp', included: false },
    { text: 'Múltiplos perfis (PF/PJ)', included: false },
    { text: 'Investimentos', included: false },
];

const annualFeatures = [
    { text: 'Dashboard completo', included: true },
    { text: 'Contas ilimitadas', included: true },
    { text: 'Cartões ilimitados', included: true },
    { text: 'Orçamentos ilimitados', included: true },
    { text: 'Metas financeiras', included: true },
    { text: 'Bot WhatsApp 24h', included: true },
    { text: 'Múltiplos perfis (PF/PJ)', included: true },
    { text: 'Investimentos e Dividendos', included: true },
    { text: 'Controle de DAS (MEI)', included: true },
    { text: 'Relatórios avançados', included: true },
    { text: 'Suporte prioritário', included: true },
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
                    {/* Monthly Plan - Essencial */}
                    <motion.div
                        className={styles.card}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <div className={styles.cardHeader}>
                            <span className={styles.planName}>Essencial</span>
                            <p className={styles.planDescription}>Para quem está começando</p>
                            <div className={styles.priceWrapper}>
                                <span className={styles.currency}>R$</span>
                                <span className={styles.price}>19,90</span>
                                <span className={styles.period}>/mês</span>
                            </div>
                        </div>

                        <ul className={styles.features}>
                            {monthlyFeatures.map((feature) => (
                                <li key={feature.text} className={feature.included ? '' : styles.notIncluded}>
                                    {feature.included ? (
                                        <FiCheck className={styles.checkIcon} />
                                    ) : (
                                        <FiX className={styles.xIcon} />
                                    )}
                                    {feature.text}
                                </li>
                            ))}
                        </ul>

                        <Link href="/signup" className={styles.ctaBtn}>
                            Começar agora
                        </Link>
                    </motion.div>

                    {/* Annual Plan - Completo */}
                    <motion.div
                        className={`${styles.card} ${styles.cardPopular}`}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className={styles.popularBadge}>
                            Mais completo
                        </div>

                        <div className={styles.cardHeader}>
                            <span className={styles.planName}>Completo</span>
                            <p className={styles.planDescription}>Tudo liberado, sem limites</p>
                            <div className={styles.priceWrapper}>
                                <span className={styles.currency}>R$</span>
                                <span className={styles.price}>29,90</span>
                                <span className={styles.period}>/mês</span>
                            </div>
                            <p className={styles.annualNote}>
                                ou R$ 297/ano (2 meses grátis)
                            </p>
                            <div className={styles.saveBadge}>Economia de R$ 62</div>
                        </div>

                        <ul className={styles.features}>
                            {annualFeatures.map((feature) => (
                                <li key={feature.text}>
                                    <FiCheck className={styles.checkIcon} />
                                    {feature.text}
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
