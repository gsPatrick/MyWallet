'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiArrowRight, FiCheck, FiArrowLeft, FiTarget, FiShield, FiDollarSign } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { usePageTransition } from '@/components/PageTransition';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

export default function SignupPage() {
    const router = useRouter();
    const { register, isLoading } = useAuth();
    const { addNotification } = useNotification();
    const { setIsTransitioning } = usePageTransition();

    const [step, setStep] = useState(1);
    const [signupPhase, setSignupPhase] = useState('form'); // 'form' | 'animating' | 'redirect'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        salary: '',
        salaryDay: '',
        mainGoal: '',
    });
    const [errors, setErrors] = useState({});

    // Entry animation - close the transition overlay
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsTransitioning(false);
        }, 100);
        return () => clearTimeout(timer);
    }, [setIsTransitioning]);


    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'salary') {
            // Real-time ATM Mask
            const digits = value.replace(/\D/g, '');
            const amount = parseInt(digits || '0') / 100;
            const formatted = amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            setFormData(prev => ({ ...prev, [name]: formatted }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Nome é obrigatório';
        if (!formData.email) newErrors.email = 'Email é obrigatório';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
        return newErrors;
    };

    const validateStep2 = () => {
        const newErrors = {};
        // Salary is optional, so mostly empty, but if we wanted to validate format...
        return newErrors;
    };

    const validateStep3 = () => {
        const newErrors = {};
        if (!formData.password) newErrors.password = 'Senha é obrigatória';
        else if (formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Senhas não conferem';
        return newErrors;
    };

    const nextStep = () => {
        let stepErrors = {};
        if (step === 1) stepErrors = validateStep1();
        if (step === 2) stepErrors = validateStep2();
        if (step === 3) stepErrors = validateStep3();

        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
        } else {
            setStep(prev => prev + 1);
        }
    };

    const prevStep = () => setStep(prev => prev - 1);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (step < 3) {
                nextStep();
            } else {
                handleSubmit(e);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();


        if (step < 3) {
            nextStep();
            return;
        }

        // Safety check: Don't try to register if password is not set (prevents premature submit bugs)
        if (!formData.password || formData.password.length < 6) {
            setErrors(prev => ({ ...prev, password: 'Senha é obrigatória' }));
            return;
        }


        const result = await register(
            formData.name,
            formData.email,
            formData.password,
            formData.salary ? parseFloat(formData.salary.replace(/\./g, '').replace(',', '.')) : null,
            formData.salaryDay ? parseInt(formData.salaryDay) : null
        );

        if (result.success) {
            setSignupPhase('animating');
            setTimeout(() => {
                setSignupPhase('redirect');
                setTimeout(() => {
                    addNotification({ type: 'success', title: 'Conta criada!', message: 'Bem-vindo ao MyWallet' });
                    // Use dynamic redirect from AuthContext (paywall logic)
                    router.push(result.redirect || '/checkout');
                }, 800);
            }, 1800);
        } else {
            addNotification({ type: 'error', title: 'Erro', message: result.error || 'Erro ao criar conta' });
        }
    };

    const steps = [
        { id: 1, title: 'Dados', icon: FiUser },
        { id: 2, title: 'Renda', icon: FiDollarSign },
        { id: 3, title: 'Senha', icon: FiShield },
    ];



    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
        <div className={styles.page}>
            <AnimatePresence>
                {(signupPhase === 'animating' || signupPhase === 'redirect') && (
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
                            Conta criada com sucesso!
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

                        {signupPhase === 'redirect' && (
                            <motion.div
                                className={styles.redirectOverlay}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6 }}
                            />
                        )}
                    </motion.div>
                )}
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
                    {/* Progress Steps */}
                    <div className={styles.stepsContainer}>
                        {steps.map((s, i) => (
                            <div key={s.id} className={styles.stepWrapper}>
                                <div className={styles.stepNode}>
                                    <div className={`${styles.stepCircle} ${step >= s.id ? styles.stepActive : ''} ${step > s.id ? styles.stepCompleted : ''}`}>
                                        {step > s.id ? <FiCheck /> : s.id}
                                    </div>
                                    <span className={`${styles.stepLabel} ${step >= s.id ? styles.stepLabelActive : ''}`}>
                                        {s.title}
                                    </span>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className={`${styles.stepLine} ${step > s.id ? styles.stepLineActive : ''}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className={styles.stepContent}
                                >
                                    <div className={styles.stepHeader}>
                                        <h2 className={styles.stepTitle}>Criar conta</h2>
                                        <p className={styles.stepSubtitle}>Informe seus dados</p>
                                    </div>

                                    <Input
                                        label="Nome completo"
                                        name="name"
                                        placeholder="Seu nome"
                                        value={formData.name}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDown}
                                        error={errors.name}
                                        leftIcon={<FiUser />}
                                        fullWidth
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        name="email"
                                        placeholder="seu@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDown}
                                        error={errors.email}
                                        leftIcon={<FiMail />}
                                        fullWidth
                                    />
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className={styles.stepContent}
                                >
                                    <div className={styles.stepHeader}>
                                        <h2 className={styles.stepTitle}>Renda Mensal</h2>
                                        <p className={styles.stepSubtitle}>Para projetarmos seu futuro</p>
                                    </div>

                                    <Input
                                        label="Salário Mensal (Opcional)"
                                        type="text"
                                        name="salary"
                                        placeholder="0,00"
                                        value={formData.salary}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDown}
                                        error={errors.salary}
                                        leftIcon={<FiDollarSign />}
                                        fullWidth
                                    />

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginLeft: '4px' }}>
                                            Dia do Recebimento
                                        </label>
                                        <div className={styles.dayGrid}>
                                            {days.map(d => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, salaryDay: d }))}
                                                    className={`${styles.dayButton} ${formData.salaryDay === d ? styles.daySelected : ''}`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className={styles.stepContent}
                                >
                                    <div className={styles.stepHeader}>
                                        <h2 className={styles.stepTitle}>Crie sua senha</h2>
                                        <p className={styles.stepSubtitle}>Mínimo 6 caracteres</p>
                                    </div>

                                    <Input
                                        label="Senha"
                                        type="password"
                                        name="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDown}
                                        error={errors.password}
                                        leftIcon={<FiLock />}
                                        fullWidth
                                    />
                                    <Input
                                        label="Confirmar senha"
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDown}
                                        error={errors.confirmPassword}
                                        leftIcon={<FiLock />}
                                        fullWidth
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className={styles.actions}>
                            {step > 1 ? (
                                <Button type="button" variant="secondary" onClick={prevStep} className={styles.backBtn}>
                                    <FiArrowLeft /> Voltar
                                </Button>
                            ) : (
                                <Link href="/login" className={styles.loginLink}>
                                    Já tenho conta
                                </Link>
                            )}

                            {step < 3 ? (
                                <Button type="button" onClick={nextStep} className={styles.nextBtn}>
                                    Próximo <FiArrowRight />
                                </Button>
                            ) : (
                                <Button type="submit" loading={isLoading} className={styles.nextBtn}>
                                    Criar Conta <FiCheck />
                                </Button>
                            )}
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
