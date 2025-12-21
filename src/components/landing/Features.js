'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
    FiCreditCard, FiDollarSign, FiTarget, FiPieChart,
    FiMessageCircle, FiBell, FiTrendingUp, FiUsers
} from 'react-icons/fi';
import styles from './Features.module.css';

const features = [
    {
        icon: FiCreditCard,
        title: 'Cartões e Contas',
        description: 'Cadastre todos os seus cartões de crédito e contas bancárias. Visualize saldos e faturas em um só lugar.',
        color: '#6366f1'
    },
    {
        icon: FiDollarSign,
        title: 'Transações Inteligentes',
        description: 'Registre receitas e despesas com categorização automática por Inteligência Artificial.',
        color: '#8b5cf6'
    },
    {
        icon: FiPieChart,
        title: 'Orçamentos',
        description: 'Crie orçamentos por categoria e receba alertas quando estiver próximo do limite.',
        color: '#ec4899'
    },
    {
        icon: FiTarget,
        title: 'Metas Financeiras',
        description: 'Defina metas de economia e acompanhe seu progresso com visualizações intuitivas.',
        color: '#10b981'
    },
    {
        icon: FiMessageCircle,
        title: 'Bot WhatsApp',
        description: 'Registre transações e consulte saldos direto pelo WhatsApp, 24 horas por dia.',
        color: '#22c55e'
    },
    {
        icon: FiBell,
        title: 'Notificações',
        description: 'Receba alertas de vencimento, orçamentos e metas atingidas por push e email.',
        color: '#f59e0b'
    },
    {
        icon: FiTrendingUp,
        title: 'Investimentos',
        description: 'Controle sua carteira de investimentos: ações, FIIs, renda fixa e dividendos.',
        color: '#3b82f6'
    },
    {
        icon: FiUsers,
        title: 'Múltiplos Perfis',
        description: 'Separe suas finanças pessoais e empresariais com perfis isolados.',
        color: '#a855f7'
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
                    <span className={styles.badge}>Funcionalidades</span>
                    <h2 className={styles.title}>Tudo que você precisa para organizar suas finanças</h2>
                    <p className={styles.subtitle}>
                        Uma plataforma completa com ferramentas poderosas para controle total do seu dinheiro
                    </p>
                </motion.div>

                {/* Screenshot Placeholder */}
                <motion.div
                    className={styles.screenshotWrapper}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    <div className={styles.screenshotPlaceholder}>
                        {/* Placeholder para screenshot do dashboard */}
                        <Image
                            src="/images/dashboard-screenshot.png"
                            alt="Dashboard MyWallet"
                            fill
                            style={{ objectFit: 'cover', borderRadius: '16px' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className={styles.placeholderText}>
                            <FiPieChart size={48} />
                            <span>Screenshot do Dashboard</span>
                        </div>
                    </div>
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
                            whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
                        >
                            <div className={styles.icon} style={{ background: `${feature.color}15`, color: feature.color }}>
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
