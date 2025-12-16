'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiBell,
    FiSun,
    FiMoon,
    FiUser,
    FiSettings,
    FiLogOut,
    FiChevronDown,
    FiGrid,
    FiX,
    FiPlus,
    FiTarget,
    FiTrendingUp,
    FiPieChart,
    FiSliders,
    FiFileText
} from 'react-icons/fi';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Header.module.css';

const quickActions = [
    { id: 'new-transaction', href: '/transactions?new=true', icon: FiPlus, label: 'Nova Transação', color: '#22c55e' },
    { id: 'new-goal', href: '/goals?new=true', icon: FiTarget, label: 'Nova Meta', color: '#8b5cf6' },
    { id: 'new-investment', href: '/investments?new=true', icon: FiTrendingUp, label: 'Nova Operação', color: '#3b82f6' },
    { id: 'reports', href: '/reports', icon: FiPieChart, label: 'Relatórios', color: '#f59e0b' },
    { id: 'budget', href: '/budget-allocation', icon: FiSliders, label: 'Orçamento', color: '#ec4899' },
    { id: 'statements', href: '/statements', icon: FiFileText, label: 'Extratos', color: '#14b8a6' },
];

export default function Header() {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);

    const mockNotifications = [
        { id: 1, title: 'Dividendo PETR4', message: 'R$ 125,00', time: '2h', type: 'success' },
        { id: 2, title: 'Meta atingida!', message: 'Reserva completa', time: '5h', type: 'info' },
        { id: 3, title: 'Alerta de gastos', message: '80% do orçamento', time: '1d', type: 'warning' },
    ];

    return (
        <>
            <header className={styles.header}>
                <div className={styles.container}>
                    {/* Left Actions */}
                    <div className={styles.actions}>
                        {/* Theme Toggle */}
                        <button
                            className={styles.iconBtn}
                            onClick={toggleTheme}
                            aria-label="Alternar tema"
                        >
                            {theme === 'dark' ? <FiSun /> : <FiMoon />}
                        </button>

                        {/* Notifications */}
                        <div className={styles.notificationWrapper}>
                            <button
                                className={styles.iconBtn}
                                onClick={() => setShowNotifications(!showNotifications)}
                                aria-label="Notificações"
                            >
                                <FiBell />
                                <span className={styles.badge}>3</span>
                            </button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        className={styles.dropdown}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                    >
                                        <div className={styles.dropdownHeader}>
                                            Notificações
                                            <button className={styles.markRead}>Limpar</button>
                                        </div>
                                        {mockNotifications.map(n => (
                                            <div key={n.id} className={styles.notificationItem}>
                                                <div className={`${styles.dot} ${styles[n.type]}`} />
                                                <div className={styles.notificationText}>
                                                    <span className={styles.notificationTitle}>{n.title}</span>
                                                    <span className={styles.notificationMsg}>{n.message}</span>
                                                </div>
                                                <span className={styles.notificationTime}>{n.time}</span>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Logo - Centered */}
                    <Link href="/dashboard" className={styles.logo}>
                        <img
                            src={theme === 'dark' ? '/images/logoparafundopreto.png' : '/images/logoparafundobranco.png'}
                            alt="InvestPro"
                            className={styles.logoImage}
                        />
                    </Link>

                    {/* Right Actions */}
                    <div className={styles.actions}>
                        {/* Quick Actions Button */}
                        <button
                            className={styles.iconBtn}
                            onClick={() => setShowQuickActions(true)}
                            aria-label="Ações Rápidas"
                        >
                            <FiGrid />
                        </button>

                        {/* User - Avatar with dropdown */}
                        <div className={styles.userWrapper}>
                            <button
                                className={styles.userBtn}
                                onClick={() => setShowDropdown(!showDropdown)}
                            >
                                <img
                                    src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                                    alt=""
                                    className={styles.avatar}
                                />
                                <FiChevronDown className={styles.chevron} />
                            </button>

                            <AnimatePresence>
                                {showDropdown && (
                                    <motion.div
                                        className={styles.dropdown}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                    >
                                        <div className={styles.userInfo}>
                                            <span className={styles.userName}>{user?.name || 'Usuário'}</span>
                                            <span className={styles.userEmail}>{user?.email || 'email@example.com'}</span>
                                        </div>
                                        <div className={styles.divider} />
                                        <Link href="/profile/me" className={styles.menuItem}>
                                            <FiUser /> Perfil
                                        </Link>
                                        <Link href="/settings" className={styles.menuItem}>
                                            <FiSettings /> Configurações
                                        </Link>
                                        <div className={styles.divider} />
                                        <button className={styles.menuItem} onClick={logout}>
                                            <FiLogOut /> Sair
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </header>

            {/* Quick Actions Modal */}
            <AnimatePresence>
                {showQuickActions && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className={styles.quickActionsBackdrop}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowQuickActions(false)}
                        />

                        {/* Modal */}
                        <motion.div
                            className={styles.quickActionsModal}
                            initial={{ opacity: 0, scale: 0.9, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            <div className={styles.quickActionsHeader}>
                                <h3>Ações Rápidas</h3>
                                <button className={styles.closeBtn} onClick={() => setShowQuickActions(false)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className={styles.quickActionsGrid}>
                                {quickActions.map((action) => {
                                    const Icon = action.icon;
                                    return (
                                        <Link
                                            key={action.id}
                                            href={action.href}
                                            className={styles.quickActionItem}
                                            onClick={() => setShowQuickActions(false)}
                                        >
                                            <div className={styles.quickActionIcon} style={{ background: `${action.color}20`, color: action.color }}>
                                                <Icon />
                                            </div>
                                            <span>{action.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
