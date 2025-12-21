'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMail, FiArrowLeft, FiCheck } from 'react-icons/fi';
import ParticleBackground from '@/components/canvas/ParticleBackground';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Email é obrigatório');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Email inválido');
            return;
        }

        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
        setSent(true);
    };

    return (
        <div className={styles.container}>
            {/* Visual Side */}
            <motion.div
                className={styles.visualSide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                <ParticleBackground />
                <div className={styles.visualContent}>
                    <motion.h1
                        className={styles.visualTitle}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        Esqueceu sua<br />
                        <span className={styles.highlight}>senha?</span>
                    </motion.h1>
                    <motion.p
                        className={styles.visualDescription}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        Não se preocupe! Enviaremos um link para você redefinir sua senha.
                    </motion.p>
                </div>
            </motion.div>

            {/* Form Side */}
            <motion.div
                className={styles.formSide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className={styles.formContainer}>
                    <Link href="/login" className={styles.backLink}>
                        <FiArrowLeft />
                        Voltar para login
                    </Link>

                    <div className={styles.formHeader}>
                        <Link href="/" className={styles.logo}>
                            <span className={styles.logoText}>MyWallet</span>
                        </Link>
                        <h2 className={styles.formTitle}>Recuperar senha</h2>
                        <p className={styles.formSubtitle}>
                            Digite seu email e enviaremos um link para redefinir sua senha.
                        </p>
                    </div>

                    {!sent ? (
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input
                                label="Email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                error={error}
                                leftIcon={<FiMail />}
                                fullWidth
                            />

                            <Button
                                type="submit"
                                fullWidth
                                loading={isLoading}
                            >
                                Enviar link de recuperação
                            </Button>
                        </form>
                    ) : (
                        <motion.div
                            className={styles.successMessage}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className={styles.successIcon}>
                                <FiCheck />
                            </div>
                            <h3>Email enviado!</h3>
                            <p>
                                Enviamos um link para <strong>{email}</strong>.
                                Verifique sua caixa de entrada e spam.
                            </p>
                            <Button variant="secondary" onClick={() => setSent(false)}>
                                Enviar novamente
                            </Button>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
