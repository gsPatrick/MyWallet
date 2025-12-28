'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiHome,
    FiTrendingUp,
    FiCreditCard,
    FiLink,
    FiTarget,
    FiSliders,
    FiSettings,
    FiList,
    FiGrid,
    FiEye,
    FiEyeOff,
    FiX,
    FiPlus,
    FiDollarSign,
    FiPieChart,
    FiFileText,
    FiUser,
    FiBriefcase,
    FiUsers,
    FiDatabase,
    FiLogOut,
    FiRepeat
} from 'react-icons/fi';
import { BsBank2 } from 'react-icons/bs';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useProfiles } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import FutureFeatureModal from '@/components/modals/FutureFeatureModal';
import QuickTransactionModal from '@/components/modals/QuickTransactionModal';
import QuickGoalModal from '@/components/modals/QuickGoalModal';
import QuickTransferModal from '@/components/modals/QuickTransferModal';
import SubscriptionModal from '@/components/modals/SubscriptionModal';
import { cardsAPI } from '@/services/api';
import FullScreenLoader from '@/components/ui/FullScreenLoader';
import styles from './Dock.module.css';

const dockItems = [
    { id: 'dashboard', href: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { id: 'transactions', href: '/transactions', icon: FiList, label: 'Transações' },
    { id: 'investments', href: '/brokers', icon: FiTrendingUp, label: 'Investimentos' },
    { id: 'cards', href: '/cards', icon: FiCreditCard, label: 'Cartões' },
    { id: 'goals', href: '/goals', icon: FiTarget, label: 'Metas' },
    { id: 'budget', href: '/budget-allocation', icon: FiSliders, label: 'Orçamento' },
    { id: 'settings', href: '/settings', icon: FiSettings, label: 'Config' },
];

const quickActions = [
    { id: 'new-transaction', href: null, icon: FiPlus, label: 'Nova Transação', color: '#22c55e', isModal: 'transaction' },
    { id: 'new-subscription', href: null, icon: FiRepeat, label: 'Nova Assinatura', color: '#8b5cf6', isModal: 'subscription' },
    { id: 'new-goal', href: null, icon: FiTarget, label: 'Nova Meta', color: '#f59e0b', isModal: 'goal' },
    { id: 'new-transfer', href: null, icon: FiRepeat, label: 'Nova Transferência', color: '#0ea5e9', isModal: 'transfer' },
    { id: 'profile', href: '/profile/me', icon: FiUser, label: 'Perfil', color: '#3b82f6' },
    { id: 'banks', href: '/banks', icon: BsBank2, label: 'Bancos', color: '#0ea5e9' },
    { id: 'statements', href: '/settings/statement', icon: FiFileText, label: 'Extratos', color: '#14b8a6' },
    { id: 'logout', href: null, icon: FiLogOut, label: 'Sair', color: '#ef4444', isLogout: true },
];

// DAS shortcut for BUSINESS profiles only
const dasAction = { id: 'das', href: '/business/das', icon: FiDatabase, label: 'DAS', color: '#ef4444' };

export default function Dock() {
    const pathname = usePathname();
    const { hideData, toggleHideData } = usePrivacy();
    const { profiles, currentProfile, switchProfile } = useProfiles();
    const { logout } = useAuth();
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [profileSwitching, setProfileSwitching] = useState({ isActive: false, type: null });
    const [showFutureModal, setShowFutureModal] = useState(false);

    // Quick Action Modals
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [cards, setCards] = useState([]);

    // Load cards for subscription modal
    useEffect(() => {
        const loadCards = async () => {
            try {
                const res = await cardsAPI.list();
                setCards(res.data || []);
            } catch (error) {
                console.error('Error loading cards:', error);
            }
        };
        loadCards();
    }, []);

    const handleLogout = async () => {
        setShowQuickActions(false);
        await logout();
    };

    // Handle modal open from quick actions
    const handleOpenTransactionModal = () => {
        setShowQuickActions(false);
        setShowTransactionModal(true);
    };

    const handleOpenGoalModal = () => {
        setShowQuickActions(false);
        setShowGoalModal(true);
    };

    const handleOpenTransferModal = () => {
        setShowQuickActions(false);
        setShowTransferModal(true);
    };

    const handleOpenSubscriptionModal = () => {
        setShowQuickActions(false);
        setShowSubscriptionModal(true);
    };

    // When modal closes, reopen quick actions
    const handleTransactionModalClose = () => {
        setShowTransactionModal(false);
        setShowQuickActions(true);
    };

    const handleGoalModalClose = () => {
        setShowGoalModal(false);
        setShowQuickActions(true);
    };

    const handleTransferModalClose = () => {
        setShowTransferModal(false);
        setShowQuickActions(true);
    };

    const handleSubscriptionModalClose = () => {
        setShowSubscriptionModal(false);
        setShowQuickActions(true);
    };

    const handleSubscriptionSave = async (payload) => {
        try {
            // Import subscriptions API dynamically to avoid circular dependency
            const { subscriptionsAPI } = await import('@/services/api');
            await subscriptionsAPI.create(payload);
            setShowSubscriptionModal(false);
            setShowQuickActions(true);
        } catch (error) {
            console.error('Error creating subscription:', error);
            alert(error.response?.data?.message || 'Erro ao criar assinatura');
        }
    };

    const isActive = (href) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Profile Switch Loading Animation */}
            <FullScreenLoader
                isVisible={profileSwitching.isActive}
                icon={profileSwitching.type}
            />

            <FutureFeatureModal
                isOpen={showFutureModal}
                onClose={() => setShowFutureModal(false)}
            />

            <nav className={styles.dock}>
                <div className={styles.dockContainer}>
                    {/* Privacy Toggle */}
                    <motion.button
                        className={`${styles.dockItem} ${styles.privacyBtn}`}
                        onClick={toggleHideData}
                        whileHover={{ scale: 1.3, y: -8, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                        whileTap={{ scale: 1.1 }}
                        title={hideData ? 'Mostrar valores' : 'Ocultar valores'}
                    >
                        {hideData ? <FiEyeOff className={styles.icon} /> : <FiEye className={styles.icon} />}
                    </motion.button>

                    {/* Divider */}
                    <div className={styles.dockDivider} />

                    {/* Navigation Items */}
                    {dockItems.map((item, index) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        if (item.isFuture) {
                            return (
                                <div key={item.id} className={styles.dockItemWrapper} id={`dock-${item.id}`} onClick={() => setShowFutureModal(true)}>
                                    <motion.div
                                        className={`${styles.dockItem} ${active ? styles.active : ''}`}
                                        whileHover={{
                                            scale: 1.3,
                                            y: -8,
                                            transition: { type: 'spring', stiffness: 400, damping: 15 }
                                        }}
                                        whileTap={{ scale: 1.1 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Icon className={styles.icon} />
                                        <motion.span
                                            className={styles.tooltip}
                                            initial={{ opacity: 0, y: 10 }}
                                            whileHover={{ opacity: 1, y: 0 }}
                                        >
                                            {item.label}
                                        </motion.span>
                                    </motion.div>
                                </div>
                            );
                        }

                        return (
                            <Link key={item.id} href={item.href} className={styles.dockItemWrapper} id={`dock-${item.id}`}>
                                <motion.div
                                    className={`${styles.dockItem} ${active ? styles.active : ''}`}
                                    whileHover={{
                                        scale: 1.3,

                                        y: -8,
                                        transition: { type: 'spring', stiffness: 400, damping: 15 }
                                    }}
                                    whileTap={{ scale: 1.1 }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Icon className={styles.icon} />
                                    <motion.span
                                        className={styles.tooltip}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileHover={{ opacity: 1, y: 0 }}
                                    >
                                        {item.label}
                                    </motion.span>
                                </motion.div>
                            </Link>
                        );
                    })}

                    {/* Divider */}
                    <div className={styles.dockDivider} />

                    {/* Quick Actions Button */}
                    <motion.button
                        className={`${styles.dockItem} ${styles.quickActionsBtn} ${showQuickActions ? styles.active : ''}`}
                        onClick={() => setShowQuickActions(true)}
                        whileHover={{ scale: 1.3, y: -8, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                        whileTap={{ scale: 1.1 }}
                        title="Ações Rápidas"
                    >
                        <FiGrid className={styles.icon} />
                    </motion.button>
                </div>
            </nav>

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
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            <div className={styles.quickActionsHeader}>
                                <h3>Ações Rápidas</h3>
                                <button className={styles.closeBtn} onClick={() => setShowQuickActions(false)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className={styles.quickActionsGrid}>
                                {/* Regular quick actions */}
                                {quickActions.map((action) => {
                                    const Icon = action.icon;

                                    // Logout action - use button instead of Link
                                    if (action.isLogout) {
                                        return (
                                            <button
                                                key={action.id}
                                                className={styles.quickActionItem}
                                                onClick={handleLogout}
                                            >
                                                <div className={styles.quickActionIcon} style={{ background: `${action.color}20`, color: action.color }}>
                                                    <Icon />
                                                </div>
                                                <span>{action.label}</span>
                                            </button>
                                        );
                                    }

                                    // Modal actions (Transaction, Goal, Transfer, Subscription)
                                    if (action.isModal) {
                                        const handleClick = action.isModal === 'transaction'
                                            ? handleOpenTransactionModal
                                            : action.isModal === 'goal'
                                                ? handleOpenGoalModal
                                                : action.isModal === 'transfer'
                                                    ? handleOpenTransferModal
                                                    : handleOpenSubscriptionModal;
                                        return (
                                            <button
                                                key={action.id}
                                                className={styles.quickActionItem}
                                                onClick={handleClick}
                                            >
                                                <div className={styles.quickActionIcon} style={{ background: `${action.color}20`, color: action.color }}>
                                                    <Icon />
                                                </div>
                                                <span>{action.label}</span>
                                            </button>
                                        );
                                    }

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

                            {/* Profile Switcher Section */}
                            {profiles.length > 0 && currentProfile && (
                                <div className={styles.profileSection}>
                                    <div className={styles.profileSectionHeader}>
                                        <FiUsers />
                                        <span>Trocar Perfil</span>
                                    </div>
                                    <div className={styles.currentProfile}>
                                        <span className={styles.profileIconBox}>
                                            {currentProfile.type === 'BUSINESS' ? <FiBriefcase /> : <FiUser />}
                                        </span>
                                        <span>{currentProfile.name}</span>
                                        <span className={styles.activeBadge}>Ativo</span>
                                    </div>
                                    {profiles.filter(p => p.id !== currentProfile.id).map((profile) => (
                                        <button
                                            key={profile.id}
                                            className={styles.profileSwitchBtn}
                                            onClick={async () => {
                                                // Show animation
                                                setProfileSwitching({
                                                    isActive: true,
                                                    type: profile.type === 'BUSINESS' ? 'profile-business' : 'profile-personal'
                                                });
                                                setShowQuickActions(false);

                                                // Switch profile
                                                await switchProfile(profile.id);

                                                // Delay reload for animation
                                                setTimeout(() => {
                                                    window.location.reload();
                                                }, 1000);
                                            }}
                                        >
                                            <span className={styles.profileIconBox}>
                                                {profile.type === 'BUSINESS' ? <FiBriefcase /> : <FiUser />}
                                            </span>
                                            <span>{profile.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Quick Action Modals */}
            <QuickTransactionModal
                isOpen={showTransactionModal}
                onClose={handleTransactionModalClose}
                onSuccess={() => {
                    // Optional: refresh data or show notification
                }}
            />
            <QuickGoalModal
                isOpen={showGoalModal}
                onClose={handleGoalModalClose}
                onSuccess={() => {
                    // Optional: refresh data or show notification
                }}
            />
            <QuickTransferModal
                isOpen={showTransferModal}
                onClose={handleTransferModalClose}
                onSuccess={() => {
                    // Optional: refresh data or show notification
                }}
            />
            <SubscriptionModal
                isOpen={showSubscriptionModal}
                onClose={handleSubscriptionModalClose}
                onSave={handleSubscriptionSave}
                cards={cards}
            />
        </>
    );
}
