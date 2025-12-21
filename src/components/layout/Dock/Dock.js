'use client';

import { useState } from 'react';
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
    FiDatabase
} from 'react-icons/fi';
import { BsBank2 } from 'react-icons/bs';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useProfiles } from '@/contexts/ProfileContext';
import FutureFeatureModal from '@/components/modals/FutureFeatureModal';
import FullScreenLoader from '@/components/ui/FullScreenLoader';
import styles from './Dock.module.css';

const dockItems = [
    { id: 'dashboard', href: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { id: 'transactions', href: '/transactions', icon: FiList, label: 'Transações' },
    { id: 'open-finance', href: '/open-finance', icon: FiLink, label: 'Open Finance', isFuture: true },
    { id: 'investments', href: '/investments', icon: FiTrendingUp, label: 'Investimentos', isFuture: true },
    { id: 'cards', href: '/cards', icon: FiCreditCard, label: 'Cartões' },
    { id: 'goals', href: '/goals', icon: FiTarget, label: 'Metas' },
    { id: 'budget', href: '/budget-allocation', icon: FiSliders, label: 'Orçamento' },
    { id: 'settings', href: '/settings', icon: FiSettings, label: 'Config' },
];

const quickActions = [
    { id: 'new-transaction', href: '/transactions?new=true', icon: FiPlus, label: 'Nova Transação', color: '#22c55e' },
    { id: 'new-goal', href: '/goals?new=true', icon: FiTarget, label: 'Nova Meta', color: '#8b5cf6' },
    { id: 'profile', href: '/profile/me', icon: FiUser, label: 'Perfil', color: '#3b82f6' },
    { id: 'cards', href: '/cards', icon: FiCreditCard, label: 'Cartão', color: '#f59e0b' },
    { id: 'banks', href: '/banks', icon: BsBank2, label: 'Bancos', color: '#0ea5e9' },
    { id: 'budget', href: '/budget-allocation', icon: FiSliders, label: 'Orçamento', color: '#ec4899' },
    { id: 'statements', href: '/settings/statement', icon: FiFileText, label: 'Extratos', color: '#14b8a6' },
];

// DAS shortcut for BUSINESS profiles only
const dasAction = { id: 'das', href: '/business/das', icon: FiDatabase, label: 'DAS', color: '#ef4444' };

export default function Dock() {
    const pathname = usePathname();
    const { hideData, toggleHideData } = usePrivacy();
    const { profiles, currentProfile, switchProfile } = useProfiles();
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [profileSwitching, setProfileSwitching] = useState({ isActive: false, type: null });
    const [showFutureModal, setShowFutureModal] = useState(false);

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
        </>
    );
}
