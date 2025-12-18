'use client';

import { useState, useEffect, useMemo } from 'react';
import { FiCreditCard, FiDollarSign, FiSearch, FiX, FiImage } from 'react-icons/fi';
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
];

const defaultForm = {
    name: '',
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

// Helper to format currency (Brazilian format: 1.000,00)
const formatCurrencyInput = (value) => {
    // Remove tudo que não é número
    const onlyNumbers = value.replace(/\D/g, '');

    if (!onlyNumbers) return '';

    // Converte para centavos
    const cents = parseInt(onlyNumbers, 10);

    // Formata com casas decimais
    const formatted = (cents / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return formatted;
};

// Parse formatted value back to number
const parseCurrencyValue = (formatted) => {
    if (!formatted) return 0;
    // Remove pontos e substitui vírgula por ponto
    const number = formatted.replace(/\./g, '').replace(',', '.');
    return parseFloat(number) || 0;
};

export default function CardModal({
    isOpen,
    onClose,
    onSave,
    editingCard = null,
    isLoading = false
}) {
    const [form, setForm] = useState(defaultForm);
    const [showBankGallery, setShowBankGallery] = useState(false);
    const [showBrandGallery, setShowBrandGallery] = useState(false);
    const [bankSearch, setBankSearch] = useState('');
    const [limitTouched, setLimitTouched] = useState(false);

    // Get banks and brands from JSON
    const banks = useMemo(() => {
        return Object.entries(cardData.banks || {}).map(([key, value]) => ({
            key,
            ...value,
        }));
    }, []);

    const brands = useMemo(() => {
        return Object.entries(cardData.brands || {}).map(([key, value]) => ({
            key: key.toUpperCase(),
            ...value,
        }));
    }, []);

    // Filter banks by search
    const filteredBanks = useMemo(() => {
        return banks.filter(bank =>
            bank.name.toLowerCase().includes(bankSearch.toLowerCase())
        );
    }, [banks, bankSearch]);

    useEffect(() => {
        if (editingCard) {
            setForm({
                name: editingCard.name || '',
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
            setForm(defaultForm);
            setLimitTouched(false);
        }
    }, [editingCard, isOpen]);

    const handleSelectBank = (bank) => {
        setForm(prev => ({
            ...prev,
            bankName: bank.name,
            bankIcon: bank.icon,
            color: bank.color, // Auto-set card color from bank
            name: prev.name || bank.name, // Auto-set card name if empty
        }));
        setShowBankGallery(false);
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
            // Auto-fill available limit if not touched
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

    // Get current brand info
    const currentBrand = brands.find(b => b.key === form.brand);

    return (
        <>
            <Modal
                isOpen={isOpen && !showBankGallery && !showBrandGallery}
                onClose={onClose}
                title={editingCard ? 'Editar Cartão' : 'Novo Cartão'}
                size="md"
            >
                <div className={styles.modalForm}>
                    {/* Bank Selection */}
                    <div className={styles.selectionRow}>
                        <div className={styles.selectionItem} onClick={() => setShowBankGallery(true)}>
                            <div className={styles.selectionPreview} style={{ borderColor: form.bankIcon ? form.color : undefined }}>
                                {form.bankIcon ? (
                                    <img src={form.bankIcon} alt={form.bankName} className={styles.selectionIcon} />
                                ) : (
                                    <FiCreditCard className={styles.selectionPlaceholder} />
                                )}
                            </div>
                            <div className={styles.selectionInfo}>
                                <span className={styles.selectionLabel}>Banco</span>
                                <span className={styles.selectionValue}>{form.bankName || 'Selecionar banco'}</span>
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

            {/* Bank Gallery Modal */}
            <Modal
                isOpen={showBankGallery}
                onClose={() => setShowBankGallery(false)}
                title="Selecionar Banco"
                size="lg"
            >
                <div className={styles.galleryContent}>
                    <div className={styles.gallerySearch}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar banco..."
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                        {bankSearch && (
                            <button className={styles.clearSearch} onClick={() => setBankSearch('')}>
                                <FiX />
                            </button>
                        )}
                    </div>

                    <div className={styles.galleryGrid}>
                        {filteredBanks.map(bank => (
                            <button
                                key={bank.key}
                                className={styles.galleryItem}
                                onClick={() => handleSelectBank(bank)}
                                style={{ '--item-color': bank.color }}
                            >
                                <div className={styles.galleryItemIcon}>
                                    {bank.icon ? (
                                        <img src={bank.icon} alt={bank.name} className={styles.galleryIcon} />
                                    ) : (
                                        <div className={styles.galleryIconFallback} style={{ background: bank.color }}>
                                            {bank.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <span className={styles.galleryItemName}>{bank.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className={styles.galleryActions}>
                        <Button variant="secondary" onClick={() => setShowBankGallery(false)}>
                            Cancelar
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
