'use client';

import { motion } from 'framer-motion';
import {
    FiShield, FiSmartphone, FiZap, FiPieChart,
    FiTrendingUp, FiBell
} from 'react-icons/fi';
import styles from './Benefits.module.css';

const benefits = [
    {
        icon: FiShield,
        title: 'Segurança Total',
        description: 'Dados criptografados com padrão bancário'
    },
    {
        icon: FiSmartphone,
        title: 'Acesse de Qualquer Lugar',
        description: 'Web e mobile sempre sincronizados'
    },
    {
        icon: FiZap,
        title: 'Sincronização Automática',
        description: 'Transações atualizadas em tempo real'
    },
    {
        icon: FiPieChart,
        title: 'Relatórios Inteligentes',
        description: 'Análises personalizadas do seu perfil'
    },
    {
        icon: FiTrendingUp,
        title: 'Acompanhe Evolução',
        description: 'Veja seu patrimônio crescer ao longo do tempo'
    },
    {
        icon: FiBell,
        title: 'Alertas Personalizados',
        description: 'Notificações de metas e vencimentos'
    },
];

export default function Benefits() {
    return (
        <section id="benefits" className={styles.section}>
            <div className={styles.container}>
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className={styles.title}>Por que escolher a MyWallet?</h2>
                    <p className={styles.subtitle}>
                        Recursos pensados para simplificar sua vida financeira
                    </p>
                </motion.div>

                <div className={styles.grid}>
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={benefit.title}
                            className={styles.card}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <div className={styles.iconWrapper}>
                                <benefit.icon className={styles.icon} />
                            </div>
                            <h3 className={styles.cardTitle}>{benefit.title}</h3>
                            <p className={styles.cardDescription}>{benefit.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
