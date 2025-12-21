'use client';

/**
 * Admin Layout
 * ========================================
 * Layout dedicado para o admin, sem onboarding e dock
 * ========================================
 */

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiLogOut, FiHome } from 'react-icons/fi';
import styles from './layout.module.css';

function AdminHeader() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className={styles.adminHeader}>
            <div className={styles.headerContent}>
                <Link href="/admin" className={styles.logoLink}>
                    <Image
                        src="/images/logoparafundopreto.png"
                        alt="MyWallet Admin"
                        width={140}
                        height={50}
                        style={{ objectFit: 'contain' }}
                    />
                    <span className={styles.adminBadge}>Admin</span>
                </Link>

                <div className={styles.headerRight}>
                    <span className={styles.userName}>{user?.name}</span>
                    <Link href="/dashboard" className={styles.dashboardLink}>
                        <FiHome /> Dashboard
                    </Link>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <FiLogOut /> Sair
                    </button>
                </div>
            </div>
        </header>
    );
}

function AdminGuard({ children }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user && user.plan !== 'OWNER') {
            router.push('/dashboard');
        }
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
                <span>Verificando permissões...</span>
            </div>
        );
    }

    if (!user || user.plan !== 'OWNER') {
        return null;
    }

    return children;
}

function AdminLayoutContent({ children }) {
    return (
        <AdminGuard>
            <div className={styles.adminLayout}>
                <AdminHeader />
                <main className={styles.adminMain}>
                    {children}
                </main>
            </div>
        </AdminGuard>
    );
}

export default function AdminLayout({ children }) {
    return (
        <AdminLayoutContent>
            {children}
        </AdminLayoutContent>
    );
}
