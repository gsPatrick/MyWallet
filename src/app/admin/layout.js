'use client';

/**
 * Admin Layout
 * ========================================
 * Layout dedicado para o admin, sem onboarding e dock
 * Suporta tema claro e escuro
 * ========================================
 */

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiLogOut, FiHome, FiSun, FiMoon } from 'react-icons/fi';
import styles from './layout.module.css';

function AdminHeader({ theme, toggleTheme }) {
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
                        src={theme === 'dark' ? "/images/logoparafundopreto.png" : "/images/logoparafundobranco.png"}
                        alt="MyWallet Admin"
                        width={140}
                        height={50}
                        style={{ objectFit: 'contain' }}
                    />
                    <span className={styles.adminBadge}>Admin</span>
                </Link>

                <div className={styles.headerRight}>
                    <span className={styles.userName}>{user?.name}</span>

                    <button onClick={toggleTheme} className={styles.themeBtn} title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}>
                        {theme === 'dark' ? <FiSun /> : <FiMoon />}
                    </button>

                    <Link href="/dashboard" className={styles.dashboardLink}>
                        <FiHome /> <span>Dashboard</span>
                    </Link>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <FiLogOut /> <span>Sair</span>
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
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const saved = localStorage.getItem('admin_theme') || 'dark';
        setTheme(saved);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('admin_theme', newTheme);
    };

    return (
        <AdminGuard>
            <div className={`${styles.adminLayout} ${styles[theme]}`} data-theme={theme}>
                <AdminHeader theme={theme} toggleTheme={toggleTheme} />
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
