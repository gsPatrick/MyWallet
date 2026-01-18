'use client';

/**
 * BankAccountModal
 * ========================================
 * Modal for creating/editing bank accounts during onboarding
 * Uses cardBanks.json for bank dictionary
 * ========================================
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiDollarSign } from 'react-icons/fi';
import { BiWallet } from 'react-icons/bi';
import cardBanksData from '@/data/cardBanks.json';
import styles from './BankAccountModal.module.css';

// Convert banks object to array
const banksArray = cardBanksData?.banks
    ? Object.entries(cardBanksData.banks).map(([key, bank]) => ({
        key,
        ...bank
    }))
    : [];

// Fixed color palette
const COLOR_PALETTE = [
    '#820AD1', // Nubank purple
    '#EC7000', // Itau orange
    '#CC092F', // Bradesco red
    '#EC0000', // Santander red
    '#FFCC00', // BB yellow
    '#005CA9', // Caixa blue
    '#FF7A00', // Inter orange
    '#242424', // C6 black
    '#6366F1', // Primary purple
    '#10B981', // Green
    '#3B82F6', // Blue
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#6B7280', // Gray (for wallets)
];

// Currency input helper - allows free typing with comma/period
const handleCurrencyInput = (value) => {
    // Allow digits, comma, and period
    let cleaned = value.replace(/[^\d.,]/g, '');

    // Replace period with comma (Brazilian format)
    cleaned = cleaned.replace(/\./g, ',');

    // Only allow one comma
    const firstCommaIndex = cleaned.indexOf(',');
    if (firstCommaIndex !== -1) {
        const beforeComma = cleaned.slice(0, firstCommaIndex + 1);
        const afterComma = cleaned.slice(firstCommaIndex + 1).replace(/,/g, '');
        cleaned = beforeComma + afterComma.slice(0, 2);
    }

    return cleaned;
};

// Format currency for display
const formatCurrencyDisplay = (value) => {
    if (!value) return '';
    const parts = value.split(',');
    let integerPart = parts[0]?.replace(/^0+/, '') || '0';
    const decimalPart = parts[1] || '';
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return value.includes(',') ? `${integerPart},${decimalPart}` : integerPart;
};

const parseCurrencyValue = (maskedValue) => {
    if (!maskedValue) return 0;
    const normalized = maskedValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
};

export default function BankAccountModal({
    isOpen,
    onClose,
    onSave,
    editingBank = null,
    profileType = 'PERSONAL' // 'PERSONAL' or 'BUSINESS'
}) {
    const [selectedBankKey, setSelectedBankKey] = useState('');
    const [nickname, setNickname] = useState('');
    const [balance, setBalance] = useState('');
    const [color, setColor] = useState('#6366F1');
    const [isCustom, setIsCustom] = useState(false);

    useEffect(() => {
        if (editingBank) {
            setSelectedBankKey(editingBank.bankKey || '');
            setNickname(editingBank.nickname || '');
            setBalance(editingBank.balance ? editingBank.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
            setColor(editingBank.color || '#6366F1');
            setIsCustom(editingBank.isCustom || false);
        } else {
            // Reset form
            setSelectedBankKey('');
            setNickname('');
            setBalance('');
            setColor(profileType === 'BUSINESS' ? '#10B981' : '#6366F1');
            setIsCustom(false);
        }
    }, [editingBank, isOpen, profileType]);

    const handleSelectBank = (bank) => {
        setSelectedBankKey(bank.key);
        setColor(bank.color);
        if (!nickname) {
            setNickname(bank.name);
        }
        setIsCustom(false);
    };

    const handleSelectCustom = () => {
        setSelectedBankKey('custom');
        setIsCustom(true);
        if (!nickname) {
            setNickname(profileType === 'BUSINESS' ? 'MyWallet (Empresa)' : 'MyWallet (Pessoal)');
        }
    };

    const handleSave = () => {
        const selectedBank = banksArray.find(b => b.key === selectedBankKey);

        const bankData = {
            bankKey: selectedBankKey || 'custom',
            bankName: selectedBank?.name || 'Carteira',
            nickname: nickname || selectedBank?.name || 'Minha Conta',
            icon: selectedBank?.icon || null,
            color: color,
            balance: parseCurrencyValue(balance),
            isCustom: isCustom,
            _index: editingBank?._index
        };

        onSave(bankData);
        onClose();
    };

    const handleCurrencyChange = (e) => {
        const cleaned = handleCurrencyInput(e.target.value);
        setBalance(cleaned);
    };

    const handleBalanceBlur = () => {
        const formatted = formatCurrencyDisplay(balance);
        setBalance(formatted);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className={styles.modal}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={styles.header}>
                        <h3>{editingBank ? 'Editar Banco' : 'Adicionar Banco'}</h3>
                        <button className={styles.closeBtn} onClick={onClose}>
                            <FiX />
                        </button>
                    </div>

                    <div className={styles.content}>
                        {/* Bank Selection Grid */}
                        <div className={styles.section}>
                            <label>Selecione o Banco</label>
                            <div className={styles.bankGrid}>
                                {/* Custom Wallet Option */}
                                <button
                                    type="button"
                                    className={`${styles.bankCard} ${selectedBankKey === 'custom' ? styles.selected : ''}`}
                                    onClick={handleSelectCustom}
                                    style={{ '--bank-color': '#6B7280' }}
                                >
                                    <div className={styles.bankIcon} style={{ background: '#6B7280' }}>
                                        <BiWallet />
                                    </div>
                                    <span>Carteira</span>
                                    {selectedBankKey === 'custom' && (
                                        <div className={styles.checkmark}><FiCheck /></div>
                                    )}
                                </button>

                                {/* Banks from dictionary */}
                                {banksArray.map((bank) => (
                                    <button
                                        key={bank.key}
                                        type="button"
                                        className={`${styles.bankCard} ${selectedBankKey === bank.key ? styles.selected : ''}`}
                                        onClick={() => handleSelectBank(bank)}
                                        style={{ '--bank-color': bank.color }}
                                    >
                                        {bank.icon ? (
                                            <img src={bank.icon} alt={bank.name} className={styles.bankLogo} />
                                        ) : (
                                            <div className={styles.bankIcon} style={{ background: bank.color }}>
                                                <BiWallet />
                                            </div>
                                        )}
                                        <span>{bank.name}</span>
                                        {selectedBankKey === bank.key && (
                                            <div className={styles.checkmark}><FiCheck /></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Nickname */}
                        <div className={styles.inputGroup}>
                            <label>Apelido da Conta</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="Ex: Conta Principal, Reserva..."
                            />
                        </div>

                        {/* Color Picker (Fixed Palette) */}
                        <div className={styles.section}>
                            <label>Cor</label>
                            <div className={styles.colorPalette}>
                                {COLOR_PALETTE.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`${styles.colorBtn} ${color === c ? styles.selectedColor : ''}`}
                                        style={{ background: c }}
                                        onClick={() => setColor(c)}
                                    >
                                        {color === c && <FiCheck />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Initial Balance */}
                        <div className={styles.inputGroup}>
                            <label>Saldo Inicial</label>
                            <div className={styles.currencyInput}>
                                <span>R$</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={balance}
                                    onChange={handleCurrencyChange}
                                    onBlur={handleBalanceBlur}
                                    placeholder="0,00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button className={styles.cancelBtn} onClick={onClose}>
                            Cancelar
                        </button>
                        <button
                            className={styles.saveBtn}
                            onClick={handleSave}
                            disabled={!selectedBankKey}
                        >
                            <FiCheck /> {editingBank ? 'Salvar' : 'Adicionar'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
