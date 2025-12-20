'use client';

/**
 * ProfileWizard
 * ========================================
 * MULTI-PROFILE SETUP WIZARD
 * With DAS, Cards, and Subscriptions configuration
 * ========================================
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiArrowRight, FiArrowLeft, FiCheck, FiCheckCircle,
    FiUser, FiBriefcase, FiLayers, FiDollarSign, FiCalendar,
    FiFileText, FiCreditCard, FiRepeat, FiPlus, FiEdit2, FiTrash2,
    FiTool, FiHome
} from 'react-icons/fi';
import { profilesAPI, cardsAPI, subscriptionsAPI } from '@/services/api';
import { useProfiles } from '@/contexts/ProfileContext';
import CardModal from '@/components/modals/CardModal';
import SubscriptionModal from '@/components/modals/SubscriptionModal';
import styles from './ProfileWizard.module.css';

const PROFILE_TYPES = [
    {
        id: 'PERSONAL',
        label: 'Uso Pessoal',
        description: 'Para controlar seus gastos do dia a dia, casa e lazer.',
        icon: FiUser,
        color: '#3b82f6'
    },
    {
        id: 'BUSINESS',
        label: 'Uso Empresarial',
        description: 'Para gerenciar o caixa da sua empresa (MEI/ME) separadamente.',
        icon: FiBriefcase,
        color: '#10b981'
    },
    {
        id: 'HYBRID',
        label: 'Pessoal + Empresarial',
        description: 'A experiência completa. Gerencie CPF e CNPJ no mesmo lugar.',
        icon: FiLayers,
        color: '#8b5cf6',
        recommended: true
    }
];

const BUSINESS_SUBTYPES = [
    {
        id: 'MEI',
        label: 'MEI',
        icon: FiTool,
        description: 'Microempreendedor Individual',
        hasProLabore: false,
        hasDAS: true
    },
    {
        id: 'ME',
        label: 'ME',
        icon: FiHome,
        description: 'Microempresa',
        hasProLabore: true,
        hasDAS: true
    }
];

// Currency mask helper
const applyCurrencyMask = (value) => {
    let digits = value.replace(/\D/g, '');
    digits = digits.replace(/^0+/, '') || '0';
    digits = digits.padStart(3, '0');
    const cents = digits.slice(-2);
    let reais = digits.slice(0, -2);
    reais = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${reais},${cents}`;
};

const parseCurrencyValue = (maskedValue) => {
    if (!maskedValue) return 0;
    const normalized = maskedValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
};

// CNPJ mask: 00.000.000/0000-00
const applyCnpjMask = (value) => {
    let digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length > 12) {
        return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
    } else if (digits.length > 8) {
        return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d*)/, '$1.$2.$3/$4');
    } else if (digits.length > 5) {
        return digits.replace(/^(\d{2})(\d{3})(\d*)/, '$1.$2.$3');
    } else if (digits.length > 2) {
        return digits.replace(/^(\d{2})(\d*)/, '$1.$2');
    }
    return digits;
};

// CPF mask: 000.000.000-00
const applyCpfMask = (value) => {
    let digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length > 9) {
        return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
    } else if (digits.length > 6) {
        return digits.replace(/^(\d{3})(\d{3})(\d*)/, '$1.$2.$3');
    } else if (digits.length > 3) {
        return digits.replace(/^(\d{3})(\d*)/, '$1.$2');
    }
    return digits;
};

export default function ProfileWizard({ onComplete }) {
    const { refreshProfiles } = useProfiles();
    const [step, setStep] = useState('type');
    const [loading, setLoading] = useState(false);

    // Form states - Personal
    const [profileType, setProfileType] = useState(null);
    const [personalName, setPersonalName] = useState('Minha Casa');
    const [salary, setSalary] = useState('');
    const [salaryDay, setSalaryDay] = useState('5');
    const [initialBalance, setInitialBalance] = useState('');

    // Form states - Business
    const [businessName, setBusinessName] = useState('');
    const [businessSubtype, setBusinessSubtype] = useState('MEI');
    const [businessCnpj, setBusinessCnpj] = useState('');
    const [businessCpf, setBusinessCpf] = useState('');
    const [defaultProfile, setDefaultProfile] = useState('PERSONAL');

    // DAS
    const [dasValue, setDasValue] = useState('');
    const [dasDueDay, setDasDueDay] = useState('20');

    // Pró-labore (only for ME)
    const [proLabore, setProLabore] = useState('');
    const [proLaboreDay, setProLaboreDay] = useState('5');

    // Business initial balance
    const [businessBalance, setBusinessBalance] = useState('');

    // Cards & Subscriptions - Personal
    const [personalCards, setPersonalCards] = useState([]);
    const [personalSubs, setPersonalSubs] = useState([]);

    // Cards & Subscriptions - Business
    const [businessCards, setBusinessCards] = useState([]);
    const [businessSubs, setBusinessSubs] = useState([]);

    // Modal states
    const [showCardModal, setShowCardModal] = useState(false);
    const [showSubModal, setShowSubModal] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [editingSub, setEditingSub] = useState(null);
    const [currentProfileContext, setCurrentProfileContext] = useState('personal'); // 'personal' or 'business'

    const handleCurrencyChange = (value, setter) => {
        const masked = applyCurrencyMask(value);
        setter(masked);
    };

    const formatCurrency = (value) => {
        const numValue = typeof value === 'string' ? parseCurrencyValue(value) : value;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue || 0);
    };

    const getCurrentSubtype = () => {
        return BUSINESS_SUBTYPES.find(s => s.id === businessSubtype) || BUSINESS_SUBTYPES[0];
    };

    // Card Modal handlers
    const openCardModal = (profileContext, card = null, index = null) => {
        setCurrentProfileContext(profileContext);
        setEditingCard(card ? { ...card, _index: index } : null);
        setShowCardModal(true);
    };

    const handleSaveCard = (cardData) => {
        const cards = currentProfileContext === 'personal' ? personalCards : businessCards;
        const setCards = currentProfileContext === 'personal' ? setPersonalCards : setBusinessCards;

        if (editingCard?._index !== undefined) {
            const updated = [...cards];
            updated[editingCard._index] = cardData;
            setCards(updated);
        } else {
            setCards([...cards, cardData]);
        }
        setShowCardModal(false);
        setEditingCard(null);
    };

    const removeCard = (profileContext, idx) => {
        if (profileContext === 'personal') {
            setPersonalCards(personalCards.filter((_, i) => i !== idx));
        } else {
            setBusinessCards(businessCards.filter((_, i) => i !== idx));
        }
    };

    // Subscription Modal handlers
    const openSubModal = (profileContext, sub = null, index = null) => {
        setCurrentProfileContext(profileContext);
        setEditingSub(sub ? { ...sub, _index: index } : null);
        setShowSubModal(true);
    };

    const handleSaveSub = (subData) => {
        const subs = currentProfileContext === 'personal' ? personalSubs : businessSubs;
        const setSubs = currentProfileContext === 'personal' ? setPersonalSubs : setBusinessSubs;

        if (editingSub?._index !== undefined) {
            const updated = [...subs];
            updated[editingSub._index] = subData;
            setSubs(updated);
        } else {
            setSubs([...subs, subData]);
        }
        setShowSubModal(false);
        setEditingSub(null);
    };

    const removeSub = (profileContext, idx) => {
        if (profileContext === 'personal') {
            setPersonalSubs(personalSubs.filter((_, i) => i !== idx));
        } else {
            setBusinessSubs(businessSubs.filter((_, i) => i !== idx));
        }
    };

    const canProceed = () => {
        switch (step) {
            case 'type':
                return profileType !== null;
            case 'config':
                if (profileType === 'PERSONAL') return personalName.trim() !== '';
                if (profileType === 'BUSINESS') return businessName.trim() !== '';
                if (profileType === 'HYBRID') return personalName.trim() !== '' && businessName.trim() !== '';
                return false;
            case 'default':
                return defaultProfile !== null;
            default:
                return true;
        }
    };

    const handleNext = async () => {
        if (step === 'type') {
            setStep('config');
        } else if (step === 'config') {
            if (profileType === 'HYBRID') {
                setStep('default');
            } else if (profileType === 'BUSINESS') {
                setStep('financial_business');
            } else {
                setStep('financial_personal');
            }
        } else if (step === 'default') {
            setStep('financial_personal');
        } else if (step === 'financial_personal') {
            setStep('cards_personal');
        } else if (step === 'cards_personal') {
            setStep('subs_personal');
        } else if (step === 'subs_personal') {
            if (profileType === 'HYBRID') {
                setStep('financial_business');
            } else {
                await submitWizard();
            }
        } else if (step === 'financial_business') {
            setStep('cards_business');
        } else if (step === 'cards_business') {
            setStep('subs_business');
        } else if (step === 'subs_business') {
            await submitWizard();
        } else {
            onComplete?.();
        }
    };

    const submitWizard = async () => {
        setLoading(true);
        try {
            // ========================================
            // 🔍 DEBUG: Log all state values
            // ========================================
            console.log('═══════════════════════════════════════════════════');
            console.log('🚀 [WIZARD] SUBMIT STARTED');
            console.log('═══════════════════════════════════════════════════');
            console.log('📋 [WIZARD] Profile Type:', profileType);
            console.log('📋 [WIZARD] Default Profile:', defaultProfile);
            console.log('───────────────────────────────────────────────────');
            console.log('👤 [WIZARD] PERSONAL DATA:');
            console.log('   - personalName:', personalName);
            console.log('   - salary (raw):', salary);
            console.log('   - salary (parsed):', parseCurrencyValue(salary));
            console.log('   - salaryDay:', salaryDay);
            console.log('   - initialBalance (raw):', initialBalance);
            console.log('   - initialBalance (parsed):', parseCurrencyValue(initialBalance));
            console.log('   - personalCards:', personalCards.length, 'cards');
            console.log('   - personalSubs:', personalSubs.length, 'subscriptions');
            console.log('───────────────────────────────────────────────────');
            console.log('💼 [WIZARD] BUSINESS DATA:');
            console.log('   - businessName:', businessName);
            console.log('   - businessSubtype:', businessSubtype);
            console.log('   - businessCnpj:', businessCnpj);
            console.log('   - dasValue (raw):', dasValue);
            console.log('   - dasValue (parsed):', parseCurrencyValue(dasValue));
            console.log('   - dasDueDay:', dasDueDay);
            console.log('   - proLabore (raw):', proLabore);
            console.log('   - proLabore (parsed):', parseCurrencyValue(proLabore));
            console.log('   - proLaboreDay:', proLaboreDay);
            console.log('   - businessBalance (raw):', businessBalance);
            console.log('   - businessBalance (parsed):', parseCurrencyValue(businessBalance));
            console.log('   - businessCards:', businessCards.length, 'cards');
            console.log('   - businessSubs:', businessSubs.length, 'subscriptions');
            console.log('═══════════════════════════════════════════════════');

            // 1. Create profiles
            const setupData = {
                profileType,
                profiles: {
                    personal: {
                        name: personalName,
                        salary: parseCurrencyValue(salary),
                        salaryDay: parseInt(salaryDay) || 5,
                        initialBalance: parseCurrencyValue(initialBalance)
                    },
                    business: {
                        name: businessName,
                        subtype: businessSubtype,
                        cnpj: businessCnpj || null,
                        dasValue: parseCurrencyValue(dasValue),
                        dasDueDay: parseInt(dasDueDay) || 20,
                        proLabore: getCurrentSubtype().hasProLabore ? parseCurrencyValue(proLabore) : 0,
                        proLaboreDay: parseInt(proLaboreDay) || 5,
                        initialBalance: parseCurrencyValue(businessBalance)
                    }
                },
                defaultProfileType: defaultProfile
            };

            console.log('📝 [WIZARD] SETUP DATA TO SEND:', JSON.stringify(setupData, null, 2));

            const profileResult = await profilesAPI.setup(setupData);
            console.log('✅ [WIZARD] API RESPONSE:', JSON.stringify(profileResult, null, 2));

            // 2. Get created profiles to have their IDs
            const createdProfiles = profileResult?.profiles || [];

            // Find personal and business profile IDs
            const personalProfileId = createdProfiles.find(p => p.type === 'PERSONAL')?.id;
            const businessProfileId = createdProfiles.find(p => p.type === 'BUSINESS')?.id;

            // Set the default profile in localStorage
            const defaultProfileId = defaultProfile === 'BUSINESS' ? businessProfileId : personalProfileId;
            if (defaultProfileId && typeof window !== 'undefined') {
                localStorage.setItem('investpro_profile_id', defaultProfileId);
                console.log('💾 [WIZARD] Set default profileId:', defaultProfileId);
            }

            // Maps to track old card references -> new card IDs
            const personalCardIdMap = new Map(); // oldRef -> newId
            const businessCardIdMap = new Map();

            // 3. Create cards for personal profile and track IDs
            if (personalCards.length > 0 && personalProfileId) {
                localStorage.setItem('investpro_profile_id', personalProfileId);
                for (let i = 0; i < personalCards.length; i++) {
                    const card = personalCards[i];
                    try {
                        const result = await cardsAPI.create(card);
                        const createdCard = result?.card || result;
                        if (createdCard?.id) {
                            // Map by index and by name pattern
                            const oldRef = `${card.name} •••• ${card.lastFourDigits}`;
                            personalCardIdMap.set(oldRef, createdCard.id);
                            personalCardIdMap.set(i.toString(), createdCard.id);
                        }
                        console.log('💳 [WIZARD] Created personal card:', card.name, '-> ID:', createdCard?.id);
                    } catch (e) {
                        console.error('Error creating personal card:', e);
                    }
                }
            }

            // 4. Create subscriptions for personal profile
            if (personalSubs.length > 0 && personalProfileId) {
                localStorage.setItem('investpro_profile_id', personalProfileId);
                for (const sub of personalSubs) {
                    try {
                        // Map cardId to real UUID if exists
                        let realCardId = null;
                        if (sub.cardId) {
                            // Try to find in map (might be display text like "Nubank •••• 1234")
                            realCardId = personalCardIdMap.get(sub.cardId) || null;
                            console.log('🔗 [WIZARD] Mapping cardId:', sub.cardId, '-> realCardId:', realCardId);
                        }

                        const subPayload = {
                            name: sub.name,
                            amount: parseFloat(sub.amount) || 0,
                            category: sub.category,
                            frequency: sub.frequency || 'MONTHLY',
                            startDate: sub.startDate || sub.nextBillingDate || new Date().toISOString().split('T')[0],
                            icon: sub.icon || '',
                            color: sub.color || '#6366F1',
                            cardId: realCardId
                        };

                        await subscriptionsAPI.create(subPayload);
                        console.log('📦 [WIZARD] Created personal subscription:', sub.name);
                    } catch (e) {
                        console.error('Error creating personal subscription:', e);
                    }
                }
            }

            // 5. Create cards for business profile and track IDs
            if (businessCards.length > 0 && businessProfileId) {
                localStorage.setItem('investpro_profile_id', businessProfileId);
                for (let i = 0; i < businessCards.length; i++) {
                    const card = businessCards[i];
                    try {
                        const result = await cardsAPI.create(card);
                        const createdCard = result?.card || result;
                        if (createdCard?.id) {
                            const oldRef = `${card.name} •••• ${card.lastFourDigits}`;
                            businessCardIdMap.set(oldRef, createdCard.id);
                            businessCardIdMap.set(i.toString(), createdCard.id);
                        }
                        console.log('💳 [WIZARD] Created business card:', card.name, '-> ID:', createdCard?.id);
                    } catch (e) {
                        console.error('Error creating business card:', e);
                    }
                }
            }

            // 6. Create subscriptions for business profile
            if (businessSubs.length > 0 && businessProfileId) {
                localStorage.setItem('investpro_profile_id', businessProfileId);
                for (const sub of businessSubs) {
                    try {
                        let realCardId = null;
                        if (sub.cardId) {
                            realCardId = businessCardIdMap.get(sub.cardId) || null;
                            console.log('🔗 [WIZARD] Mapping business cardId:', sub.cardId, '-> realCardId:', realCardId);
                        }

                        const subPayload = {
                            name: sub.name,
                            amount: parseFloat(sub.amount) || 0,
                            category: sub.category,
                            frequency: sub.frequency || 'MONTHLY',
                            startDate: sub.startDate || sub.nextBillingDate || new Date().toISOString().split('T')[0],
                            icon: sub.icon || '',
                            color: sub.color || '#6366F1',
                            cardId: realCardId
                        };

                        await subscriptionsAPI.create(subPayload);
                        console.log('📦 [WIZARD] Created business subscription:', sub.name);
                    } catch (e) {
                        console.error('Error creating business subscription:', e);
                    }
                }
            }

            // 7. Reset to default profile and RELOAD to apply context
            if (defaultProfileId && typeof window !== 'undefined') {
                localStorage.setItem('investpro_profile_id', defaultProfileId);
                console.log('💾 [WIZARD] Final profileId set to:', defaultProfileId);
            }

            await refreshProfiles();

            // 8. Reload page after a short delay to ensure all contexts load with correct profile
            // This is necessary because ProfileContext was already loaded before onboarding
            setTimeout(() => {
                console.log('🔄 [WIZARD] Reloading page to apply profile context...');
                window.location.reload();
            }, 500);
        } catch (e) {
            console.error('═══════════════════════════════════════════════════');
            console.error('❌ [WIZARD] Error saving profiles:', e);
            console.error('   - Details:', e?.details || e?.message);
            console.error('   - ErrorName:', e?.errorName);
            console.error('   - Full object:', JSON.stringify(e, null, 2));
            console.error('═══════════════════════════════════════════════════');
        }
        setLoading(false);
        setStep('complete');
    };

    const handleBack = () => {
        if (step === 'config') setStep('type');
        else if (step === 'default') setStep('config');
        else if (step === 'financial_personal') {
            if (profileType === 'HYBRID') setStep('default');
            else setStep('config');
        }
        else if (step === 'cards_personal') setStep('financial_personal');
        else if (step === 'subs_personal') setStep('cards_personal');
        else if (step === 'financial_business') {
            if (profileType === 'HYBRID') setStep('subs_personal');
            else setStep('config');
        }
        else if (step === 'cards_business') setStep('financial_business');
        else if (step === 'subs_business') setStep('cards_business');
    };

    const getProgressWidth = () => {
        const steps = {
            'type': 8,
            'config': 16,
            'default': 24,
            'financial_personal': 32,
            'cards_personal': 44,
            'subs_personal': 56,
            'financial_business': 68,
            'cards_business': 80,
            'subs_business': 92,
            'complete': 100
        };
        return `${steps[step] || 0}%`;
    };

    const getCurrentCards = () => currentProfileContext === 'personal' ? personalCards : businessCards;

    return (
        <>
            <div className={styles.overlay}>
                <div className={styles.container}>
                    {/* Progress Bar */}
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: getProgressWidth() }} />
                    </div>

                    <AnimatePresence mode="wait">
                        {/* STEP: Profile Type */}
                        {step === 'type' && (
                            <motion.div
                                key="type"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.iconWrapper}>
                                    <FiLayers />
                                </div>
                                <h2>Como você deseja usar o MyWallet?</h2>
                                <p className={styles.description}>
                                    Configure seus perfis para organizar sua vida financeira
                                </p>

                                <div className={styles.cardGrid}>
                                    {PROFILE_TYPES.map((type) => {
                                        const Icon = type.icon;
                                        return (
                                            <button
                                                key={type.id}
                                                className={`${styles.typeCard} ${profileType === type.id ? styles.selected : ''}`}
                                                onClick={() => {
                                                    setProfileType(type.id);
                                                    if (type.id === 'BUSINESS') setDefaultProfile('BUSINESS');
                                                    else setDefaultProfile('PERSONAL');
                                                }}
                                                style={{ '--accent': type.color }}
                                            >
                                                {type.recommended && (
                                                    <span className={styles.badge}>Recomendado</span>
                                                )}
                                                <div className={styles.typeIcon} style={{ background: type.color }}>
                                                    <Icon />
                                                </div>
                                                <strong>{type.label}</strong>
                                                <span>{type.description}</span>
                                                {profileType === type.id && (
                                                    <div className={styles.checkmark}>
                                                        <FiCheck />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP: Configure Profiles */}
                        {step === 'config' && (
                            <motion.div
                                key="config"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.iconWrapper}>
                                    <FiUser />
                                </div>
                                <h2>Configure seus Perfis</h2>
                                <p className={styles.description}>
                                    Dê um nome para identificar cada perfil financeiro
                                </p>

                                {(profileType === 'PERSONAL' || profileType === 'HYBRID') && (
                                    <div className={styles.profileCard}>
                                        <div className={styles.cardHeader}>
                                            <FiUser /> Perfil Pessoal
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label>Nome do perfil</label>
                                            <input
                                                type="text"
                                                value={personalName}
                                                onChange={(e) => setPersonalName(e.target.value)}
                                                placeholder="Ex: Minha Casa"
                                            />
                                        </div>
                                    </div>
                                )}

                                {(profileType === 'BUSINESS' || profileType === 'HYBRID') && (
                                    <div className={styles.profileCard}>
                                        <div className={styles.cardHeader}>
                                            <FiBriefcase /> Perfil Empresarial
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label>Nome da empresa</label>
                                            <input
                                                type="text"
                                                value={businessName}
                                                onChange={(e) => setBusinessName(e.target.value)}
                                                placeholder="Ex: Minha Loja"
                                            />
                                        </div>

                                        <div className={styles.subtypeCards}>
                                            {BUSINESS_SUBTYPES.map((subtype) => {
                                                const Icon = subtype.icon;
                                                return (
                                                    <button
                                                        key={subtype.id}
                                                        className={`${styles.subtypeCard} ${businessSubtype === subtype.id ? styles.selected : ''}`}
                                                        onClick={() => setBusinessSubtype(subtype.id)}
                                                    >
                                                        <div className={styles.subtypeCardIcon}>
                                                            <Icon />
                                                        </div>
                                                        <strong>{subtype.label}</strong>
                                                        <small>{subtype.description}</small>
                                                        {businessSubtype === subtype.id && <FiCheck className={styles.subtypeCheck} />}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className={styles.inputRow}>
                                            <div className={styles.inputGroup}>
                                                <label>CNPJ <span className={styles.required}>*</span></label>
                                                <input
                                                    type="text"
                                                    value={businessCnpj}
                                                    onChange={(e) => setBusinessCnpj(applyCnpjMask(e.target.value))}
                                                    placeholder="00.000.000/0000-00"
                                                    required
                                                />
                                            </div>
                                            <div className={styles.inputGroup}>
                                                <label>CPF do Proprietário <span className={styles.required}>*</span></label>
                                                <input
                                                    type="text"
                                                    value={businessCpf}
                                                    onChange={(e) => setBusinessCpf(applyCpfMask(e.target.value))}
                                                    placeholder="000.000.000-00"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* STEP: Default Profile */}
                        {step === 'default' && (
                            <motion.div
                                key="default"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.iconWrapper}>
                                    <FiCheckCircle />
                                </div>
                                <h2>Perfil Principal</h2>
                                <p className={styles.description}>
                                    Qual perfil deve abrir automaticamente ao acessar o app?
                                </p>

                                <div className={styles.optionsList}>
                                    <button
                                        className={`${styles.optionBtn} ${defaultProfile === 'PERSONAL' ? styles.selected : ''}`}
                                        onClick={() => setDefaultProfile('PERSONAL')}
                                    >
                                        <FiUser />
                                        <span>{personalName || 'Pessoal'}</span>
                                        {defaultProfile === 'PERSONAL' && <FiCheck className={styles.optionCheck} />}
                                    </button>

                                    <button
                                        className={`${styles.optionBtn} ${defaultProfile === 'BUSINESS' ? styles.selected : ''}`}
                                        onClick={() => setDefaultProfile('BUSINESS')}
                                    >
                                        <FiBriefcase />
                                        <span>{businessName || 'Empresarial'}</span>
                                        {defaultProfile === 'BUSINESS' && <FiCheck className={styles.optionCheck} />}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP: Financial Data - Personal */}
                        {step === 'financial_personal' && (
                            <motion.div
                                key="financial_personal"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.iconWrapper}>
                                    <FiDollarSign />
                                </div>
                                <h2>Finanças Pessoais</h2>
                                <p className={styles.description}>
                                    Configure os dados do perfil <strong>{personalName}</strong>
                                </p>

                                <div className={styles.inputRow}>
                                    <div className={styles.inputGroup}>
                                        <label>Salário Mensal</label>
                                        <div className={styles.currencyInput}>
                                            <span>R$</span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={salary}
                                                onChange={(e) => handleCurrencyChange(e.target.value, setSalary)}
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Dia do pagamento</label>
                                        <select value={salaryDay} onChange={(e) => setSalaryDay(e.target.value)}>
                                            {[...Array(31)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>Saldo Inicial (opcional)</label>
                                    <div className={styles.currencyInput}>
                                        <span>R$</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={initialBalance}
                                            onChange={(e) => handleCurrencyChange(e.target.value, setInitialBalance)}
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>

                                <p className={styles.hint}>
                                    💡 Você pode ajustar isso depois nas configurações
                                </p>
                            </motion.div>
                        )}

                        {/* STEP: Cards - Personal */}
                        {step === 'cards_personal' && (
                            <motion.div
                                key="cards_personal"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.iconWrapper}>
                                    <FiCreditCard />
                                </div>
                                <h2>Cartões Pessoais</h2>
                                <p className={styles.description}>
                                    Cadastre seus cartões de crédito pessoais (opcional)
                                </p>

                                {personalCards.length > 0 && (
                                    <div className={styles.itemsList}>
                                        {personalCards.map((card, idx) => (
                                            <div key={idx} className={styles.listItem}>
                                                <div className={styles.cardColor} style={{ background: card.color }} />
                                                <div className={styles.itemInfo}>
                                                    <strong>{card.name}</strong>
                                                    <span>{card.brand} •••• {card.lastFourDigits}</span>
                                                </div>
                                                <div className={styles.itemActions}>
                                                    <button onClick={() => openCardModal('personal', card, idx)}>
                                                        <FiEdit2 />
                                                    </button>
                                                    <button onClick={() => removeCard('personal', idx)} className={styles.danger}>
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button className={styles.addButton} onClick={() => openCardModal('personal')}>
                                    <FiPlus /> Adicionar Cartão
                                </button>
                            </motion.div>
                        )}

                        {/* STEP: Subscriptions - Personal */}
                        {step === 'subs_personal' && (
                            <motion.div
                                key="subs_personal"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.iconWrapper}>
                                    <FiRepeat />
                                </div>
                                <h2>Assinaturas Pessoais</h2>
                                <p className={styles.description}>
                                    Adicione suas assinaturas mensais (Netflix, Spotify, etc.)
                                </p>

                                {personalSubs.length > 0 && (
                                    <div className={styles.itemsList}>
                                        {personalSubs.map((sub, idx) => (
                                            <div key={idx} className={styles.listItem}>
                                                <div className={styles.subIcon}>
                                                    {sub.icon ? <img src={sub.icon} alt={sub.name} /> : <FiRepeat />}
                                                </div>
                                                <div className={styles.itemInfo}>
                                                    <strong>{sub.name}</strong>
                                                    <span>{formatCurrency(sub.amount)}/mês</span>
                                                </div>
                                                <div className={styles.itemActions}>
                                                    <button onClick={() => openSubModal('personal', sub, idx)}>
                                                        <FiEdit2 />
                                                    </button>
                                                    <button onClick={() => removeSub('personal', idx)} className={styles.danger}>
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {personalSubs.length > 0 && (
                                    <div className={styles.totalBar}>
                                        Total mensal: <strong>{formatCurrency(personalSubs.reduce((acc, s) => acc + parseFloat(s.amount || 0), 0))}</strong>
                                    </div>
                                )}

                                <button className={styles.addButton} onClick={() => openSubModal('personal')}>
                                    <FiPlus /> Adicionar Assinatura
                                </button>
                            </motion.div>
                        )}

                        {/* STEP: Financial Data - Business */}
                        {step === 'financial_business' && (
                            <motion.div
                                key="financial_business"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                    <FiBriefcase />
                                </div>
                                <h2>Finanças Empresariais</h2>
                                <p className={styles.description}>
                                    Configure os dados da <strong>{businessName}</strong> ({businessSubtype})
                                </p>

                                {/* DAS Section */}
                                <div className={styles.profileCard}>
                                    <div className={styles.cardHeader}>
                                        <FiFileText /> DAS - Imposto Mensal
                                    </div>
                                    <p className={styles.cardDescription}>
                                        O DAS será registrado como despesa recorrente automática
                                    </p>
                                    <div className={styles.inputRow}>
                                        <div className={styles.inputGroup}>
                                            <label>Valor do DAS</label>
                                            <div className={styles.currencyInput}>
                                                <span>R$</span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={dasValue}
                                                    onChange={(e) => handleCurrencyChange(e.target.value, setDasValue)}
                                                    placeholder={businessSubtype === 'MEI' ? '70,60' : '0,00'}
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label>Vencimento</label>
                                            <select value={dasDueDay} onChange={(e) => setDasDueDay(e.target.value)}>
                                                {[...Array(28)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>Dia {i + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Pró-labore - Only for ME */}
                                {getCurrentSubtype().hasProLabore && (
                                    <div className={styles.profileCard}>
                                        <div className={styles.cardHeader}>
                                            <FiDollarSign /> Pró-labore
                                        </div>
                                        <p className={styles.cardDescription}>
                                            Retirada mensal do sócio (obrigatória para ME)
                                        </p>
                                        <div className={styles.inputRow}>
                                            <div className={styles.inputGroup}>
                                                <label>Valor mensal</label>
                                                <div className={styles.currencyInput}>
                                                    <span>R$</span>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={proLabore}
                                                        onChange={(e) => handleCurrencyChange(e.target.value, setProLabore)}
                                                        placeholder="0,00"
                                                    />
                                                </div>
                                            </div>
                                            <div className={styles.inputGroup}>
                                                <label>Dia do pagamento</label>
                                                <select value={proLaboreDay} onChange={(e) => setProLaboreDay(e.target.value)}>
                                                    {[...Array(31)].map((_, i) => (
                                                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Business Balance */}
                                <div className={styles.inputGroup}>
                                    <label>Saldo Inicial da Empresa (opcional)</label>
                                    <div className={styles.currencyInput}>
                                        <span>R$</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={businessBalance}
                                            onChange={(e) => handleCurrencyChange(e.target.value, setBusinessBalance)}
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>

                                {businessSubtype === 'MEI' && (
                                    <p className={styles.hint}>
                                        💡 MEI não possui pró-labore. Suas retiradas são classificadas como "distribuição de lucros".
                                    </p>
                                )}
                            </motion.div>
                        )}

                        {/* STEP: Cards - Business */}
                        {step === 'cards_business' && (
                            <motion.div
                                key="cards_business"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                    <FiCreditCard />
                                </div>
                                <h2>Cartões Empresariais</h2>
                                <p className={styles.description}>
                                    Cadastre os cartões de crédito da <strong>{businessName}</strong> (opcional)
                                </p>

                                {businessCards.length > 0 && (
                                    <div className={styles.itemsList}>
                                        {businessCards.map((card, idx) => (
                                            <div key={idx} className={styles.listItem}>
                                                <div className={styles.cardColor} style={{ background: card.color }} />
                                                <div className={styles.itemInfo}>
                                                    <strong>{card.name}</strong>
                                                    <span>{card.brand} •••• {card.lastFourDigits}</span>
                                                </div>
                                                <div className={styles.itemActions}>
                                                    <button onClick={() => openCardModal('business', card, idx)}>
                                                        <FiEdit2 />
                                                    </button>
                                                    <button onClick={() => removeCard('business', idx)} className={styles.danger}>
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button className={styles.addButton} onClick={() => openCardModal('business')}>
                                    <FiPlus /> Adicionar Cartão
                                </button>
                            </motion.div>
                        )}

                        {/* STEP: Subscriptions - Business */}
                        {step === 'subs_business' && (
                            <motion.div
                                key="subs_business"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                    <FiRepeat />
                                </div>
                                <h2>Assinaturas Empresariais</h2>
                                <p className={styles.description}>
                                    Adicione assinaturas e serviços mensais da empresa
                                </p>

                                {businessSubs.length > 0 && (
                                    <div className={styles.itemsList}>
                                        {businessSubs.map((sub, idx) => (
                                            <div key={idx} className={styles.listItem}>
                                                <div className={styles.subIcon}>
                                                    {sub.icon ? <img src={sub.icon} alt={sub.name} /> : <FiRepeat />}
                                                </div>
                                                <div className={styles.itemInfo}>
                                                    <strong>{sub.name}</strong>
                                                    <span>{formatCurrency(sub.amount)}/mês</span>
                                                </div>
                                                <div className={styles.itemActions}>
                                                    <button onClick={() => openSubModal('business', sub, idx)}>
                                                        <FiEdit2 />
                                                    </button>
                                                    <button onClick={() => removeSub('business', idx)} className={styles.danger}>
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {businessSubs.length > 0 && (
                                    <div className={styles.totalBar}>
                                        Total mensal: <strong>{formatCurrency(businessSubs.reduce((acc, s) => acc + parseFloat(s.amount || 0), 0))}</strong>
                                    </div>
                                )}

                                <button className={styles.addButton} onClick={() => openSubModal('business')}>
                                    <FiPlus /> Adicionar Assinatura
                                </button>
                            </motion.div>
                        )}

                        {/* STEP: Complete */}
                        {step === 'complete' && (
                            <motion.div
                                key="complete"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={styles.stepContent}
                            >
                                <div className={`${styles.iconWrapper} ${styles.success}`}>
                                    <FiCheckCircle />
                                </div>
                                <h2>Tudo pronto! 🎉</h2>
                                <p className={styles.description}>
                                    {profileType === 'BUSINESS' ? (
                                        businessSubtype === 'MEI'
                                            ? 'Seu MEI está configurado e pronto para usar!'
                                            : 'Sua Microempresa está configurada!'
                                    ) : profileType === 'HYBRID' ? (
                                        'Seus perfis pessoal e empresarial estão prontos!'
                                    ) : (
                                        'Seu perfil pessoal está configurado!'
                                    )}
                                </p>

                                <div className={styles.summary}>
                                    {(profileType === 'PERSONAL' || profileType === 'HYBRID') && (
                                        <>
                                            <div>✅ Perfil Pessoal: {personalName}</div>
                                            {parseCurrencyValue(salary) > 0 && (
                                                <div>💰 Salário: {formatCurrency(salary)} (dia {salaryDay})</div>
                                            )}
                                            {personalCards.length > 0 && (
                                                <div>💳 {personalCards.length} cartão(ões) pessoal(is)</div>
                                            )}
                                            {personalSubs.length > 0 && (
                                                <div>📦 {personalSubs.length} assinatura(s) pessoal(is)</div>
                                            )}
                                        </>
                                    )}
                                    {(profileType === 'BUSINESS' || profileType === 'HYBRID') && (
                                        <>
                                            <div>✅ Perfil Empresarial: {businessName} ({businessSubtype})</div>
                                            {parseCurrencyValue(dasValue) > 0 && (
                                                <div>📋 DAS: {formatCurrency(dasValue)} (dia {dasDueDay})</div>
                                            )}
                                            {getCurrentSubtype().hasProLabore && parseCurrencyValue(proLabore) > 0 && (
                                                <div>💵 Pró-labore: {formatCurrency(proLabore)} (dia {proLaboreDay})</div>
                                            )}
                                            {businessCards.length > 0 && (
                                                <div>💳 {businessCards.length} cartão(ões) empresarial(is)</div>
                                            )}
                                            {businessSubs.length > 0 && (
                                                <div>📦 {businessSubs.length} assinatura(s) empresarial(is)</div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className={styles.navigation}>
                        {step !== 'type' && step !== 'complete' && (
                            <button className={styles.backBtn} onClick={handleBack}>
                                <FiArrowLeft /> Voltar
                            </button>
                        )}

                        <button
                            className={`${styles.nextBtn} ${step === 'complete' ? styles.completeBtn : ''}`}
                            onClick={handleNext}
                            disabled={!canProceed() || loading}
                        >
                            {loading ? 'Salvando...' :
                                step === 'complete' ? 'Começar a usar' :
                                    step === 'type' ? 'Continuar' : 'Próximo'}
                            {!loading && step !== 'complete' && <FiArrowRight />}
                            {!loading && step === 'complete' && <FiCheck />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Card Modal */}
            <CardModal
                isOpen={showCardModal}
                onClose={() => { setShowCardModal(false); setEditingCard(null); }}
                onSave={handleSaveCard}
                editingCard={editingCard}
            />

            {/* Subscription Modal */}
            <SubscriptionModal
                isOpen={showSubModal}
                onClose={() => { setShowSubModal(false); setEditingSub(null); }}
                onSave={handleSaveSub}
                editingSub={editingSub}
                cards={getCurrentCards()}
            />
        </>
    );
}
