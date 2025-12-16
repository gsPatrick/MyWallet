'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiArrowRight, FiCheck, FiArrowLeft, FiTarget, FiShield } from 'react-icons/fi';
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
        setFormData(prev => ({ ...prev, [name]: value }));
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
        if (!formData.password) newErrors.password = 'Senha é obrigatória';
        else if (formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Senhas não conferem';
        return newErrors;
    };

    const nextStep = () => {
        let stepErrors = {};
        if (step === 1) stepErrors = validateStep1();
        if (step === 2) stepErrors = validateStep2();

        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
        } else {
            setStep(prev => prev + 1);
        }
    };

    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.mainGoal) {
            setErrors({ mainGoal: 'Selecione um objetivo' });
            return;
        }

        const result = await register(formData.name, formData.email, formData.password);
        if (result.success) {
            setSignupPhase('animating');
            setTimeout(() => {
                setSignupPhase('redirect');
                setTimeout(() => {
                    addNotification({ type: 'success', title: 'Conta criada!', message: 'Bem-vindo ao MyWallet' });
                    router.push('/dashboard');
                }, 800);
            }, 1800);
        } else {
            addNotification({ type: 'error', title: 'Erro', message: result.error || 'Erro ao criar conta' });
        }
    };

    const steps = [
        { id: 1, title: 'Dados', icon: FiUser },
        { id: 2, title: 'Senha', icon: FiShield },
        { id: 3, title: 'Meta', icon: FiTarget },
    ];

    const goals = [
        { id: 'aposentadoria', label: 'Aposentadoria', emoji: '🏖️' },
        { id: 'reserva', label: 'Reserva de Emergência', emoji: '🛡️' },
        { id: 'patrimonio', label: 'Aumento de Patrimônio', emoji: '📈' },
        { id: 'renda', label: 'Renda Passiva', emoji: '💰' },
    ];

    return (
        <div className={styles.page}>
            <AnimatePresence>
                {(signupPhase === 'animating' || signupPhase === 'redirect') && (
                    <motion.div
                        className={styles.fullScreenAnimation}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            className={styles.animationContent}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                        >
                            <motion.div
                                className={styles.successCircle}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
                            >
                                <Image
                                    src="/images/logoparafundobranco.png"
                                    alt="MyWallet"
                                    width={80}
                                    height={40}
                                    className={styles.successLogo}
                                />
                            </motion.div>

                            <motion.h1
                                className={styles.welcomeText}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                            >
                                Conta criada!
                            </motion.h1>

                            <motion.p
                                className={styles.welcomeSubtext}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.1, duration: 0.5 }}
                            >
                                Preparando seu dashboard...
                            </motion.p>

                            <motion.div
                                className={styles.loadingBar}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.6, duration: 1.5, ease: "easeInOut" }}
                            />
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
                                <div className={`${styles.stepCircle} ${step >= s.id ? styles.stepActive : ''} ${step > s.id ? styles.stepCompleted : ''}`}>
                                    {step > s.id ? <FiCheck /> : s.id}
                                </div>
                                <span className={`${styles.stepLabel} ${step >= s.id ? styles.stepLabelActive : ''}`}>
                                    {s.title}
                                </span>
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
                                        error={errors.confirmPassword}
                                        leftIcon={<FiLock />}
                                        fullWidth
                                    />
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
                                        <h2 className={styles.stepTitle}>Seu objetivo</h2>
                                        <p className={styles.stepSubtitle}>Personalizamos sua experiência</p>
                                    </div>

                                    <div className={styles.goalsGrid}>
                                        {goals.map(goal => (
                                            <button
                                                key={goal.id}
                                                type="button"
                                                className={`${styles.goalCard} ${formData.mainGoal === goal.label ? styles.goalSelected : ''}`}
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, mainGoal: goal.label }));
                                                    setErrors(prev => ({ ...prev, mainGoal: '' }));
                                                }}
                                            >
                                                <span className={styles.goalEmoji}>{goal.emoji}</span>
                                                <span className={styles.goalLabel}>{goal.label}</span>
                                                {formData.mainGoal === goal.label && (
                                                    <div className={styles.goalCheck}>
                                                        <FiCheck />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.mainGoal && <span className={styles.errorText}>{errors.mainGoal}</span>}
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
