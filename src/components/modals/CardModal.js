'use client';

import { useState, useEffect, useMemo } from 'react';
import { FiCreditCard, FiDollarSign, FiImage, FiPlus, FiChevronDown } from 'react-icons/fi';
import { BiWallet } from 'react-icons/bi';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import cardData from '@/data/cardBanks.json';
import styles from './CardModal.module.css';

const cardColors = [
    { name: 'Midnight', value: '#1a1a2e' },
    { name: 'Navy', value: '#16213e' },
    { name: 'Slate', value: '#334155' },
    { name: 'Indigo', value: '#312e81' },
    { name: 'Purple', value: '#581c87' },
    { name: 'Rose', value: '#881337' },
    { name: 'Gold', value: '#78350f' },
    { name: 'Emerald', value: '#064e3b' },
    { name: 'Blue', value: '#1e40af' },
    { name: 'Red', value: '#991b1b' },
    { name: 'Prata', value: '#e4e3e4' },
    { name: 'Grafite', value: '#535151' },
    { name: 'Black', value: '#020202' },
];

const defaultForm = {
    name: '',
    bankAccountId: null,
    bankName: '',
    bankIcon: '',
    brand: 'VISA',
    brandIcon: '',
    lastFourDigits: '',
    creditLimit: '',
    availableLimit: '',
    closingDay: '',
    dueDay: '',
    color: '#1a1a2e',
    holderName: '',
};

// Helper to format currency (Brazilian format: 1.000,00) - allows typing comma
const formatCurrencyInput = (value) => {
    // Remove everything except digits and comma
    let cleaned = value.replace(/[^\d,]/g, '');

    // Split by comma (take first occurrence only)
    const parts = cleaned.split(',');
    let integerPart = parts[0] || '';
    let decimalPart = parts[1] || '';

    // Remove leading zeros from integer part (but keep at least one digit)
    integerPart = integerPart.replace(/^0+/, '') || '';

    // Limit decimal to 2 digits
    decimalPart = decimalPart.slice(0, 2);

    // Add thousand separators to integer part
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // If user typed comma, show decimal part (even if empty)
    if (value.includes(',')) {
        return `${integerPart},${decimalPart}`;
    }

    return integerPart;
};

// Parse formatted value back to number
const parseCurrencyValue = (formatted) => {
    if (!formatted) return 0;
    // Remove thousand separators (dots) and replace comma with dot for parsing
    const number = formatted.replace(/\./g, '').replace(',', '.');
    return parseFloat(number) || 0;
};

export default function CardModal({
    isOpen,
    onClose,
    onSave,
    editingCard = null,
    isLoading = false,
    bankAccounts = [], // NEW: List of user's bank accounts
    onAddNewBank = null, // NEW: Callback to open bank creation modal
}) {
    const [form, setForm] = useState(defaultForm);
    const [showBrandGallery, setShowBrandGallery] = useState(false);
    const [showBankDropdown, setShowBankDropdown] = useState(false);
    const [limitTouched, setLimitTouched] = useState(false);

    // Get brands from JSON
    const brands = useMemo(() => {
        return Object.entries(cardData.brands || {}).map(([key, value]) => ({
            key: key.toUpperCase(),
            ...value,
        }));
    }, []);

    useEffect(() => {
        if (editingCard) {
            setForm({
                name: editingCard.name || '',
                bankAccountId: editingCard.bankAccountId || null,
                bankName: editingCard.bankName || '',
                bankIcon: editingCard.bankIcon || '',
                brand: editingCard.brand || 'VISA',
                brandIcon: editingCard.brandIcon || '',
                lastFourDigits: editingCard.lastFourDigits || '',
                creditLimit: editingCard.creditLimit ? formatCurrencyInput((editingCard.creditLimit * 100).toString()) : '',
                availableLimit: editingCard.availableLimit ? formatCurrencyInput((editingCard.availableLimit * 100).toString()) : '',
                closingDay: editingCard.closingDay?.toString() || '',
                dueDay: editingCard.dueDay?.toString() || '',
                color: editingCard.color || '#1a1a2e',
                holderName: editingCard.holderName || '',
            });
            setLimitTouched(editingCard.creditLimit !== editingCard.availableLimit);
        } else {
            // Auto-select default bank account if available
            const defaultBank = bankAccounts.find(b => b.isDefault) || bankAccounts[0];
            if (defaultBank) {
                setForm({
                    ...defaultForm,
                    bankAccountId: defaultBank.id || defaultBank._index,
                    bankName: defaultBank.nickname || defaultBank.bankName,
                    bankIcon: defaultBank.icon || null,
                    color: defaultBank.color || '#1a1a2e',
                    name: '',
                });
            } else {
                setForm(defaultForm);
            }
            setLimitTouched(false);
        }
    }, [editingCard, isOpen, bankAccounts]);

    const handleSelectBankAccount = (account, idx) => {
        setForm(prev => ({
            ...prev,
            bankAccountId: account.id || idx,
            bankName: account.nickname || account.bankName,
            bankIcon: account.icon || null,
            color: account.color || prev.color,
            name: prev.name || account.nickname || account.bankName,
        }));
        setShowBankDropdown(false);
    };

    const handleSelectBrand = (brand) => {
        setForm(prev => ({
            ...prev,
            brand: brand.key,
            brandIcon: brand.icon,
        }));
        setShowBrandGallery(false);
    };

    const handleCreditLimitChange = (e) => {
        const formatted = formatCurrencyInput(e.target.value);
        setForm(prev => ({
            ...prev,
            creditLimit: formatted,
            availableLimit: !limitTouched ? formatted : prev.availableLimit,
        }));
    };

    const handleAvailableLimitChange = (e) => {
        setLimitTouched(true);
        setForm(prev => ({
            ...prev,
            availableLimit: formatCurrencyInput(e.target.value),
        }));
    };

    const handleSave = () => {
        const payload = {
            name: form.name,
            bankAccountId: form.bankAccountId,
            bankName: form.bankName,
            bankIcon: form.bankIcon,
            brand: form.brand,
            brandIcon: form.brandIcon,
            lastFourDigits: form.lastFourDigits,
            creditLimit: parseCurrencyValue(form.creditLimit),
            availableLimit: parseCurrencyValue(form.availableLimit),
            closingDay: parseInt(form.closingDay) || 1,
            dueDay: parseInt(form.dueDay) || 10,
            color: form.color,
            holderName: form.holderName,
        };
        onSave?.(payload, editingCard?.id);
    };

    const handleAddNewBank = () => {
        setShowBankDropdown(false);
        onAddNewBank?.();
    };

    // Get current brand info
    const currentBrand = brands.find(b => b.key === form.brand);

    // Get selected bank account for display
    const selectedBankAccount = bankAccounts.find(
        (b, idx) => (b.id || idx) === form.bankAccountId
    ) || bankAccounts.find(b => b.isDefault) || bankAccounts[0];

    return (
        <>
            <Modal
                isOpen={isOpen && !showBrandGallery}
                onClose={onClose}
                title={editingCard ? 'Editar Cartão' : 'Novo Cartão'}
                size="md"
            >
                <div className={styles.modalForm}>
                    {/* Bank Account Selection */}
                    <div className={styles.selectionRow}>
                        <div className={styles.selectionItem}>
                            <div className={styles.selectionInfo}>
                                <span className={styles.selectionLabel}>Conta Vinculada</span>
                            </div>
                            <div className={styles.bankAccountSelector}>
                                <button
                                    type="button"
                                    className={styles.bankAccountButton}
                                    onClick={() => setShowBankDropdown(!showBankDropdown)}
                                >
                                    {selectedBankAccount?.icon ? (
                                        <img
                                            src={selectedBankAccount.icon}
                                            alt={selectedBankAccount.bankName}
                                            className={styles.bankAccountIcon}
                                        />
                                    ) : (
                                        <div
                                            className={styles.bankAccountIconFallback}
                                            style={{ background: selectedBankAccount?.color || form.color || '#6366F1' }}
                                        >
                                            <BiWallet />
                                        </div>
                                    )}
                                    <span className={styles.bankAccountName}>
                                        {form.bankName || selectedBankAccount?.nickname || 'Selecionar conta'}
                                    </span>
                                    <FiChevronDown className={`${styles.chevron} ${showBankDropdown ? styles.open : ''}`} />
                                </button>

                                {/* Dropdown */}
                                {showBankDropdown && (
                                    <div className={styles.bankDropdown}>
                                        {bankAccounts.length > 0 ? (
                                            <>
                                                {bankAccounts.map((account, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        className={`${styles.bankDropdownItem} ${(account.id || idx) === form.bankAccountId ? styles.selected : ''
                                                            }`}
                                                        onClick={() => handleSelectBankAccount(account, idx)}
                                                    >
                                                        {account.icon ? (
                                                            <img src={account.icon} alt={account.bankName} className={styles.dropdownIcon} />
                                                        ) : (
                                                            <div
                                                                className={styles.dropdownIconFallback}
                                                                style={{ background: account.color || '#6366F1' }}
                                                            >
                                                                <BiWallet />
                                                            </div>
                                                        )}
                                                        <span>{account.nickname || account.bankName}</span>
                                                        {account.isDefault && <span className={styles.defaultBadge}>Padrão</span>}
                                                    </button>
                                                ))}
                                            </>
                                        ) : (
                                            <div className={styles.emptyDropdown}>
                                                Nenhuma conta cadastrada
                                            </div>
                                        )}

                                        {/* Add New Bank Button */}
                                        {onAddNewBank && (
                                            <button
                                                type="button"
                                                className={styles.addNewBankButton}
                                                onClick={handleAddNewBank}
                                            >
                                                <FiPlus />
                                                <span>Adicionar Nova Conta</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.selectionItem} onClick={() => setShowBrandGallery(true)}>
                            <div className={styles.selectionPreview}>
                                {currentBrand?.icon ? (
                                    <img src={currentBrand.icon} alt={currentBrand.name} className={styles.selectionIcon} />
                                ) : (
                                    <FiImage className={styles.selectionPlaceholder} />
                                )}
                            </div>
                            <div className={styles.selectionInfo}>
                                <span className={styles.selectionLabel}>Bandeira</span>
                                <span className={styles.selectionValue}>{currentBrand?.name || form.brand}</span>
                            </div>
                        </div>
                    </div>

                    <Input
                        label="Nome do Cartão"
                        placeholder="Ex: Nubank Platinum"
                        leftIcon={<FiCreditCard />}
                        value={form.name}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                        fullWidth
                    />

                    <div className={styles.formRow}>
                        <Input
                            label="Últimos 4 dígitos"
                            placeholder="0000"
                            maxLength={4}
                            value={form.lastFourDigits}
                            onChange={(e) => setForm(prev => ({ ...prev, lastFourDigits: e.target.value.replace(/\D/g, '') }))}
                        />
                        <Input
                            label="Nome do Titular"
                            placeholder="NOME"
                            value={form.holderName}
                            onChange={(e) => setForm(prev => ({ ...prev, holderName: e.target.value.toUpperCase() }))}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <Input
                            label="Limite Total"
                            placeholder="10.000,00"
                            leftIcon={<FiDollarSign />}
                            value={form.creditLimit}
                            onChange={handleCreditLimitChange}
                        />
                        <Input
                            label="Limite Disponível"
                            placeholder="10.000,00"
                            leftIcon={<FiDollarSign />}
                            value={form.availableLimit}
                            onChange={handleAvailableLimitChange}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <Input
                            label="Dia de Fechamento"
                            placeholder="15"
                            type="number"
                            min="1"
                            max="31"
                            value={form.closingDay}
                            onChange={(e) => setForm(prev => ({ ...prev, closingDay: e.target.value }))}
                        />
                        <Input
                            label="Dia de Vencimento"
                            placeholder="25"
                            type="number"
                            min="1"
                            max="31"
                            value={form.dueDay}
                            onChange={(e) => setForm(prev => ({ ...prev, dueDay: e.target.value }))}
                        />
                    </div>

                    <div className={styles.colorPicker}>
                        <label className={styles.inputLabel}>Cor do Cartão</label>
                        <div className={styles.colorOptions}>
                            {cardColors.map(c => (
                                <button
                                    key={c.value}
                                    className={`${styles.colorOption} ${form.color === c.value ? styles.selected : ''}`}
                                    style={{ background: c.value }}
                                    onClick={() => setForm(prev => ({ ...prev, color: c.value }))}
                                    title={c.name}
                                    type="button"
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <Button variant="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading || !form.name || !form.bankName}>
                            {isLoading ? 'Salvando...' : editingCard ? 'Salvar' : 'Criar Cartão'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Brand Gallery Modal */}
            <Modal
                isOpen={showBrandGallery}
                onClose={() => setShowBrandGallery(false)}
                title="Selecionar Bandeira"
                size="md"
            >
                <div className={styles.galleryContent}>
                    <div className={styles.brandGrid}>
                        {brands.map(brand => (
                            <button
                                key={brand.key}
                                className={`${styles.brandItem} ${form.brand === brand.key ? styles.selected : ''}`}
                                onClick={() => handleSelectBrand(brand)}
                                style={{ '--brand-color': brand.color }}
                            >
                                <div className={styles.brandIcon}>
                                    {brand.icon ? (
                                        <img src={brand.icon} alt={brand.name} className={styles.brandImage} />
                                    ) : (
                                        <span>{brand.name}</span>
                                    )}
                                </div>
                                <span className={styles.brandName}>{brand.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className={styles.galleryActions}>
                        <Button variant="secondary" onClick={() => setShowBrandGallery(false)}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
