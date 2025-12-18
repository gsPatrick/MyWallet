'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { useMedals } from './MedalContext';
import api from '@/services/api';
import TourOverlay from '@/components/Onboarding/TourOverlay';
import OnboardingConfig from '@/components/Onboarding/OnboardingConfig';

const OnboardingContext = createContext({});

const TOUR_STEPS = [
    // --- DASHBOARD ---
    {
        targetId: 'tab-geral',
        title: 'Visão Geral',
        content: 'Aqui você tem um resumo completo da sua vida financeira, incluindo receitas, despesas e previsões.',
        path: '/dashboard'
    },
    {
        targetId: 'hero-balance',
        title: 'Seu Patrimônio',
        content: 'Acompanhe a evolução do seu patrimônio total, somando contas bancárias e investimentos.',
        path: '/dashboard'
    },
    {
        targetId: 'tab-manual',
        title: 'Controle Manual',
        content: 'Gerencie suas transações manuais e veja o fluxo de caixa separado do Open Finance.',
        path: '/dashboard'
    },
    // --- DOCK Navigation Mock ---
    {
        targetId: 'dock-transactions',
        title: 'Menu Transações',
        content: 'Clique aqui para acessar suas receitas e despesas detalhadas.',
        path: '/dashboard' // Pointing to dock while on dashboard
    },
    // --- TRANSACTIONS PAGE ---
    {
        targetId: 'summary-grid', // Needs to exist in Transactions Page
        title: 'Resumo de Transações',
        content: 'Veja suas receitas e despesas realizadas e previsões futuras.',
        path: '/transactions'
    },
    {
        targetId: 'filter-bar', // Needs to exist or be added
        title: 'Filtros',
        content: 'Filtre por data, status ou categoria para encontrar exatamente o que procura.',
        path: '/transactions'
    },
    // --- CARDS PAGE ---
    {
        targetId: null, // Fixed position
        title: 'Cartões e Assinaturas',
        content: 'Gerencie todos os seus cartões de crédito e assinaturas recorrentes em um só lugar.',
        path: '/cards'
    },
    // --- GOALS PAGE ---
    {
        targetId: null, // Fixed position
        title: 'Metas Financeiras',
        content: 'Defina e acompanhe seus objetivos financeiros de curto, médio e longo prazo.',
        path: '/goals'
    },
    // --- PLANNING PAGE (End) ---
    {
        targetId: null, // Fixed position
        title: 'Planejamento Financeiro',
        content: 'Defina limites de gastos e receba recomendações personalizadas para sua saúde financeira.',
        path: '/budget-allocation'
    }
];

export function OnboardingProvider({ children }) {
    const { user, isAuthenticated, refreshUser } = useAuth();
    const { triggerMedalCheck } = useMedals();
    const router = useRouter();
    const pathname = usePathname();

    // Onboarding phases: 'tour' -> 'config' -> 'complete'
    const [phase, setPhase] = useState('tour');
    const [showTour, setShowTour] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Initial Check
    useEffect(() => {
        if (isAuthenticated && user && !user.onboardingComplete) {
            // Small delay to ensure everything is loaded
            const timer = setTimeout(() => {
                setPhase('tour');
                setShowTour(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, user]);

    // Navigation Effect: Ensure we are on the right page for the step
    useEffect(() => {
        if (!showTour || phase !== 'tour') return;

        const step = TOUR_STEPS[currentStepIndex];
        if (step && step.path && pathname !== step.path) {
            router.push(step.path);
        }
    }, [currentStepIndex, showTour, pathname, router, phase]);

    const handleNext = async () => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            // Tour finished, go to config phase
            setShowTour(false);
            setPhase('config');
            setShowConfig(true);
            router.push('/dashboard');
        }
    };

    const handleSkip = async () => {
        // Skip tour, go directly to config
        setShowTour(false);
        setPhase('config');
        setShowConfig(true);
        router.push('/dashboard');
    };

    const handleConfigComplete = async () => {
        try {
            await api.put('/auth/onboarding-complete');
            if (refreshUser) await refreshUser();
            setShowConfig(false);
            setPhase('complete');

            // Trigger medal check
            setTimeout(() => {
                triggerMedalCheck?.();
            }, 1000);
        } catch (error) {
            console.error('Error completing onboarding:', error);
            setShowConfig(false);
            setPhase('complete');
        }
    };

    const startOnboarding = useCallback(() => {
        setCurrentStepIndex(0);
        setPhase('tour');
        setShowTour(true);
    }, []);

    const currentStep = TOUR_STEPS[currentStepIndex];

    // Global Scroll Lock during Tour or Config
    useEffect(() => {
        if (showTour || showConfig) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [showTour, showConfig]);

    // Only render overlay if we are on the correct path (to avoid flashing before nav)
    const canRenderStep = showTour && phase === 'tour' && currentStep && pathname === currentStep.path;

    return (
        <OnboardingContext.Provider value={{
            startOnboarding,
            isOnboardingComplete: user?.onboardingComplete ?? false
        }}>
            {children}

            {/* Tour Overlay */}
            {canRenderStep && (
                <TourOverlay
                    step={currentStep}
                    currentStep={currentStepIndex}
                    totalSteps={TOUR_STEPS.length}
                    onNext={handleNext}
                    onSkip={handleSkip}
                />
            )}

            {/* Configuration Phase */}
            {showConfig && phase === 'config' && (
                <OnboardingConfig onComplete={handleConfigComplete} />
            )}
        </OnboardingContext.Provider>
    );
}

export const useOnboarding = () => useContext(OnboardingContext);
