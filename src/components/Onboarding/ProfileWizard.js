'use client';

/**
 * ProfileWizard
 * ========================================
 * MULTI-PROFILE SETUP WIZARD
 * With DAS, Cards, Subscriptions and Brokers configuration
 * ========================================
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiArrowRight, FiArrowLeft, FiCheck, FiCheckCircle,
    FiUser, FiBriefcase, FiLayers, FiDollarSign, FiCalendar,
    FiFileText, FiCreditCard, FiRepeat, FiPlus, FiEdit2, FiTrash2,
    FiTool, FiHome, FiTrendingUp, FiUpload
} from 'react-icons/fi';
import { BiWallet } from 'react-icons/bi';
import { profilesAPI, cardsAPI, subscriptionsAPI, brokersAPI } from '@/services/api';
import bankAccountService from '@/services/bankAccountService';
import { useProfiles } from '@/contexts/ProfileContext';
import CardModal from '@/components/modals/CardModal';
import SubscriptionModal from '@/components/modals/SubscriptionModal';
import ImportStep from './steps/ImportStep'; // NEW IMPORT
import BankAccountModal from './BankAccountModal';
import BrokerModal from './BrokerModal';
import cardBanksData from '@/data/cardBanks.json';
import BROKERS_LIST from '@/data/brokers.json';
import styles from './ProfileWizard.module.css';

// Convert banks object to array for mapping (with safety check)
const banksArray = cardBanksData?.banks
    ? Object.entries(cardBanksData.banks).map(([key, bank]) => ({
        key,
        ...bank
    }))
    : [];

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

// Currency input helper - allows free typing, only validates characters
const handleCurrencyInput = (value) => {
    // Allow digits, comma, and period (will be treated as comma)
    // Remove any character that is not a digit, comma, or period
    let cleaned = value.replace(/[^\d.,]/g, '');

    // Replace period with comma (Brazilian format)
    cleaned = cleaned.replace(/\./g, ',');

    // Only allow one comma
    const firstCommaIndex = cleaned.indexOf(',');
    if (firstCommaIndex !== -1) {
        const beforeComma = cleaned.slice(0, firstCommaIndex + 1);
        const afterComma = cleaned.slice(firstCommaIndex + 1).replace(/,/g, '');
        cleaned = beforeComma + afterComma.slice(0, 2); // Max 2 decimal places
    }

    return cleaned;
};

// Format currency for display (add thousand separators)
const formatCurrencyDisplay = (value) => {
    if (!value) return '';

    // Split by comma
    const parts = value.split(',');
    let integerPart = parts[0] || '';
    const decimalPart = parts[1] || '';

    // Remove leading zeros but keep at least empty string
    integerPart = integerPart.replace(/^0+/, '');

    // Add thousand separators
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    if (!integerPart) integerPart = '0';

    if (value.includes(',')) {
        return `${integerPart},${decimalPart}`;
    }
    return integerPart;
};

const parseCurrencyValue = (maskedValue) => {
    if (!maskedValue) return 0;
    // Remove thousand separators (dots) and replace comma with dot for parsing
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

// localStorage key for wizard state
const WIZARD_STATE_KEY = 'mywallet_wizard_state';

export default function ProfileWizard({ onComplete }) {
    const { refreshProfiles } = useProfiles();

    // Load saved state from localStorage
    const getSavedState = () => {
        if (typeof window === 'undefined') return null;
        try {
            const saved = localStorage.getItem(WIZARD_STATE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    };

    const savedState = getSavedState();

    const [step, setStep] = useState(savedState?.step || 'type');
    const [loading, setLoading] = useState(false);

    // Form states - Personal
    const [profileType, setProfileType] = useState(savedState?.profileType || null);
    const [personalName, setPersonalName] = useState(savedState?.personalName || 'Minha Casa');
    const [salary, setSalary] = useState(savedState?.salary || '');
    const [salaryDay, setSalaryDay] = useState(savedState?.salaryDay || '5');
    const [initialBalance, setInitialBalance] = useState(savedState?.initialBalance || '');

    // Form states - Business
    const [businessName, setBusinessName] = useState(savedState?.businessName || '');
    const [businessSubtype, setBusinessSubtype] = useState(savedState?.businessSubtype || 'MEI');
    const [businessCnpj, setBusinessCnpj] = useState(savedState?.businessCnpj || '');
    const [businessCpf, setBusinessCpf] = useState(savedState?.businessCpf || '');
    const [defaultProfile, setDefaultProfile] = useState(savedState?.defaultProfile || 'PERSONAL');

    // DAS
    const [dasValue, setDasValue] = useState(savedState?.dasValue || '');
    const [dasDueDay, setDasDueDay] = useState(savedState?.dasDueDay || '20');

    // Pró-labore (only for ME)
    const [proLabore, setProLabore] = useState(savedState?.proLabore || '');
    const [proLaboreDay, setProLaboreDay] = useState(savedState?.proLaboreDay || '5');

    // Business initial balance
    const [businessBalance, setBusinessBalance] = useState(savedState?.businessBalance || '');

    // Cards & Subscriptions - Personal
    const [personalCards, setPersonalCards] = useState(savedState?.personalCards || []);
    const [personalSubs, setPersonalSubs] = useState(savedState?.personalSubs || []);

    // Cards & Subscriptions - Business
    const [businessCards, setBusinessCards] = useState(savedState?.businessCards || []);
    const [businessSubs, setBusinessSubs] = useState(savedState?.businessSubs || []);

    // Modal states
    const [showCardModal, setShowCardModal] = useState(false);
    const [showSubModal, setShowSubModal] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [editingSub, setEditingSub] = useState(null);
    const [editingBank, setEditingBank] = useState(null); // Bank being edited
    const [importedTransactions, setImportedTransactions] = useState(new Map());
    const [currentProfileContext, setCurrentProfileContext] = useState('personal'); // 'personal' or 'business'
    const [reopenCardModal, setReopenCardModal] = useState(false); // Flag to reopen CardModal after adding bank
    const [showImport, setShowImport] = useState(false);
    const [importContext, setImportContext] = useState(null); // 'personal' or 'business'

    const handleImportFinish = (result) => {
        // result = { success, entity, detectedSubscriptions }
        const entity = result?.entity || result?.bankAccount;

        if (result?.success && entity) {
            const context = importContext || 'personal';
            const isPersonal = context === 'personal';

            // Access current state directly to check for existing banks
            const currentBanks = isPersonal ? personalBanks : businessBanks;
            const setBanks = isPersonal ? setPersonalBanks : setBusinessBanks;
            const setCards = isPersonal ? setPersonalCards : setBusinessCards;
            const setSubs = isPersonal ? setPersonalSubs : setBusinessSubs;

            if (entity.type === 'CREDIT_CARD') {
                // Ensure a parent Bank Account exists for this card
                // This makes the "Bank" appear in the list immediately
                const bankName = entity.bankName || 'Banco Desconhecido';
                let bankId = null;

                const existingBank = currentBanks.find(b =>
                    (b.bankName && b.bankName.toLowerCase() === bankName.toLowerCase()) ||
                    (b.nickname && b.nickname.toLowerCase() === bankName.toLowerCase())
                );

                if (existingBank) {
                    bankId = existingBank.id || existingBank._index;
                } else {
                    // Create new virtual bank for this card
                    const newBankId = `TEMP-BANK-${Date.now()}`;
                    const newBank = {
                        id: newBankId,
                        bankKey: 'custom',
                        bankName: bankName,
                        nickname: bankName,
                        icon: null, // Will use default colored wallet icon
                        color: entity.color || '#6366F1',
                        balance: 0,
                        isDefault: false,
                        isCustom: true
                    };

                    setBanks(prev => {
                        // Double check inside setter availability to be safe, though rare conflict
                        return [...prev, newBank];
                    });
                    bankId = newBankId;
                }

                // Add Card (linked to the bank)
                setCards(prev => [...prev, { ...entity, bankAccountId: bankId }]);

                // Store transactions for later persistence
                if (result.transactions && result.transactions.length > 0) {
                    setImportedTransactions(prev => new Map(prev).set(entity.id || entity._index || `temp-card-${Date.now()}`, result.transactions));
                }

            } else {
                // Bank Account (Checking/Investment) logic
                let targetId = null;

                setBanks(prev => {
                    // Check update vs create
                    const existingIndex = prev.findIndex(b =>
                        (b.id && b.id === entity.id) ||
                        (b.accountNumber && b.accountNumber === entity.accountNumber)
                    );

                    if (existingIndex >= 0) {
                        // Update existing bank
                        const updated = [...prev];
                        updated[existingIndex] = { ...updated[existingIndex], ...entity };
                        targetId = updated[existingIndex].id;
                        return updated;
                    }
                    // Add new bank
                    targetId = entity.id;
                    return [...prev, entity];
                });

                // Store transactions
                if (result.transactions && result.transactions.length > 0) {
                    // We need to ensure we use the same ID that will be used during creation
                    // Since 'entity.id' is what we just pushed/updated, use that.
                    setImportedTransactions(prev => new Map(prev).set(entity.id, result.transactions));
                }
            }

            if (result.detectedSubscriptions && result.detectedSubscriptions.length > 0) {
                setSubs(prev => [...prev, ...result.detectedSubscriptions]);
            }

            // Close the import view - REMOVED to allow multi-import flow (Wizard keeps open)
            // setShowImport(false); 
        }
    };

    // Bank Accounts - Personal (array of banks)
    const [personalBanks, setPersonalBanks] = useState(savedState?.personalBanks || [
        // Auto-default wallet
        {
            bankKey: 'custom',
            bankName: 'Carteira',
            nickname: 'MyWallet (Pessoal)',
            icon: null,
            color: '#6366F1',
            balance: 0,
            isDefault: true,
            isCustom: true
        }
    ]);

    // Bank Accounts - Business (array of banks)
    const [businessBanks, setBusinessBanks] = useState(savedState?.businessBanks || [
        // Auto-default wallet
        {
            bankKey: 'custom',
            bankName: 'Carteira',
            nickname: 'MyWallet (Empresa)',
            icon: null,
            color: '#10B981',
            balance: 0,
            isDefault: true,
            isCustom: true
        }
    ]);

    // Salary linked bank
    const [salaryBankIndex, setSalaryBankIndex] = useState(savedState?.salaryBankIndex || 0);

    // Brokers State - with default MyWallet Investimentos
    const [selectedBrokers, setSelectedBrokers] = useState(savedState?.selectedBrokers || [
        // Auto-default broker
        {
            code: 'MYWALLET',
            name: 'MyWallet Investimentos',
            customName: 'MyWallet Investimentos',
            logoUrl: null,
            color: '#10B981',
            investmentFocus: 'Carteira Padrão',
            type: 'SYSTEM',
            isDefault: true
        }
    ]);
    const [showBrokerModal, setShowBrokerModal] = useState(false);
    const [editingBroker, setEditingBroker] = useState(null);
    const availableBrokers = BROKERS_LIST; // Static data from JSON

    // Broker Modal handlers
    const openBrokerModal = (broker = null, index = null) => {
        setEditingBroker(broker ? { ...broker, _index: index } : null);
        setShowBrokerModal(true);
    };

    const handleSaveBroker = (brokerData) => {
        if (editingBroker?._index !== undefined) {
            // Editing existing
            const updated = [...selectedBrokers];
            updated[editingBroker._index] = brokerData;
            setSelectedBrokers(updated);
        } else {
            // Check if broker already exists
            if (selectedBrokers.find(b => b.code === brokerData.code)) {
                return; // Already added
            }
            setSelectedBrokers([...selectedBrokers, brokerData]);
        }
        setShowBrokerModal(false);
        setEditingBroker(null);
    };

    const removeBroker = (idx) => {
        // Don't allow removing the default broker if it's the only one
        if (selectedBrokers[idx]?.isDefault && selectedBrokers.length === 1) return;
        setSelectedBrokers(selectedBrokers.filter((_, i) => i !== idx));
    };

    // ✅ Save state to localStorage whenever it changes
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (step === 'complete') {
            // Clear saved state when onboarding completes
            localStorage.removeItem(WIZARD_STATE_KEY);
            return;
        }

        const stateToSave = {
            step,
            profileType,
            personalName,
            salary,
            salaryDay,
            initialBalance,
            businessName,
            businessSubtype,
            businessCnpj,
            businessCpf,
            defaultProfile,
            dasValue,
            dasDueDay,
            proLabore,
            proLaboreDay,
            businessBalance,
            personalCards,
            personalSubs,
            businessCards,
            businessSubs,
            personalBanks,
            businessBanks,
            salaryBankIndex,
            selectedBrokers
        };

        localStorage.setItem(WIZARD_STATE_KEY, JSON.stringify(stateToSave));
    }, [step, profileType, personalName, salary, salaryDay, initialBalance, businessName,
        businessSubtype, businessCnpj, businessCpf, defaultProfile, dasValue, dasDueDay,
        proLabore, proLaboreDay, businessBalance, personalCards, personalSubs, businessCards,
        businessSubs, personalBanks, businessBanks, salaryBankIndex, selectedBrokers]);

    const handleCurrencyChange = (value, setter) => {
        // Allow free typing with digits and comma/period
        const cleaned = handleCurrencyInput(value);
        setter(cleaned);
    };

    // Format on blur - add thousand separators
    const handleCurrencyBlur = (value, setter) => {
        const formatted = formatCurrencyDisplay(value);
        setter(formatted);
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

    // Bank Account Modal handlers
    const openBankModal = (profileContext, bank = null, index = null) => {
        setCurrentProfileContext(profileContext);
        setEditingBank(bank ? { ...bank, _index: index } : null);
        setShowBankModal(true);
    };

    const handleSaveBank = (bankData) => {
        const banks = currentProfileContext === 'personal' ? personalBanks : businessBanks;
        const setBanks = currentProfileContext === 'personal' ? setPersonalBanks : setBusinessBanks;

        if (bankData._index !== undefined) {
            // Editing existing
            const updated = [...banks];
            updated[bankData._index] = { ...bankData, isDefault: banks[bankData._index]?.isDefault };
            setBanks(updated);
        } else {
            // Adding new - if first, set as default
            const isFirst = banks.length === 0;
            setBanks([...banks, { ...bankData, isDefault: isFirst }]);
        }
        setShowBankModal(false);
        setEditingBank(null);

        // Reopen CardModal if it was open before adding bank
        if (reopenCardModal) {
            setReopenCardModal(false);
            setShowCardModal(true);
        }
    };

    const removeBank = (profileContext, idx) => {
        if (profileContext === 'personal') {
            const updated = personalBanks.filter((_, i) => i !== idx);
            // If removed was default, set first as default
            if (personalBanks[idx]?.isDefault && updated.length > 0) {
                updated[0].isDefault = true;
            }
            setPersonalBanks(updated);
        } else {
            const updated = businessBanks.filter((_, i) => i !== idx);
            if (businessBanks[idx]?.isDefault && updated.length > 0) {
                updated[0].isDefault = true;
            }
            setBusinessBanks(updated);
        }
    };

    const setDefaultBank = (profileContext, idx) => {
        if (profileContext === 'personal') {
            setPersonalBanks(personalBanks.map((b, i) => ({ ...b, isDefault: i === idx })));
        } else {
            setBusinessBanks(businessBanks.map((b, i) => ({ ...b, isDefault: i === idx })));
        }
    };

    const canProceed = () => {
        switch (step) {
            case 'type':
                return profileType !== null;
            case 'config':
                if (profileType === 'PERSONAL') return personalName.trim() !== '';
                if (profileType === 'BUSINESS') {
                    const cnpjValid = businessCnpj.replace(/\D/g, '').length === 14;
                    const cpfValid = businessCpf.replace(/\D/g, '').length === 11;
                    return businessName.trim() !== '' && cnpjValid && cpfValid;
                }
                if (profileType === 'HYBRID') {
                    const cnpjValid = businessCnpj.replace(/\D/g, '').length === 14;
                    const cpfValid = businessCpf.replace(/\D/g, '').length === 11;
                    return personalName.trim() !== '' && businessName.trim() !== '' && cnpjValid && cpfValid;
                }
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
                setStep('banks_business'); // Banks first
            } else {
                setStep('banks_personal'); // Banks first
            }
        } else if (step === 'default') {
            setStep('banks_personal'); // Banks first for both profiles in hybrid
        } else if (step === 'banks_personal') {
            setStep('financial_personal');
        } else if (step === 'financial_personal') {
            setStep('cards_personal');
        } else if (step === 'cards_personal') {
            setStep('subs_personal');
        } else if (step === 'subs_personal') {
            if (profileType === 'HYBRID') {
                setStep('banks_business');
            } else {
                setStep('brokers'); // Go to brokers step before submit
            }
        } else if (step === 'banks_business') {
            setStep('financial_business');
        } else if (step === 'financial_business') {
            setStep('cards_business');
        } else if (step === 'cards_business') {
            setStep('subs_business');
        } else if (step === 'subs_business') {
            setStep('brokers'); // Go to brokers step before submit
        } else if (step === 'brokers') {
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

            // Maps to track old IDs -> new IDs
            const personalCardIdMap = new Map();
            const businessCardIdMap = new Map();
            const personalBankIdMap = new Map(); // NEW: Map for banks
            const businessBankIdMap = new Map(); // NEW: Map for banks

            // 2.5. Create bank accounts for profiles from banks arrays
            // Personal bank accounts
            if (personalProfileId && personalBanks.length > 0) {
                localStorage.setItem('investpro_profile_id', personalProfileId);
                for (const bank of personalBanks) {
                    try {
                        const bankResult = await bankAccountService.create({
                            bankName: bank.bankName || 'Carteira',
                            bankCode: bank.bankKey !== 'custom' ? bank.bankKey : null,
                            nickname: bank.nickname,
                            color: bank.color || '#6366F1',
                            icon: bank.icon || null,
                            type: 'CONTA_CORRENTE',
                            initialBalance: bank.balance || 0,
                            isDefault: bank.isDefault || false
                        });

                        // Map temporary ID to real ID if applicable
                        if (bankResult && bank.id) {
                            personalBankIdMap.set(bank.id, bankResult.id);
                        }

                        console.log('🏦 [WIZARD] Created personal bank account:', bank.nickname);

                        // Save Imported Transactions for this Bank
                        if (bank.id && importedTransactions.has(bank.id) && bankResult?.id) {
                            const txs = importedTransactions.get(bank.id);
                            console.log(`💾 [WIZARD] Saving ${txs.length} transactions for Bank ${bank.nickname}...`);
                            await importAPI.confirmImport({
                                data: {
                                    bank: { id: bankResult.id },
                                    account: { number: bank.accountNumber },
                                    transactions: txs
                                },
                                type: 'CHECKING', // Default to Checking, logic handles investments if needed
                                dryRun: false,
                                overrideTargetId: bankResult.id
                            });
                        }

                    } catch (bankError) {
                        console.error('⚠️ [WIZARD] Error creating bank account (non-blocking):', bankError);
                    }
                }
            }

            // Business bank accounts
            if (businessProfileId && businessBanks.length > 0) {
                localStorage.setItem('investpro_profile_id', businessProfileId);
                for (const bank of businessBanks) {
                    try {
                        const bankResult = await bankAccountService.create({
                            bankName: bank.bankName || 'Carteira',
                            bankCode: bank.bankKey !== 'custom' ? bank.bankKey : null,
                            nickname: bank.nickname,
                            color: bank.color || '#10b981',
                            icon: bank.icon || null,
                            type: 'CONTA_CORRENTE',
                            initialBalance: bank.balance || 0,
                            isDefault: bank.isDefault || false
                        });

                        // Map temporary ID to real ID
                        if (bankResult && bank.id) {
                            businessBankIdMap.set(bank.id, bankResult.id);
                        }

                        console.log('🏦 [WIZARD] Created business bank account:', bank.nickname);
                    } catch (bankError) {
                        console.error('⚠️ [WIZARD] Error creating business bank account (non-blocking):', bankError);
                    }
                }
            }

            // Restore default profile for subsequent operations
            if (defaultProfileId) {
                localStorage.setItem('investpro_profile_id', defaultProfileId);
            }

            // 3. Create cards for personal profile and track IDs
            if (personalCards.length > 0 && personalProfileId) {
                localStorage.setItem('investpro_profile_id', personalProfileId);
                for (let i = 0; i < personalCards.length; i++) {
                    const card = personalCards[i];

                    // Resolve Bank Account ID (if it was a temp one)
                    let realBankId = card.bankAccountId;
                    if (realBankId && personalBankIdMap.has(realBankId)) {
                        realBankId = personalBankIdMap.get(realBankId);
                    }

                    try {
                        const result = await cardsAPI.create({ ...card, bankAccountId: realBankId });
                        const createdCard = result?.card || result;
                        if (createdCard?.id) {
                            // Map by index and by name pattern
                            const oldRef = `${card.name} •••• ${card.lastFourDigits}`;
                            personalCardIdMap.set(oldRef, createdCard.id);
                            personalCardIdMap.set(i.toString(), createdCard.id);
                        }
                        console.log('💳 [WIZARD] Created personal card:', card.name, '-> ID:', createdCard?.id);

                        // Save Imported Transactions for this Card?
                        // We need to look up if we have transactions for the TEMP ID of this card
                        // The 'card' object here comes from 'personalCards' state, which has the temp ID
                        if (card.id && importedTransactions.has(card.id) && createdCard?.id) {
                            const txs = importedTransactions.get(card.id);
                            console.log(`💾 [WIZARD] Saving ${txs.length} transactions for Card ${createdCard.name}...`);
                            // We can use importAPI.confirmImport with dryRun=false to bulk save
                            await importAPI.confirmImport({
                                data: {
                                    bank: { id: createdCard.id }, // Target Card ID
                                    transactions: txs
                                },
                                type: 'CREDIT_CARD',
                                dryRun: false,
                                overrideTargetId: createdCard.id // Force target ID
                            });
                        }

                    } catch (e) {
                        console.error('Error creating personal card:', e);
                    }
                }
            }

            // ... (Subscriptions code unchanged)

            // 5. Create cards for business profile and track IDs
            if (businessCards.length > 0 && businessProfileId) {
                localStorage.setItem('investpro_profile_id', businessProfileId);
                for (let i = 0; i < businessCards.length; i++) {
                    const card = businessCards[i];

                    // Resolve Bank Account ID
                    let realBankId = card.bankAccountId;
                    if (realBankId && businessBankIdMap.has(realBankId)) {
                        realBankId = businessBankIdMap.get(realBankId);
                    }

                    try {
                        const result = await cardsAPI.create({ ...card, bankAccountId: realBankId });
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

            // 7. Create selected brokers
            if (selectedBrokers.length > 0) {
                console.log('📈 [WIZARD] Creating brokers...', selectedBrokers);
                for (const broker of selectedBrokers) {
                    try {
                        await brokersAPI.createFromDictionary(broker.code);
                        console.log('📈 [WIZARD] Created broker:', broker.name);
                    } catch (e) {
                        console.error('⚠️ [WIZARD] Error creating broker (non-blocking):', e);
                    }
                }
            }

            // 8. Reset to default profile
            if (defaultProfileId && typeof window !== 'undefined') {
                localStorage.setItem('investpro_profile_id', defaultProfileId);
                console.log('💾 [WIZARD] Final profileId set to:', defaultProfileId);
            }

            await refreshProfiles();

            console.log('═══════════════════════════════════════════════════');
            console.log('✅ [WIZARD] ONBOARDING COMPLETE - Showing completion screen');
            console.log('═══════════════════════════════════════════════════');

            // Success - show completion screen
            setLoading(false);
            setStep('complete');
        } catch (e) {
            console.error('═══════════════════════════════════════════════════');
            console.error('❌ [WIZARD] Error saving profiles:', e);
            console.error('   - Details:', e?.details || e?.message);
            console.error('   - ErrorName:', e?.errorName);
            console.error('   - Full object:', JSON.stringify(e, null, 2));
            console.error('═══════════════════════════════════════════════════');
            setLoading(false);
            // Even on error, show complete so user can try again or continue
            setStep('complete');
        }
    };

    const handleBack = () => {
        if (step === 'config') setStep('type');
        else if (step === 'default') setStep('config');
        else if (step === 'banks_personal') {
            if (profileType === 'HYBRID') setStep('default');
            else setStep('config');
        }
        else if (step === 'financial_personal') setStep('banks_personal');
        else if (step === 'cards_personal') setStep('financial_personal');
        else if (step === 'subs_personal') setStep('cards_personal');
        else if (step === 'banks_business') {
            if (profileType === 'HYBRID') setStep('subs_personal');
            else setStep('config');
        }
        else if (step === 'financial_business') setStep('banks_business');
        else if (step === 'cards_business') setStep('financial_business');
        else if (step === 'subs_business') setStep('cards_business');
        else if (step === 'brokers') {
            // Go back to subs of the last profile configured
            if (profileType === 'PERSONAL') setStep('subs_personal');
            else setStep('subs_business');
        }
    };

    const getProgressWidth = () => {
        const steps = {
            'type': 5,
            'config': 10,
            'default': 15,
            'banks_personal': 20,
            'financial_personal': 28,
            'cards_personal': 36,
            'subs_personal': 44,
            'banks_business': 52,
            'financial_business': 60,
            'cards_business': 68,
            'subs_business': 76,
            'brokers': 88,
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
                                                inputMode="decimal"
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

                                {/* Salary Bank Selector */}
                                <div className={styles.inputGroup}>
                                    <label>Conta para receber o salário</label>
                                    <div className={styles.bankSelector}>
                                        {(() => {
                                            const selectedBank = personalBanks[salaryBankIndex] || personalBanks.find(b => b.isDefault) || personalBanks[0];
                                            return (
                                                <div className={styles.selectedBank}>
                                                    {selectedBank?.icon ? (
                                                        <img src={selectedBank.icon} alt={selectedBank.bankName} className={styles.selectedBankLogo} />
                                                    ) : (
                                                        <div className={styles.selectedBankIcon} style={{ background: selectedBank?.color || '#6366F1' }}>
                                                            <BiWallet />
                                                        </div>
                                                    )}
                                                    <span>{selectedBank?.nickname || 'MyWallet (Pessoal)'}</span>
                                                </div>
                                            );
                                        })()}
                                        <select
                                            value={salaryBankIndex}
                                            onChange={(e) => setSalaryBankIndex(Number(e.target.value))}
                                        >
                                            {personalBanks.map((bank, idx) => (
                                                <option key={idx} value={idx}>
                                                    {bank.nickname}{bank.isDefault ? ' (Padrão)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <p className={styles.hint}>
                                    💡 O salário será depositado automaticamente na conta selecionada acima
                                </p>
                            </motion.div>
                        )}

                        {/* STEP: Banks - Personal (Updated to use BankAccountsStep) */}
                        {step === 'banks_personal' && (
                            <motion.div
                                key="banks_personal"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                {/* STEP: Banks - Personal (Restored + Import) */}
                                {step === 'banks_personal' && (
                                    <motion.div
                                        key="banks_personal"
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        className={styles.stepContent}
                                    >
                                        {showImport && importContext === 'personal' ? (
                                            <ImportStep
                                                isSubComponent={true}
                                                onSkip={() => setShowImport(false)}
                                                onConfirmHelper={handleImportFinish}
                                            />
                                        ) : (
                                            <>
                                                <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, #6366F1, #8b5cf6)' }}>
                                                    <BiWallet />
                                                </div>
                                                <h2>Suas Contas Bancárias (Pessoal)</h2>
                                                <p className={styles.description}>
                                                    Configure suas contas e carteiras para controlar suas finanças pessoais
                                                </p>

                                                {/* Bank List */}
                                                <div className={styles.itemsList}>
                                                    {personalBanks.map((bank, idx) => (
                                                        <div key={idx} className={styles.itemRow}>
                                                            {bank.icon ? (
                                                                <div className={styles.bankLogoIcon}>
                                                                    <img src={bank.icon} alt={bank.bankName} />
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    className={styles.subIcon}
                                                                    style={{ background: bank.color || '#6366F1' }}
                                                                >
                                                                    <BiWallet />
                                                                </div>
                                                            )}
                                                            <div className={styles.itemInfo}>
                                                                <strong>{bank.nickname}</strong>
                                                                <span>
                                                                    {bank.bankName} • {formatCurrency(bank.balance)}
                                                                    {bank.isDefault && ' (Padrão)'}
                                                                </span>
                                                            </div>
                                                            <div className={styles.itemActions}>
                                                                {!bank.isDefault && (
                                                                    <button
                                                                        onClick={() => setDefaultBank('personal', idx)}
                                                                        title="Definir como padrão"
                                                                        className={styles.setDefaultBtn}
                                                                    >
                                                                        <FiCheck />
                                                                    </button>
                                                                )}
                                                                <button onClick={() => openBankModal('personal', bank, idx)}>
                                                                    <FiEdit2 />
                                                                </button>
                                                                {personalBanks.length > 1 && (
                                                                    <button onClick={() => removeBank('personal', idx)}>
                                                                        <FiTrash2 />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    className={styles.addButton}
                                                    onClick={() => openBankModal('personal')}
                                                >
                                                    <FiPlus /> Adicionar Banco/Carteira
                                                </button>

                                                <button
                                                    className={styles.addButton}
                                                    onClick={() => { setImportContext('personal'); setShowImport(true); }}
                                                    style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px dashed #555' }}
                                                >
                                                    <FiUpload /> Importar (OFX)
                                                </button>

                                                <p className={styles.hint}>
                                                    💡 Você já tem a carteira padrão "MyWallet". Adicione outros bancos se desejar.
                                                </p>
                                            </>
                                        )}
                                    </motion.div>
                                )}
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
                                                    inputMode="decimal"
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
                                                        inputMode="decimal"
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

                                {businessSubtype === 'MEI' && (
                                    <p className={styles.hint}>
                                        💡 MEI não possui pró-labore. Suas retiradas são classificadas como "distribuição de lucros".
                                    </p>
                                )}
                            </motion.div>
                        )}

                        {/* STEP: Banks - Business (Updated to use BankAccountsStep) */}
                        {step === 'banks_business' && (
                            <motion.div
                                key="banks_business"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                {/* STEP: Banks - Business (Restored + Import) */}
                                {step === 'banks_business' && (
                                    <motion.div
                                        key="banks_business"
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        className={styles.stepContent}
                                    >
                                        {showImport && importContext === 'business' ? (
                                            <ImportStep
                                                isSubComponent={true}
                                                onSkip={() => setShowImport(false)}
                                                onConfirmHelper={handleImportFinish}
                                            />
                                        ) : (
                                            <>
                                                <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                                    <BiWallet />
                                                </div>
                                                <h2>Suas Contas Bancárias (Empresa)</h2>
                                                <p className={styles.description}>
                                                    Configure as contas da sua empresa para controlar as finanças PJ
                                                </p>

                                                {/* Bank List */}
                                                <div className={styles.itemsList}>
                                                    {businessBanks.map((bank, idx) => (
                                                        <div key={idx} className={styles.itemRow}>
                                                            {bank.icon ? (
                                                                <div className={styles.bankLogoIcon}>
                                                                    <img src={bank.icon} alt={bank.bankName} />
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    className={styles.subIcon}
                                                                    style={{ background: bank.color || '#10B981' }}
                                                                >
                                                                    <BiWallet />
                                                                </div>
                                                            )}
                                                            <div className={styles.itemInfo}>
                                                                <strong>{bank.nickname}</strong>
                                                                <span>
                                                                    {bank.bankName} • {formatCurrency(bank.balance)}
                                                                    {bank.isDefault && ' (Padrão)'}
                                                                </span>
                                                            </div>
                                                            <div className={styles.itemActions}>
                                                                {!bank.isDefault && (
                                                                    <button
                                                                        onClick={() => setDefaultBank('business', idx)}
                                                                        title="Definir como padrão"
                                                                        className={styles.setDefaultBtn}
                                                                    >
                                                                        <FiCheck />
                                                                    </button>
                                                                )}
                                                                <button onClick={() => openBankModal('business', bank, idx)}>
                                                                    <FiEdit2 />
                                                                </button>
                                                                {businessBanks.length > 1 && (
                                                                    <button onClick={() => removeBank('business', idx)}>
                                                                        <FiTrash2 />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    className={styles.addButton}
                                                    onClick={() => openBankModal('business')}
                                                >
                                                    <FiPlus /> Adicionar Banco/Carteira
                                                </button>

                                                <button
                                                    className={styles.addButton}
                                                    onClick={() => { setImportContext('business'); setShowImport(true); }}
                                                    style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px dashed #555' }}
                                                >
                                                    <FiUpload /> Importar (OFX)
                                                </button>

                                                <p className={styles.hint}>
                                                    💡 Você já tem a carteira padrão "MyWallet (Empresa)". Adicione outros bancos se desejar.
                                                </p>
                                            </>
                                        )}
                                    </motion.div>
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

                        {/* STEP: Brokers (Corretoras) */}
                        {step === 'brokers' && (
                            <motion.div
                                key="brokers"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.iconWrapper} style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                                    <FiTrendingUp />
                                </div>
                                <h2>Suas Corretoras de Investimentos</h2>
                                <p className={styles.description}>
                                    Adicione as corretoras onde você investe (opcional)
                                </p>

                                {/* Broker List */}
                                {selectedBrokers.length > 0 && (
                                    <div className={styles.itemsList}>
                                        {selectedBrokers.map((broker, idx) => (
                                            <div key={idx} className={styles.itemRow}>
                                                {broker.logoUrl ? (
                                                    <div className={styles.bankLogoIcon}>
                                                        <img src={broker.logoUrl} alt={broker.name} />
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={styles.subIcon}
                                                        style={{ background: broker.color || '#10B981' }}
                                                    >
                                                        <FiTrendingUp />
                                                    </div>
                                                )}
                                                <div className={styles.itemInfo}>
                                                    <strong>{broker.customName || broker.name}</strong>
                                                    <span>
                                                        {broker.investmentFocus || broker.type || 'Corretora'}
                                                        {broker.isDefault && ' (Padrão)'}
                                                    </span>
                                                </div>
                                                <div className={styles.itemActions}>
                                                    <button onClick={() => openBrokerModal(broker, idx)}>
                                                        <FiEdit2 />
                                                    </button>
                                                    {/* Only show delete if not the default or there are more than one */}
                                                    {(!broker.isDefault || selectedBrokers.length > 1) && (
                                                        <button className="danger" onClick={() => removeBroker(idx)}>
                                                            <FiTrash2 />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    className={styles.addButton}
                                    onClick={() => openBrokerModal()}
                                >
                                    <FiPlus /> Adicionar Corretora
                                </button>

                                <p className={styles.hint}>
                                    💡 Você já tem a "MyWallet Investimentos" como padrão. Adicione outras corretoras se desejar.
                                </p>
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
                bankAccounts={currentProfileContext === 'personal' ? personalBanks : businessBanks}
                onAddNewBank={() => {
                    setReopenCardModal(true);
                    setShowCardModal(false);
                    openBankModal(currentProfileContext);
                }}
            />

            {/* Subscription Modal */}
            <SubscriptionModal
                isOpen={showSubModal}
                onClose={() => { setShowSubModal(false); setEditingSub(null); }}
                onSave={handleSaveSub}
                editingSub={editingSub}
                cards={getCurrentCards()}
            />

            {/* Bank Account Modal */}
            <BankAccountModal
                isOpen={showBankModal}
                onClose={() => { setShowBankModal(false); setEditingBank(null); }}
                onSave={handleSaveBank}
                editingBank={editingBank}
                profileType={currentProfileContext === 'personal' ? 'PERSONAL' : 'BUSINESS'}
            />

            {/* Broker Modal */}
            <BrokerModal
                isOpen={showBrokerModal}
                onClose={() => { setShowBrokerModal(false); setEditingBroker(null); }}
                onSave={handleSaveBroker}
                broker={editingBroker}
            />
        </>
    );
}
