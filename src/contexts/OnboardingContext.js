'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { useProfiles } from './ProfileContext';
import { useMedals } from './MedalContext';
import api from '@/services/api';
import TourOverlay from '@/components/Onboarding/TourOverlay';

const OnboardingContext = createContext({});

// localStorage keys
const TOUR_COMPLETED_KEY = 'mywallet_tour_completed';
const ONBOARDING_PHASE_KEY = 'mywallet_onboarding_phase';

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
    // --- DOCK Navigation ---
    {
        targetId: 'dock-transactions',
        title: 'Menu Transações',
        content: 'Clique aqui para acessar suas receitas e despesas detalhadas.',
        path: '/dashboard'
    },
    // --- TRANSACTIONS PAGE ---
    {
        targetId: 'summary-grid',
        title: 'Resumo de Transações',
        content: 'Veja suas receitas e despesas realizadas e previsões futuras.',
        path: '/transactions'
    },
    {
        targetId: 'filter-bar',
        title: 'Filtros',
        content: 'Filtre por data, status ou categoria para encontrar exatamente o que procura.',
        path: '/transactions'
    },
    // --- CARDS PAGE ---
    {
        targetId: null,
        title: 'Cartões e Assinaturas',
        content: 'Gerencie todos os seus cartões de crédito e assinaturas recorrentes em um só lugar.',
        path: '/cards'
    },
    // --- GOALS PAGE ---
    {
        targetId: null,
        title: 'Metas Financeiras',
        content: 'Defina e acompanhe seus objetivos financeiros de curto, médio e longo prazo.',
        path: '/goals'
    },
    // --- PLANNING PAGE (End) ---
    {
        targetId: null,
        title: 'Planejamento Financeiro',
        content: 'Defina limites de gastos e receba recomendações personalizadas para sua saúde financeira.',
        path: '/budget-allocation'
    }
];

export function OnboardingProvider({ children }) {
    const { user, isAuthenticated, refreshUser } = useAuth();
    const { hasProfiles, loading: profilesLoading } = useProfiles();
    const { triggerMedalCheck } = useMedals();
    const router = useRouter();
    const pathname = usePathname();

    // Onboarding phases: 'tour' -> 'profile_config' (via AppShell) -> 'complete'
    const [phase, setPhase] = useState('idle');
    const [showTour, setShowTour] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Helper to get saved phase from localStorage
    const getSavedPhase = useCallback(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(ONBOARDING_PHASE_KEY);
    }, []);

    // Helper to check if tour was completed before
    const wasTourCompleted = useCallback(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
    }, []);

    // Save phase to localStorage
    const savePhase = useCallback((newPhase) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(ONBOARDING_PHASE_KEY, newPhase);
        }
        setPhase(newPhase);
    }, []);

    // Mark tour as completed
    const markTourComplete = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
        }
    }, []);

    // Start Tour for new users (who don't have onboardingComplete)
    // Tour shows FIRST, then ProfileWizard via AppShell after tour ends
    // IMPORTANT: Only for users with ACTIVE subscription or OWNER
    useEffect(() => {
        if (profilesLoading) return;
        if (!isAuthenticated || !user) return;

        // PAYWALL CHECK: Don't start onboarding if no active subscription
        if (user.plan !== 'OWNER' && user.subscriptionStatus !== 'ACTIVE') {
            console.log('Onboarding: Skipping - user has no active subscription');
            return;
        }

        // OWNER users skip onboarding entirely
        if (user.plan === 'OWNER') {
            console.log('Onboarding: Skipping - user is OWNER (admin)');
            savePhase('complete');
            return;
        }

        // ✅ If onboarding is COMPLETE (backend says so), skip everything
        if (user.onboardingComplete) {
            console.log('Onboarding: Complete (from backend)');
            savePhase('complete');
            // Clear localStorage since onboarding is done
            if (typeof window !== 'undefined') {
                localStorage.removeItem(ONBOARDING_PHASE_KEY);
                localStorage.removeItem(TOUR_COMPLETED_KEY);
            }
            return;
        }

        // ✅ Check localStorage for saved phase
        const savedPhase = getSavedPhase();

        // If tour was already completed, go straight to profile_config
        if (wasTourCompleted() || savedPhase === 'profile_config') {
            console.log('Onboarding: Tour already completed, showing ProfileWizard');
            savePhase('profile_config');
            return;
        }

        // Onboarding not complete - show tour first
        console.log('Onboarding: Starting tour for user');
        const timer = setTimeout(() => {
            savePhase('tour');
            setShowTour(true);
        }, 500);
        return () => clearTimeout(timer);

    }, [isAuthenticated, user, hasProfiles, profilesLoading, getSavedPhase, wasTourCompleted, savePhase]);

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
            // Tour finished - mark as complete and show ProfileWizard
            setShowTour(false);
            markTourComplete();
            savePhase('profile_config');
            router.push('/dashboard');
        }
    };

    const handleSkip = async () => {
        // Skip tour - mark as complete and show ProfileWizard
        setShowTour(false);
        markTourComplete();
        savePhase('profile_config');
        router.push('/dashboard');
    };

    const startOnboarding = useCallback(() => {
        // Clear saved state and restart
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOUR_COMPLETED_KEY);
            localStorage.removeItem(ONBOARDING_PHASE_KEY);
        }
        setCurrentStepIndex(0);
        savePhase('tour');
        setShowTour(true);
    }, [savePhase]);

    const currentStep = TOUR_STEPS[currentStepIndex];

    // Global Scroll Lock during Tour
    useEffect(() => {
        if (showTour) {
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
    }, [showTour]);

    // Only render overlay if we are on the correct path
    const canRenderStep = showTour && phase === 'tour' && currentStep && pathname === currentStep.path;

    return (
        <OnboardingContext.Provider value={{
            startOnboarding,
            isOnboardingComplete: user?.onboardingComplete ?? false,
            phase
        }}>
            {children}

            {/* Tour Overlay - Shows FIRST for new users */}
            {canRenderStep && (
                <TourOverlay
                    step={currentStep}
                    currentStep={currentStepIndex}
                    totalSteps={TOUR_STEPS.length}
                    onNext={handleNext}
                    onSkip={handleSkip}
                />
            )}
        </OnboardingContext.Provider>
    );
}

export const useOnboarding = () => useContext(OnboardingContext);
