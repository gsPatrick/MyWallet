'use client';

import { useState, useEffect } from 'react';
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
    FiFileText,
    FiCheckSquare,
    FiCreditCard,
    FiBriefcase,
    FiRefreshCw,
    FiDatabase
} from 'react-icons/fi';
import { BsBank2 } from 'react-icons/bs';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import { notificationsAPI } from '@/services/api';
import FullScreenLoader from '@/components/ui/FullScreenLoader';
import styles from './Header.module.css';

const quickActions = [
    { id: 'new-transaction', href: '/transactions?new=true', icon: FiPlus, label: 'Nova Transação', color: '#22c55e' },
    { id: 'new-goal', href: '/goals?new=true', icon: FiTarget, label: 'Nova Meta', color: '#8b5cf6' },
    { id: 'profile', href: '/settings', icon: FiUser, label: 'Perfil', color: '#3b82f6' },
    { id: 'cards', href: '/cards', icon: FiCreditCard, label: 'Cartão', color: '#f59e0b' },
    { id: 'banks', href: '/banks', icon: BsBank2, label: 'Bancos', color: '#0ea5e9' },
    { id: 'budget', href: '/budget-allocation', icon: FiSliders, label: 'Orçamento', color: '#ec4899' },
    { id: 'statements', href: '/settings/statement', icon: FiFileText, label: 'Extratos', color: '#14b8a6' },
];

// DAS shortcut for BUSINESS profiles only
const dasAction = { id: 'das', href: '/business/das', icon: FiDatabase, label: 'DAS', color: '#ef4444' };

export default function Header({ leftContent, rightContent }) {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const { profiles, currentProfile, switchProfile, loading: profilesLoading } = useProfiles();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
    const [profileSwitching, setProfileSwitching] = useState({ isActive: false, type: null });

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);


    const fetchNotifications = async () => {
        try {
            setLoadingNotifications(true);
            const { data } = await notificationsAPI.list();
            // Assuming data is array or { rows: [] }
            const list = Array.isArray(data) ? data : data.rows || [];
            setNotifications(list.slice(0, 5)); // Show top 5

            // Count unread
            const count = list.filter(n => !n.isRead).length;
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoadingNotifications(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    const handleMarkRead = async (id) => {
        try {
            await notificationsAPI.markRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking read', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsAPI.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all read', error);
        }
    };

    return (
        <>
            {/* Profile Switch Loading Animation */}
            <FullScreenLoader
                isVisible={profileSwitching.isActive}
                icon={profileSwitching.type}
            />

            <header className={styles.header}>
                {/* Custom Left Content (Dashboard tabs) - Far left */}
                {leftContent && <div className={styles.customContentLeft}>{leftContent}</div>}

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
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    if (!showNotifications) fetchNotifications();
                                }}
                                aria-label="Notificações"
                            >
                                <FiBell />
                                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
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
                                            {notifications.length > 0 && (
                                                <button className={styles.markRead} onClick={handleMarkAllRead}>
                                                    Limpar
                                                </button>
                                            )}
                                        </div>

                                        {loadingNotifications ? (
                                            <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                                Carregando...
                                            </div>
                                        ) : notifications.length === 0 ? (
                                            <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                                Nenhuma notificação
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    className={`${styles.notificationItem} ${n.isRead ? styles.read : ''}`}
                                                    onClick={() => !n.isRead && handleMarkRead(n.id)}
                                                >
                                                    <div className={`${styles.dot} ${styles[n.type?.toLowerCase()] || styles.info}`} />
                                                    <div className={styles.notificationText}>
                                                        <span className={styles.notificationTitle}>{n.title}</span>
                                                        <span className={styles.notificationMsg}>{n.message}</span>
                                                    </div>
                                                    {/* Simplistic time display */}
                                                    <span className={styles.notificationTime}>
                                                        {new Date(n.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Logo - Centered */}
                    <Link href="/dashboard" className={styles.logo}>
                        <img
                            src='/images/logoparafundopreto.png'
                            alt="MyWallet"
                            width={120}
                            className={styles.logoImage}
                        />
                    </Link>


                    {/* Profile Switcher moved to Account Dropdown and Dock */}

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

                                        {/* Profile Switcher Section */}
                                        {profiles.length > 0 && currentProfile && (
                                            <>
                                                <div className={styles.divider} />
                                                <div className={styles.profileSection}>
                                                    <span className={styles.profileSectionLabel}>Perfil Ativo</span>
                                                    <div className={styles.currentProfileBadge}>
                                                        <span className={styles.profileIcon}>
                                                            {currentProfile.type === 'BUSINESS' ? <FiBriefcase /> : <FiUser />}
                                                        </span>
                                                        <span>{currentProfile.name}</span>
                                                    </div>
                                                </div>
                                                <div className={styles.profileList}>
                                                    {profiles.filter(p => p.id !== currentProfile.id).map((profile) => (
                                                        <button
                                                            key={profile.id}
                                                            className={styles.profileOption}
                                                            onClick={async () => {
                                                                // Show animation
                                                                setProfileSwitching({
                                                                    isActive: true,
                                                                    type: profile.type === 'BUSINESS' ? 'profile-business' : 'profile-personal'
                                                                });
                                                                setShowDropdown(false);

                                                                // Switch profile
                                                                await switchProfile(profile.id);

                                                                // Delay reload for animation
                                                                setTimeout(() => {
                                                                    window.location.reload();
                                                                }, 1000);
                                                            }}
                                                        >
                                                            <span className={styles.profileIcon}>
                                                                {profile.type === 'BUSINESS' ? <FiBriefcase /> : <FiUser />}
                                                            </span>
                                                            <span>Trocar para {profile.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}

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

                {/* Custom Right Content (Date filters) - Far right */}
                {rightContent && <div className={styles.customContentRight}>{rightContent}</div>}
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
                                {/* DAS shortcut for BUSINESS profiles (MEI/ME) */}
                                {currentProfile?.type === 'BUSINESS' && (
                                    <Link
                                        href={dasAction.href}
                                        className={styles.quickActionItem}
                                        onClick={() => setShowQuickActions(false)}
                                    >
                                        <div className={styles.quickActionIcon} style={{ background: `${dasAction.color}20`, color: dasAction.color }}>
                                            <dasAction.icon />
                                        </div>
                                        <span>{dasAction.label}</span>
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
