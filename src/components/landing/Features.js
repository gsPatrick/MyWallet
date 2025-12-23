'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
    FiCreditCard, FiDollarSign, FiTarget, FiMessageCircle,
    FiPieChart, FiBell, FiTrendingUp, FiUsers
} from 'react-icons/fi';
import styles from './Features.module.css';

// Main features with alternating layout
const mainFeatures = [
    {
        id: 'cards',
        icon: FiCreditCard,
        title: 'Controle de Cartões e Contas',
        description: 'Cadastre todos os seus cartões de crédito, débito e contas bancárias. Visualize saldos, faturas e limite disponível em um só lugar. Nunca mais se perca nas suas finanças.',
        image: '/images/feature-cards.png',
        color: '#6366f1'
    },
    {
        id: 'transactions',
        icon: FiDollarSign,
        title: 'Transações com IA',
        description: 'Registre suas receitas e despesas com categorização automática por Inteligência Artificial. O sistema aprende seus hábitos e sugere categorias de forma inteligente.',
        image: '/images/feature-transactions.png',
        color: '#8b5cf6'
    },
    {
        id: 'goals',
        icon: FiTarget,
        title: 'Metas Financeiras',
        description: 'Defina objetivos de curto e longo prazo. Acompanhe seu progresso com visualizações intuitivas e receba notificações quando estiver perto de alcançar sua meta.',
        image: '/images/feature-goals.png',
        color: '#10b981'
    },
    {
        id: 'whatsapp',
        icon: FiMessageCircle,
        title: 'Bot do WhatsApp',
        description: 'Registre transações, consulte saldos e receba alertas direto pelo WhatsApp. Acesse suas finanças 24 horas por dia sem abrir o app.',
        image: '/images/feature-whatsapp.png',
        color: '#22c55e'
    }
];

// Secondary features as cards
const cardFeatures = [
    {
        icon: FiPieChart,
        title: 'Orçamentos Inteligentes',
        description: 'Crie orçamentos por categoria e receba alertas quando estiver próximo do limite.',
        color: '#ec4899'
    },
    {
        icon: FiBell,
        title: 'Notificações',
        description: 'Alertas de vencimento, orçamentos e metas atingidas por push e email.',
        color: '#f59e0b'
    },
    {
        icon: FiTrendingUp,
        title: 'Investimentos',
        description: 'Controle sua carteira: ações, FIIs, renda fixa e dividendos.',
        color: '#3b82f6'
    },
    {
        icon: FiUsers,
        title: 'Múltiplos Perfis',
        description: 'Separe finanças pessoais e empresariais com perfis isolados.',
        color: '#a855f7'
    }
];

// Floating animation variants
const floatAnimation = {
    initial: { y: 0 },
    animate: {
        y: [-8, 8, -8],
        transition: {
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    }
};

export default function Features() {
    return (
        <section id="features" className={styles.section}>
            <div className={styles.container}>
                {/* Header */}
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

                {/* Dashboard Screenshot */}
                <motion.div
                    className={styles.dashboardWrapper}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    <motion.div
                        className={styles.dashboardContainer}
                        variants={floatAnimation}
                        initial="initial"
                        animate="animate"
                    >
                        <div className={styles.macHeader}>
                            <div className={styles.macDots}>
                                <div className={`${styles.macDot} ${styles.macDotRed}`} />
                                <div className={`${styles.macDot} ${styles.macDotYellow}`} />
                                <div className={`${styles.macDot} ${styles.macDotGreen}`} />
                            </div>
                        </div>
                        <div className={styles.dashboardPlaceholder}>
                            <Image
                                src="/images/dashboard.png"
                                alt="Dashboard MyWallet"
                                fill
                                style={{ objectFit: 'contain' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </div>
                    </motion.div>
                </motion.div>

                {/* Transition Phrase */}
                <motion.div
                    className={styles.transitionPhrase}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <h3 className={styles.transitionTitle}>
                        Conheça cada funcionalidade em detalhes
                    </h3>
                    <p className={styles.transitionSubtitle}>
                        Descubra como cada recurso pode transformar a forma como você lida com seu dinheiro
                    </p>
                </motion.div>

                {/* Alternating Feature Sections */}
                <div className={styles.featuresAlternating}>
                    {mainFeatures.map((feature, index) => (
                        <motion.div
                            key={feature.id}
                            className={`${styles.featureRow} ${index % 2 === 1 ? styles.reversed : ''}`}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-100px' }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                        >
                            {/* Image Side - CSS Mockups */}
                            <div className={styles.featureImageWrapper}>
                                <motion.div
                                    className={styles.featureImageContainer}
                                    variants={floatAnimation}
                                    initial="initial"
                                    animate="animate"
                                >
                                    <div className={styles.imageGlow} style={{ background: `${feature.color}30` }} />
                                    <div className={styles.imagePlaceholder}>
                                        <div className={styles.mockupContainer}>
                                            {feature.id === 'cards' && (
                                                <div className={styles.creditCard}>
                                                    <div className={styles.cardTop}>
                                                        <div className={styles.cardChip} />
                                                        <FiCreditCard className={styles.cardContactless} size={24} color="white" />
                                                    </div>
                                                    <div className={styles.cardNumber}>
                                                        •••• •••• •••• 8842
                                                    </div>
                                                    <div className={styles.cardBottom}>
                                                        <div className={styles.cardInfo}>
                                                            <span className={styles.cardLabel}>Titular</span>
                                                            <span className={styles.cardHolder}>PATRICK S.</span>
                                                        </div>
                                                        <div className={styles.cardLogo}>
                                                            <div className={`${styles.mastercardCircle} ${styles.mcRed}`} />
                                                            <div className={`${styles.mastercardCircle} ${styles.mcOrange}`} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {feature.id === 'transactions' && (
                                                <div className={styles.transactionList}>
                                                    <div className={styles.transactionHeader}>HOJE</div>

                                                    <div className={styles.transactionItem}>
                                                        <div className={styles.transactionIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                                            <FiUsers />
                                                        </div>
                                                        <div className={styles.transactionDetails}>
                                                            <span className={styles.transactionName}>Netflix</span>
                                                            <span className={styles.transactionDate}>Assinatura</span>
                                                        </div>
                                                        <span className={`${styles.transactionAmount} ${styles.expense}`}>- R$ 55,90</span>
                                                    </div>

                                                    <div className={styles.transactionItem}>
                                                        <div className={styles.transactionIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                                            <FiDollarSign />
                                                        </div>
                                                        <div className={styles.transactionDetails}>
                                                            <span className={styles.transactionName}>Salário</span>
                                                            <span className={styles.transactionDate}>Mensal</span>
                                                        </div>
                                                        <span className={`${styles.transactionAmount} ${styles.income}`}>+ R$ 8.500</span>
                                                    </div>

                                                    <div className={styles.transactionItem}>
                                                        <div className={styles.transactionIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                                            <FiTarget />
                                                        </div>
                                                        <div className={styles.transactionDetails}>
                                                            <span className={styles.transactionName}>Uber</span>
                                                            <span className={styles.transactionDate}>Transporte</span>
                                                        </div>
                                                        <span className={`${styles.transactionAmount} ${styles.expense}`}>- R$ 24,90</span>
                                                    </div>
                                                </div>
                                            )}

                                            {feature.id === 'goals' && (
                                                <div className={styles.goalCard}>
                                                    <div className={styles.goalTop}>
                                                        <div className={styles.goalIconWrapper}>
                                                            <FiTarget />
                                                        </div>
                                                        <div className={styles.goalInfo}>
                                                            <span className={styles.goalTitle}>Viagem Europa</span>
                                                            <span className={styles.goalTarget}>Meta: R$ 15.000</span>
                                                        </div>
                                                    </div>

                                                    <div className={styles.goalProgress}>
                                                        <div className={styles.progressBarBg}>
                                                            <motion.div
                                                                className={styles.progressBarFill}
                                                                initial={{ width: 0 }}
                                                                whileInView={{ width: '65%' }}
                                                                transition={{ duration: 1.5, delay: 0.5 }}
                                                            />
                                                        </div>
                                                        <div className={styles.goalStats}>
                                                            <span>R$ 9.750</span>
                                                            <span>65%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {feature.id === 'whatsapp' && (
                                                <div className={styles.chatInterface}>
                                                    <div className={`${styles.chatBubble} ${styles.bubbleRight}`}>
                                                        Qual meu saldo atual?
                                                        <span className={styles.messageTime}>10:42</span>
                                                    </div>

                                                    <div className={styles.chatMessage}>
                                                        <div className={styles.botAvatar}>
                                                            <FiMessageCircle size={14} />
                                                        </div>
                                                        <div className={`${styles.chatBubble} ${styles.bubbleLeft}`}>
                                                            Seu saldo total é de <b>R$ 12.450,32</b> 💰
                                                            <span className={styles.messageTime}>10:42</span>
                                                        </div>
                                                    </div>

                                                    <div className={styles.chatMessage}>
                                                        <div className={styles.botAvatar}>
                                                            <FiMessageCircle size={14} />
                                                        </div>
                                                        <div className={`${styles.chatBubble} ${styles.bubbleLeft} ${styles.typingIndicator}`}>
                                                            <div className={styles.typingDot}></div>
                                                            <div className={styles.typingDot}></div>
                                                            <div className={styles.typingDot}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Text Side */}
                            <div className={styles.featureContent}>
                                <div className={styles.featureIcon} style={{ background: `${feature.color}15`, color: feature.color }}>
                                    <feature.icon />
                                </div>
                                <h3 className={styles.featureTitle}>{feature.title}</h3>
                                <p className={styles.featureDescription}>{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Card Features Grid */}
                <motion.div
                    className={styles.cardsHeader}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h3 className={styles.cardsTitle}>E muito mais...</h3>
                </motion.div>

                <div className={styles.cardsGrid}>
                    {cardFeatures.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            className={styles.card}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
                        >
                            <div className={styles.cardIcon} style={{ background: `${feature.color}15`, color: feature.color }}>
                                <feature.icon />
                            </div>
                            <h4 className={styles.cardTitle}>{feature.title}</h4>
                            <p className={styles.cardDescription}>{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
