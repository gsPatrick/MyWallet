'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck } from 'react-icons/fi';
import bankAccountService from '@/services/bankAccountService';
import cardBanksData from '@/data/cardBanks.json';
import styles from './BankAccountModal.module.css';

const accountTypes = [
    { value: 'CONTA_CORRENTE', label: 'Conta Corrente' },
    { value: 'CONTA_POUPANCA', label: 'Poupança' },
    { value: 'CONTA_PAGAMENTO', label: 'Conta de Pagamento' },
    { value: 'CONTA_SALARIO', label: 'Conta Salário' },
    { value: 'CARTEIRA', label: 'Carteira / Dinheiro' }
];

export default function BankAccountModal({ isOpen, onClose, onSuccess, initialData = null }) {
    const [loading, setLoading] = useState(false);

    // Prepare bank options from JSON
    const bankOptions = [
        ...Object.entries(cardBanksData.banks).map(([key, data]) => ({
            key,
            ...data
        })),
        {
            key: 'other',
            name: 'Outro',
            color: '#64748b'
        }
    ];

    const [formData, setFormData] = useState({
        bankKey: '',
        nickname: '',
        type: 'CONTA_CORRENTE',
        initialBalance: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Determine bank key from name if possible
                const bankKey = Object.keys(cardBanksData.banks).find(k =>
                    cardBanksData.banks[k].name === initialData.bankName
                ) || 'other';

                setFormData({
                    bankKey,
                    nickname: initialData.nickname || '',
                    type: initialData.type || 'CONTA_CORRENTE',
                    initialBalance: initialData.balance || ''
                });
            } else {
                setFormData({
                    bankKey: '',
                    nickname: '',
                    type: 'CONTA_CORRENTE',
                    initialBalance: ''
                });
            }
        }
    }, [isOpen, initialData]);

    const handleBankSelect = (key) => {
        setFormData(prev => ({ ...prev, bankKey: key }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const bankInfo = cardBanksData.banks[formData.bankKey] || { name: 'Outro', color: '#64748b' };

            const payload = {
                bankName: bankInfo.name,
                nickname: formData.nickname || bankInfo.name,
                type: formData.type,
                balance: parseFloat(formData.initialBalance || 0),
                color: bankInfo.color,
                icon: bankInfo.icon
            };

            if (initialData) {
                await bankAccountService.update(initialData.id, payload);
            } else {
                await bankAccountService.create(payload);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving account:', error);
            alert('Erro ao salvar conta: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.modalOverlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className={styles.modal}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h2>{initialData ? 'Editar Conta' : 'Nova Conta Bancária'}</h2>
                            <button className={styles.closeBtn} onClick={onClose}>
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Bank Selection */}
                            <div className={styles.formGroup}>
                                <label>Banco</label>
                                <div className={styles.bankGrid}>
                                    {bankOptions.slice(0, 12).map((bank) => (
                                        <button
                                            key={bank.key}
                                            type="button"
                                            className={`${styles.bankOption} ${formData.bankKey === bank.key ? styles.selected : ''}`}
                                            style={{ '--bank-color': bank.color }}
                                            onClick={() => handleBankSelect(bank.key)}
                                        >
                                            {bank.icon ? (
                                                <img src={bank.icon} alt={bank.name} />
                                            ) : (
                                                <span className={styles.bankInitial}>{bank.name.charAt(0)}</span>
                                            )}
                                            <span>{bank.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Nickname */}
                            <div className={styles.formGroup}>
                                <label>Apelido (opcional)</label>
                                <input
                                    type="text"
                                    name="nickname"
                                    value={formData.nickname}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Conta Principal, Reserva..."
                                />
                            </div>

                            {/* Account Type */}
                            <div className={styles.formGroup}>
                                <label>Tipo de Conta</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                >
                                    {accountTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {initialData === null && (
                                <div className={styles.formGroup}>
                                    <label>Saldo Inicial</label>
                                    <input
                                        type="number"
                                        name="initialBalance"
                                        value={formData.initialBalance}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                            )}

                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={onClose}>
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={loading}>
                                    <FiCheck /> {initialData ? 'Salvar' : 'Criar Conta'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
