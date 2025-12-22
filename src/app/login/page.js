'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiCheck } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { usePageTransition } from '@/components/PageTransition';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuth();
    const { addNotification } = useNotification();
    const { setIsTransitioning } = usePageTransition();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loginPhase, setLoginPhase] = useState('form'); // 'form' | 'animating' | 'redirect'
    const [pageReady, setPageReady] = useState(false);

    // Entry animation - close the transition overlay
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsTransitioning(false);
            setPageReady(true);
        }, 100);
        return () => clearTimeout(timer);
    }, [setIsTransitioning]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.email) newErrors.email = 'Email é obrigatório';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
        if (!formData.password) newErrors.password = 'Senha é obrigatória';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const result = await login(formData.email, formData.password);
        console.log('Login result:', result);

        if (result.success) {
            const redirectPath = result.redirect || '/checkout';
            console.log('Redirecting to:', redirectPath);

            setLoginPhase('animating');
            setTimeout(() => {
                setLoginPhase('redirect');
                setTimeout(() => {
                    router.push(redirectPath);
                }, 800);
            }, 1800);
        } else {
            addNotification({ type: 'error', title: 'Erro de acesso', message: result.error || 'Credenciais inválidas' });
        }
    };

    return (
        <div className={styles.page}>
            <AnimatePresence>
                {loginPhase === 'animating' || loginPhase === 'redirect' ? (
                    <motion.div
                        className={styles.fullScreenAnimation}
                        initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                        animate={{ clipPath: 'circle(150% at 50% 50%)' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
                    >
                        {/* Background glow */}
                        <div className={styles.glowOrb} />
                        <div className={styles.glowOrb2} />

                        {/* Logo container */}
                        <motion.div
                            className={styles.logoContainer}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
                        >
                            {/* Pulse ring */}
                            <motion.div
                                className={styles.pulseRing}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: [0.8, 1.5, 0.8], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />

                            {/* Logo */}
                            <motion.div
                                className={styles.logoAnimated}
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Image
                                    src="/images/logoparafundopreto.png"
                                    alt="MyWallet"
                                    width={280}
                                    height={100}
                                    style={{ objectFit: 'contain' }}
                                    priority
                                />
                            </motion.div>
                        </motion.div>

                        {/* Welcome text */}
                        <motion.h1
                            className={styles.welcomeText}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                        >
                            Bem-vindo de volta!
                        </motion.h1>

                        {/* Loading dots */}
                        <motion.div
                            className={styles.loadingDots}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            {[0, 1, 2].map((i) => (
                                <motion.span
                                    key={i}
                                    className={styles.dot}
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                                />
                            ))}
                        </motion.div>

                        {loginPhase === 'redirect' && (
                            <motion.div
                                className={styles.redirectOverlay}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6 }}
                            />
                        )}
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Left side - Dark Branding */}
            <motion.div
                className={styles.brandingSide}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className={styles.brandingContent}>
                    <Image
                        src="/images/logoparafundopreto.png"
                        alt="MyWallet"
                        width={280}
                        height={100}
                        className={styles.logo}
                        priority
                    />
                    <h1 className={styles.tagline}>
                        Sua carteira<br />em suas mãos
                    </h1>
                </div>
            </motion.div>

            {/* Right side - Form with Glass Effect */}
            <div className={styles.formSide}>
                <motion.div
                    className={styles.formContainer}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    {/* Mobile Logo - shown when left side is hidden */}
                    <div className={styles.mobileLogo}>
                        <Image
                            src="/images/logoparafundobranco.png"
                            alt="MyWallet"
                            width={120}
                            height={40}
                            className={styles.mobileLogoImage}
                            priority
                        />
                    </div>

                    <div className={styles.formHeader}>
                        <h2 className={styles.formTitle}>Entrar</h2>
                        <p className={styles.formSubtitle}>Acesse sua conta para continuar</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <Input
                            label="Email"
                            type="email"
                            name="email"
                            placeholder="seu@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            leftIcon={<FiMail />}
                            fullWidth
                            variant="light"
                        />

                        <div className={styles.passwordWrapper}>
                            <Input
                                label="Senha"
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                error={errors.password}
                                leftIcon={<FiLock />}
                                fullWidth
                                variant="light"
                            />
                            <Link href="/forgot-password" className={styles.forgotLink}>
                                Esqueceu a senha?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            loading={isLoading}
                            className={styles.submitBtn}
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </Button>
                    </form>

                    <div className={styles.footer}>
                        <p>Não tem uma conta? <Link href="/signup" className={styles.signupLink}>Criar agora</Link></p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
