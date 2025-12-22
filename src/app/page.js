'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import {
    Hero,
    LandingHeader,
    Features,
    OpenFinance,
    Benefits,
    Pricing,
    LandingFooter
} from '@/components/landing';
import { PWAInstallPrompt } from '@/components/PWA';
import styles from './page.module.css';

export default function LandingPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className={styles.loaderContainer}>
                <div className={styles.loader}>
                    <div className={styles.loadingBar}>
                        <div className={styles.loadingProgress}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <LandingHeader />
            <Hero />
            <Features />
            <OpenFinance />
            <Benefits />
            <Pricing />

            {/* CTA Section */}
            <section id="cta" className={styles.ctaSection}>
                <motion.div
                    className={styles.ctaContent}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className={styles.ctaTitle}>
                        Pronto para assumir o controle?
                    </h2>
                    <p className={styles.ctaSubtitle}>
                        Crie sua conta gratuita e comece a organizar suas finanças hoje mesmo.
                    </p>
                    <Link href="/signup" className={styles.ctaButton}>
                        Começar Agora <FiArrowRight />
                    </Link>
                </motion.div>
            </section>

            <LandingFooter />

            {/* Floating PWA Install Button - Bottom Right on Mobile */}
            <PWAInstallPrompt variant="floating" />
        </div>
    );
}
