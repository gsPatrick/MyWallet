import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDollarSign, FiTarget, FiCheckCircle, FiArrowRight, FiArrowLeft, FiTrendingUp } from 'react-icons/fi';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from '../../app/budget-allocation/page.module.css';

// Preset allocations
const PRESETS = {
    investor: [
        { id: 1, name: 'Gastos Essenciais', percent: 50, color: '#ef4444', icon: 'home' },
        { id: 2, name: 'Gastos Pessoais', percent: 30, color: '#f59e0b', icon: 'shopping' },
        { id: 3, name: 'Investimentos', percent: 20, color: '#22c55e', icon: 'trending' },
    ],
    saver: [
        { id: 1, name: 'Gastos Essenciais', percent: 60, color: '#ef4444', icon: 'home' },
        { id: 2, name: 'Gastos Pessoais', percent: 20, color: '#f59e0b', icon: 'shopping' },
        { id: 3, name: 'Reserva/Dívidas', percent: 20, color: '#3b82f6', icon: 'shield' },
    ],
    balanced: [
        { id: 1, name: 'Gastos Essenciais', percent: 50, color: '#ef4444', icon: 'home' },
        { id: 2, name: 'Gastos Pessoais', percent: 20, color: '#f59e0b', icon: 'shopping' },
        { id: 3, name: 'Investimentos', percent: 15, color: '#22c55e', icon: 'trending' },
        { id: 4, name: 'Lazer', percent: 15, color: '#8b5cf6', icon: 'heart' },
    ]
};

export default function OnboardingQuiz({ isOpen, onClose, onFinish }) {
    const [step, setStep] = useState(1);
    const [income, setIncome] = useState(0);
    const [profile, setProfile] = useState(null);

    const handleNext = () => {
        if (step === 2 && !income) return;
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const handleFinish = () => {
        onFinish({ income, allocations: PRESETS[profile] || PRESETS.investor });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configuração Inicial" size="md">
            <div style={{ padding: '20px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                <AnimatePresence mode='wait'>
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <FiTarget size={48} color="var(--accent-primary)" style={{ marginBottom: '20px' }} />
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>Bem-vindo ao Planejamento!</h3>
                            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
                                Vamos configurar seu orçamento inicial em poucos passos para que você tenha controle total das suas finanças.
                            </p>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            style={{ flex: 1 }}
                        >
                            <h3 style={{ marginBottom: '20px' }}>Qual sua renda mensal média?</h3>
                            <p style={{ color: 'var(--text-tertiary)', marginBottom: '20px' }}>
                                Isso nos ajuda a calcular os valores exatos para cada categoria.
                            </p>
                            <Input
                                label="Renda Líquida (R$)"
                                type="number"
                                value={income}
                                onChange={(e) => setIncome(Number(e.target.value))}
                                leftIcon={<FiDollarSign />}
                                fullWidth
                                autoFocus
                            />
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            style={{ flex: 1 }}
                        >
                            <h3 style={{ marginBottom: '20px' }}>Qual seu foco principal agora?</h3>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                <button
                                    onClick={() => setProfile('investor')}
                                    style={{
                                        padding: '16px', borderRadius: '12px', background: profile === 'investor' ? 'var(--accent-primary-light)' : 'var(--bg-secondary)',
                                        border: profile === 'investor' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                                        textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center'
                                    }}
                                >
                                    <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', color: '#22c55e' }}>
                                        <FiTrendingUp />
                                    </div>
                                    <div>
                                        <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Investir agressivamente</strong>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Foco em construção de patrimônio (50/30/20)</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setProfile('saver')}
                                    style={{
                                        padding: '16px', borderRadius: '12px', background: profile === 'saver' ? 'var(--accent-primary-light)' : 'var(--bg-secondary)',
                                        border: profile === 'saver' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                                        textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center'
                                    }}
                                >
                                    <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: '#3b82f6' }}>
                                        <FiCheckCircle />
                                    </div>
                                    <div>
                                        <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Organizar e Quitar Dívidas</strong>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Foco em segurança e controle (60/20/20)</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setProfile('balanced')}
                                    style={{
                                        padding: '16px', borderRadius: '12px', background: profile === 'balanced' ? 'var(--accent-primary-light)' : 'var(--bg-secondary)',
                                        border: profile === 'balanced' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                                        textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center'
                                    }}
                                >
                                    <div style={{ padding: '10px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '8px', color: '#ec4899' }}>
                                        <FiTarget />
                                    </div>
                                    <div>
                                        <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Equilíbrio</strong>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Distribuir entre lazer e futuro</span>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
                    {step > 1 && (
                        <Button variant="secondary" onClick={handleBack} leftIcon={<FiArrowLeft />}>
                            Voltar
                        </Button>
                    )}
                    <div style={{ flex: 1 }} />
                    {step < 3 ? (
                        <Button onClick={handleNext} rightIcon={<FiArrowRight />}>
                            {step === 1 ? 'Começar' : 'Próximo'}
                        </Button>
                    ) : (
                        <Button onClick={handleFinish} disabled={!profile} rightIcon={<FiCheckCircle />}>
                            Concluir
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
