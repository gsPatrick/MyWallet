'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiArrowLeft, FiCheckCircle, FiShield } from 'react-icons/fi';
import { authAPI } from '@/services/api';
import { useNotification } from '@/contexts/NotificationContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from '../login/page.module.css'; // Reuse login styles

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { addNotification } = useNotification();
    
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!email) return;
        
        setIsLoading(true);
        try {
            await authAPI.forgotPassword(email);
            addNotification({
                type: 'success',
                title: 'Código enviado',
                message: 'Verifique seu email para obter o código de recuperação.'
            });
            setStep(2);
        } catch (err) {
            addNotification({
                type: 'error',
                title: 'Erro',
                message: err.message || 'Erro ao enviar código.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!otp) return;
        
        setIsLoading(true);
        try {
            await authAPI.verifyOTP(email, otp);
            setStep(3);
        } catch (err) {
            addNotification({
                type: 'error',
                title: 'Código inválido',
                message: 'O código informado é inválido ou expirou.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            addNotification({ type: 'error', title: 'Senhas diferentes', message: 'As senhas informadas não coincidem.' });
            return;
        }
        
        setIsLoading(true);
        try {
            await authAPI.resetPassword(email, otp, newPassword);
            addNotification({
                type: 'success',
                title: 'Senha redefinida',
                message: 'Sua senha foi alterada com sucesso! Você já pode entrar.'
            });
            router.push('/login');
        } catch (err) {
            addNotification({
                type: 'error',
                title: 'Erro',
                message: err.message || 'Erro ao redefinir senha.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.page}>
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
                        Recupere seu<br />acesso com segurança
                    </h1>
                </div>
            </motion.div>

            {/* Right side - Form */}
            <div className={styles.formSide}>
                <motion.div
                    className={styles.formContainer}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className={styles.formHeader}>
                        <h2 className={styles.formTitle}>
                            {step === 1 ? 'Esqueceu a senha?' : step === 2 ? 'Verificar código' : 'Nova senha'}
                        </h2>
                        <p className={styles.formSubtitle}>
                            {step === 1 
                                ? 'Informe seu email para receber o código de recuperação' 
                                : step === 2 
                                    ? `Enviamos um código de 6 dígitos para ${email}`
                                    : 'Crie uma nova senha forte para sua conta'}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.form 
                                key="step1"
                                onSubmit={handleSendOTP} 
                                className={styles.form}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    leftIcon={<FiMail />}
                                    fullWidth
                                    variant="light"
                                    required
                                />

                                <Button
                                    type="submit"
                                    fullWidth
                                    loading={isLoading}
                                    className={styles.submitBtn}
                                >
                                    Enviar Código <FiArrowRight />
                                </Button>
                                
                                <Link href="/login" className={styles.signupLink} style={{ textAlign: 'center', marginTop: '1rem', display: 'block' }}>
                                    <FiArrowLeft /> Voltar para o login
                                </Link>
                            </motion.form>
                        )}

                        {step === 2 && (
                            <motion.form 
                                key="step2"
                                onSubmit={handleVerifyOTP} 
                                className={styles.form}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Input
                                    label="Código de 6 dígitos"
                                    type="text"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    leftIcon={<FiShield />}
                                    fullWidth
                                    variant="light"
                                    required
                                />

                                <Button
                                    type="submit"
                                    fullWidth
                                    loading={isLoading}
                                    className={styles.submitBtn}
                                >
                                    Verificar Código <FiArrowRight />
                                </Button>
                                
                                <button 
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className={styles.signupLink}
                                    style={{ textAlign: 'center', marginTop: '1rem', display: 'block', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                                >
                                    <FiArrowLeft /> Usar outro email
                                </button>
                            </motion.form>
                        )}

                        {step === 3 && (
                            <motion.form 
                                key="step3"
                                onSubmit={handleResetPassword} 
                                className={styles.form}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Input
                                    label="Nova Senha"
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    leftIcon={<FiLock />}
                                    fullWidth
                                    variant="light"
                                    required
                                />
                                
                                <Input
                                    label="Confirmar Nova Senha"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    leftIcon={<FiCheckCircle />}
                                    fullWidth
                                    variant="light"
                                    required
                                />

                                <Button
                                    type="submit"
                                    fullWidth
                                    loading={isLoading}
                                    className={styles.submitBtn}
                                >
                                    Redefinir Senha <FiArrowRight />
                                </Button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className={styles.footer}>
                        <p>Segurança garantida pelo MyWallet SSL 🔒</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
