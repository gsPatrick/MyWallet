'use client';

import { motion } from 'framer-motion';
import {
    FiLink, FiTrendingUp, FiTarget, FiCreditCard,
    FiPieChart, FiBarChart2
} from 'react-icons/fi';
import styles from './Features.module.css';

const features = [
    {
        icon: FiLink,
        title: 'Open Finance',
        description: 'Conecte suas contas bancárias e cartões automaticamente. Visualize todo seu patrimônio em um só lugar.'
    },
    {
        icon: FiTrendingUp,
        title: 'Investimentos',
        description: 'Acompanhe ações, FIIs, ETFs e renda fixa. Receba alertas de dividendos e análises de performance.'
    },
    {
        icon: FiTarget,
        title: 'Metas Financeiras',
        description: 'Defina objetivos de curto e longo prazo. Acompanhe seu progresso com visual intuitivo.'
    },
    {
        icon: FiCreditCard,
        title: 'Cartões de Crédito',
        description: 'Gerencie faturas, acompanhe gastos por categoria e evite surpresas no fechamento.'
    },
    {
        icon: FiPieChart,
        title: 'Orçamento Inteligente',
        description: 'Distribua sua renda automaticamente. Visualize para onde vai cada centavo.'
    },
    {
        icon: FiBarChart2,
        title: 'Relatórios Detalhados',
        description: 'Análises completas de receitas, despesas e evolução patrimonial ao longo do tempo.'
    }
];

export default function Features() {
    return (
        <section id="features" className={styles.section}>
            <div className={styles.container}>
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className={styles.title}>Tudo que você precisa</h2>
                    <p className={styles.subtitle}>
                        Uma plataforma completa para gerenciar suas finanças pessoais
                    </p>
                </motion.div>

                <div className={styles.grid}>
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            className={styles.card}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -8 }}
                        >
                            <div className={styles.icon}>
                                <feature.icon />
                            </div>
                            <h3 className={styles.cardTitle}>{feature.title}</h3>
                            <p className={styles.cardDescription}>{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
