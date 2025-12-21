'use client';

import { useState, useEffect } from 'react';
import { FiTarget, FiDollarSign, FiCalendar } from 'react-icons/fi';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { goalsAPI, budgetsAPI } from '@/services/api';
import bankAccountService from '@/services/bankAccountService';
import styles from './QuickGoalModal.module.css';

const goalColors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function QuickGoalModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        targetAmount: '',
        currentAmount: '0',
        deadline: '',
        priority: 'MEDIUM',
        color: '#6366f1',
        bankAccountId: '',
        isInfinite: false,
        budgetAllocationId: '',
    });

    const [bankAccounts, setBankAccounts] = useState([]);
    const [budgetAllocations, setBudgetAllocations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Format helpers
    const formatCurrencyBR = (value) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const parseBRCurrency = (str) => {
        if (!str) return 0;
        const cleaned = str.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.').trim();
        return parseFloat(cleaned) || 0;
    };
    const formatInputBR = (value) => {
        const digits = value.replace(/\D/g, '');
        const amount = parseInt(digits || '0') / 100;
        return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleFormAmountChange = (field, value) => {
        const formatted = formatInputBR(value);
        setFormData(prev => ({ ...prev, [field]: formatted }));
    };

    // Load data when modal opens
    useEffect(() => {
        if (isOpen && !dataLoaded) {
            loadData();
        }
    }, [isOpen, dataLoaded]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                targetAmount: '',
                currentAmount: '0',
                deadline: '',
                priority: 'MEDIUM',
                color: '#6366f1',
                bankAccountId: '',
                isInfinite: false,
                budgetAllocationId: '',
            });
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            const [bankAccountsRes, allocationsRes] = await Promise.all([
                bankAccountService.list(),
                budgetsAPI.getCurrentAllocations().catch(() => ({ data: { allocations: [] } }))
            ]);
            setBankAccounts(bankAccountsRes?.data || bankAccountsRes || []);
            setBudgetAllocations(allocationsRes?.data?.allocations || []);
            setDataLoaded(true);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert('Nome da meta é obrigatório');
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                ...formData,
                targetAmount: formData.isInfinite ? null : parseBRCurrency(formData.targetAmount),
                currentAmount: parseBRCurrency(formData.currentAmount),
                category: 'OTHER',
                deadline: formData.deadline || null,
                bankAccountId: formData.bankAccountId || null,
                budgetAllocationId: formData.budgetAllocationId || null,
            };

            await goalsAPI.create(payload);
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar meta: " + (error.response?.data?.error || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Nova Meta"
            size="md"
        >
            <div className={styles.modalForm}>
                <Input
                    label="Nome da Meta"
                    placeholder="Ex: Viagem para Europa"
                    leftIcon={<FiTarget />}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    fullWidth
                />

                {/* Caixinha Toggle */}
                <div className={styles.infiniteToggle}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={formData.isInfinite}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                isInfinite: e.target.checked,
                                targetAmount: e.target.checked ? '' : prev.targetAmount
                            }))}
                        />
                        <span className={styles.checkboxText}>
                            💰 Meta sem valor fixo (Caixinha)
                        </span>
                    </label>
                </div>

                <div className={styles.formRow}>
                    {!formData.isInfinite && (
                        <Input
                            label="Valor Objetivo"
                            type="text"
                            placeholder="0,00"
                            leftIcon={<FiDollarSign />}
                            value={formData.targetAmount}
                            onChange={(e) => handleFormAmountChange('targetAmount', e.target.value)}
                        />
                    )}
                    <Input
                        label="Valor Atual"
                        type="text"
                        placeholder="0,00"
                        leftIcon={<FiDollarSign />}
                        value={formData.currentAmount}
                        onChange={(e) => handleFormAmountChange('currentAmount', e.target.value)}
                        style={formData.isInfinite ? { flex: 1 } : {}}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Prazo</label>
                    <Input
                        type="date"
                        leftIcon={<FiCalendar />}
                        value={formData.deadline}
                        onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                </div>

                {/* Bank Account Selection */}
                {bankAccounts.length > 0 && (
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>💳 Conta Bancária Vinculada</label>
                        <select
                            className={styles.selectInput}
                            value={formData.bankAccountId}
                            onChange={(e) => setFormData(prev => ({ ...prev, bankAccountId: e.target.value }))}
                        >
                            <option value="">Nenhuma conta vinculada</option>
                            {bankAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.nickname || acc.bankName} - {formatCurrency(acc.balance || 0)}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Budget Allocation Link */}
                {budgetAllocations.length > 0 && (
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>🎯 Vincular ao Orçamento</label>
                        <select
                            className={styles.selectInput}
                            value={formData.budgetAllocationId}
                            onChange={(e) => setFormData(prev => ({ ...prev, budgetAllocationId: e.target.value }))}
                        >
                            <option value="">Nenhum</option>
                            {budgetAllocations.map(alloc => (
                                <option key={alloc.id} value={alloc.id}>
                                    {alloc.name} ({alloc.percentage}%)
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Prioridade</label>
                        <select
                            className={styles.selectInput}
                            value={formData.priority}
                            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                        >
                            <option value="LOW">Baixa</option>
                            <option value="MEDIUM">Média</option>
                            <option value="HIGH">Alta</option>
                        </select>
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Cor</label>
                        <div className={styles.colorPicker}>
                            {goalColors.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`${styles.colorBtn} ${formData.color === color ? styles.active : ''}`}
                                    style={{ background: color }}
                                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? 'Salvando...' : 'Criar Meta'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
