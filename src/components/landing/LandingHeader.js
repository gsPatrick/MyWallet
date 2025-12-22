'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePageTransition } from '@/components/PageTransition';
import { PWAInstallPrompt } from '@/components/PWA';
import styles from './LandingHeader.module.css';

export default function LandingHeader() {
    const { navigateWithTransition } = usePageTransition();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleLoginClick = (e) => {
        e.preventDefault();
        navigateWithTransition('/login');
    };

    const handleSignupClick = (e) => {
        e.preventDefault();
        navigateWithTransition('/signup');
    };

    return (
        <motion.header
            className={styles.header}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div className={styles.content}>
                <Link href="/" className={styles.logoLink}>
                    <Image
                        src="/images/logoparafundobranco.png"
                        alt="MyWallet"
                        width={140}
                        height={45}
                        className={styles.logo}
                        priority
                    />
                </Link>

                <nav className={styles.nav}>
                    <a href="#features" className={styles.navLink}>Funcionalidades</a>
                    <a href="#benefits" className={styles.navLink}>Benefícios</a>
                    <a href="#cta" className={styles.navLink}>Começar</a>
                </nav>

                <div className={styles.actions}>
                    <button onClick={handleLoginClick} className={styles.loginBtn}>
                        Entrar
                    </button>
                    <button onClick={handleSignupClick} className={styles.signupBtn}>
                        Criar Conta
                    </button>
                </div>
            </div>
        </motion.header>
    );
}
