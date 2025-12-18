'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiArrowRight, FiArrowLeft, FiCheck, FiHome, FiPlus,
    FiDollarSign, FiTarget, FiAward, FiPieChart, FiCreditCard
} from 'react-icons/fi';
import styles from './Onboarding.module.css';

const ONBOARDING_STEPS = [
    {
        id: 'welcome',
        title: 'Bem-vindo ao MyWallet! 🎉',
        description: 'Vamos te guiar por todas as funcionalidades do app em poucos passos.',
        icon: FiHome,
        image: null,
        tip: 'Dica: Este tutorial dura apenas 2 minutos!'
    },
    {
        id: 'dashboard',
        title: 'Dashboard é Visualização',
        description: 'O Dashboard mostra um resumo das suas finanças. Os números são apenas para visualização - para adicionar transações, use o botão +.',
        icon: FiPieChart,
        image: null,
        tip: '💡 Os cards mostram: Receitas, Despesas, Saldo e Investimentos.'
    },
    {
        id: 'transactions',
        title: 'Adicionar Transações',
        description: 'Use o botão "+" no Dock (barra inferior) para adicionar receitas e despesas. Você pode agendar transações futuras!',
        icon: FiPlus,
        image: null,
        tip: '💰 Transações agendadas aparecem na seção "Previsões" do Dashboard.'
    },
    {
        id: 'salary',
        title: 'Seu Salário',
        description: 'Configure seu salário e o dia de recebimento. O sistema criará automaticamente uma receita mensal e te notificará quando estiver perto!',
        icon: FiDollarSign,
        image: null,
        tip: '📅 Você será notificado: 5 dias antes, 1 dia antes e no dia.'
    },
    {
        id: 'cards',
        title: 'Cartões de Crédito',
        description: 'Cadastre seus cartões e registre compras parceladas. O sistema calcula automaticamente as faturas futuras.',
        icon: FiCreditCard,
        image: null,
        tip: '🔔 Notificações de vencimento de fatura também são enviadas!'
    },
    {
        id: 'goals',
        title: 'Metas Financeiras',
        description: 'Defina objetivos como "Reserva de Emergência" ou "Viagem". Acompanhe seu progresso visualmente.',
        icon: FiTarget,
        image: null,
        tip: '🎯 Conquiste medalhas ao alcançar suas metas!'
    },
    {
        id: 'medals',
        title: 'Gamificação & Medalhas',
        description: 'Ao usar o app, você ganha XP e sobe de nível! Complete desafios e colecione medalhas exclusivas.',
        icon: FiAward,
        image: null,
        tip: '🏆 Após este tutorial, você receberá sua primeira medalha!'
    }
];

export default function Onboarding({ onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(1);

    const step = ONBOARDING_STEPS[currentStep];
    const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    const handleNext = () => {
        if (isLastStep) {
            onComplete?.();
        } else {
            setDirection(1);
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirstStep) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        onComplete?.();
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0
        })
    };

    const StepIcon = step.icon;

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                {/* Progress dots */}
                <div className={styles.progress}>
                    {ONBOARDING_STEPS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`${styles.dot} ${idx === currentStep ? styles.active : ''} ${idx < currentStep ? styles.completed : ''}`}
                        />
                    ))}
                </div>

                {/* Skip button */}
                <button className={styles.skipBtn} onClick={handleSkip}>
                    Pular tutorial
                </button>

                {/* Content */}
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={step.id}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className={styles.content}
                    >
                        <div className={styles.iconWrapper}>
                            <StepIcon />
                        </div>

                        <h2 className={styles.title}>{step.title}</h2>
                        <p className={styles.description}>{step.description}</p>

                        {step.tip && (
                            <div className={styles.tip}>
                                {step.tip}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className={styles.navigation}>
                    <button
                        className={`${styles.navBtn} ${styles.prevBtn}`}
                        onClick={handlePrev}
                        disabled={isFirstStep}
                    >
                        <FiArrowLeft /> Anterior
                    </button>

                    <span className={styles.stepCounter}>
                        {currentStep + 1} / {ONBOARDING_STEPS.length}
                    </span>

                    <button
                        className={`${styles.navBtn} ${styles.nextBtn} ${isLastStep ? styles.complete : ''}`}
                        onClick={handleNext}
                    >
                        {isLastStep ? (
                            <>Começar <FiCheck /></>
                        ) : (
                            <>Próximo <FiArrowRight /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
