'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    FiPlus, FiTarget, FiCalendar, FiTrendingUp, FiEdit2, FiTrash2,
    FiDollarSign, FiFlag, FiLink, FiHome, FiLoader, FiAlertCircle, FiClock
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import GhostGoal from '@/components/ui/GhostGoal';
import GoalDetailsModal from '@/components/goals/GoalDetailsModal'; // Added import
import GoalHistoryModal from '@/components/goals/GoalHistoryModal'; // Added Import
import { usePrivateCurrency } from '@/components/ui/PrivateValue';
import { formatDate } from '@/utils/formatters';
import { goalsAPI, openFinanceAPI, budgetsAPI } from '@/services/api';
import styles from './page.module.css';

const goalColors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
// Mapeamento de categorias frontend para backend
const reverseCategoryMap = {
    'Viagem': 'TRAVEL',
    'Educação': 'EDUCATION',
    'Compras': 'SHOPPING',
    'Investimentos': 'INVESTMENT',
    'Emergência': 'EMERGENCY_FUND',
    'Imóvel': 'PROPERTY',
    'Veículo': 'VEHICLE',
    'Aposentadoria': 'RETIREMENT',
    'Outros': 'OTHER'
};

const categoryMap = Object.entries(reverseCategoryMap).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {});

const categories = Object.keys(reverseCategoryMap);


export default function GoalsPage() {
    // URL params for auto-open modal
    const searchParams = useSearchParams();

    // Privacy-aware formatting
    const { formatCurrency } = usePrivateCurrency();

    const [goals, setGoals] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [budgetAllocations, setBudgetAllocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState(null); // For Details Modal
    const [formData, setFormData] = useState({
        name: '',
        targetAmount: '', // Formatted string
        currentAmount: '', // Formatted string
        deadline: '',
        deadline: '',
        // category: '', // Removed from UI
        priority: 'MEDIUM',
        color: '#6366f1',
        storageType: 'manual',
        linkedAccountId: '',
        manualBank: '',
        isInfinite: false, // Caixinha mode
        budgetAllocationId: '', // Vínculo ao orçamento
    });

    // Quick Value Update State
    const [valueModal, setValueModal] = useState({ show: false, goal: null, type: 'add', amount: '' });

    // History Modal State
    const [historyModal, setHistoryModal] = useState({ show: false, goal: null });

    // Format helpers (Reused)
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

    // Auto-open modal from URL param
    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            setShowModal(true);
        }
    }, [searchParams]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [goalsRes, accountsRes, allocationsRes] = await Promise.all([
                goalsAPI.list(),
                openFinanceAPI.listAccounts(),
                budgetsAPI.getCurrentAllocations().catch(() => ({ data: { allocations: [] } }))
            ]);
            setGoals(goalsRes);
            setAccounts(accountsRes || []);
            setBudgetAllocations(allocationsRes?.data?.allocations || []);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const totalGoals = goals.reduce((sum, g) => sum + parseFloat(g.targetAmount), 0);
    const totalProgress = goals.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0);

    const getLinkedAccount = (accountId) => accounts.find(a => a.id === accountId);

    const openModal = (goal = null) => {
        if (goal) {
            setEditingGoal(goal);
            setFormData({
                name: goal.name,
                targetAmount: formatCurrencyBR(parseFloat(goal.targetAmount || 0)),
                currentAmount: formatCurrencyBR(parseFloat(goal.currentAmount)),
                deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
                category: categoryMap[goal.category] || 'Outros',
                priority: goal.priority,
                color: goal.color,
                storageType: goal.storageType || 'manual',
                linkedAccountId: goal.linkedAccountId || '',
                manualBank: goal.manualBank || '',
                isInfinite: goal.isInfinite || false,
                budgetAllocationId: goal.budgetAllocationId || '',
            });
        } else {
            setEditingGoal(null);
            setFormData({
                name: '',
                targetAmount: '',
                currentAmount: '0',
                deadline: '',
                targetAmount: '',
                currentAmount: '0',
                deadline: '',
                // category: '',
                priority: 'MEDIUM',
                color: '#6366f1',
                storageType: 'manual',
                linkedAccountId: '',
                manualBank: '',
                isInfinite: false,
                budgetAllocationId: '',
            });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...formData,
                targetAmount: formData.isInfinite ? null : parseBRCurrency(formData.targetAmount),
                currentAmount: parseBRCurrency(formData.currentAmount),
                targetAmount: formData.isInfinite ? null : parseBRCurrency(formData.targetAmount),
                currentAmount: parseBRCurrency(formData.currentAmount),
                category: 'OTHER', // Default since UI removed
                deadline: formData.deadline || null,
                linkedAccountId: formData.linkedAccountId || null,
                budgetAllocationId: formData.budgetAllocationId || null,
            };

            if (editingGoal) {
                await goalsAPI.update(editingGoal.id, payload);
            } else {
                await goalsAPI.create(payload);
            }
            setShowModal(false);
            loadData();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar meta: " + (error.response?.data?.error || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Tem certeza que deseja excluir esta meta?")) {
            try {
                await goalsAPI.delete(id);
                loadData();
            } catch (error) {
                console.error("Erro ao excluir:", error);
            }
        }
    };

    const handleAddValue = async (goal, val) => {
        try {
            await goalsAPI.transaction(goal.id, {
                amount: val,
                type: 'DEPOSIT',
                reason: 'Depósito manual'
            });
            loadData();
            setSelectedGoal(prev => prev ? ({ ...prev, currentAmount: prev.currentAmount + val }) : null);
        } catch (error) {
            console.error("Erro ao adicionar valor:", error);
            alert("Erro ao atualizar saldo: " + (error.response?.data?.error || error.message));
        }
    };

    const handleRemoveValue = async (goal, val, reason) => {
        try {
            await goalsAPI.transaction(goal.id, {
                amount: val,
                type: 'WITHDRAW',
                reason: reason || 'Resgate manual'
            });
            loadData();
            setSelectedGoal(prev => prev ? ({ ...prev, currentAmount: prev.currentAmount - val }) : null); // Update if open
            setValueModal({ show: false, goal: null, type: 'add', amount: '' }); // Close modal
        } catch (error) {
            console.error("Erro ao resgatar valor:", error);
            alert("Erro ao atualizar saldo: " + (error.response?.data?.error || error.message));
        }
    };

    const submitValueUpdate = async () => {
        const val = parseBRCurrency(valueModal.amount);
        if (val <= 0) return;

        try {
            if (valueModal.type === 'add') {
                await goalsAPI.transaction(valueModal.goal.id, {
                    amount: val,
                    type: 'DEPOSIT',
                    reason: 'Depósito Rápido'
                });
            } else {
                await goalsAPI.transaction(valueModal.goal.id, {
                    amount: val,
                    type: 'WITHDRAW',
                    reason: 'Resgate Rápido'
                });
            }
            loadData();
            setValueModal({ show: false, goal: null, type: 'add', amount: '' });
        } catch (error) {
            console.error("Erro ao atualizar valor:", error);
            alert("Erro ao atualizar saldo: " + (error.response?.data?.error || error.message));
        }
    };

    // --- RENDER HELPERS ---

    const renderLoading = () => (
        <div className={styles.loadingContainer}>
            <FiLoader className={styles.spinner} />
            <p>Carregando suas metas...</p>
        </div>
    );

    const renderEmpty = () => (
        <div className={styles.emptyContainer}>
            <div className={styles.emptyHeader}>
                <FiTarget className={styles.emptyIcon} />
                <h3>Comece a planejar seus sonhos</h3>
                <p>Crie sua primeira meta financeira</p>
            </div>
            {/* Ghost Goal Card - looks like a real goal */}
            <div className={styles.ghostGoalContainer}>
                <GhostGoal onClick={() => openModal()} />
            </div>
        </div>
    );

    if (isLoading) return (
        <div className={styles.pageWrapper}>
            <Header />
            <main className={styles.main}>{renderLoading()}</main>
            <Dock />
        </div>
    );

    return (
        <div className={styles.pageWrapper}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    <motion.div
                        className={styles.pageHeader}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className={styles.headerText}>
                            <h1 className={styles.pageTitle}>Metas Financeiras</h1>
                            <p className={styles.pageSubtitle}>Acompanhe o progresso das suas conquistas</p>
                        </div>
                        <Button leftIcon={<FiPlus />} onClick={() => openModal()}>
                            Nova Meta
                        </Button>
                    </motion.div>

                    {/* Summary - Only show if there are goals */}
                    {goals.length > 0 && (
                        <motion.div
                            className={styles.summaryRow}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card variant="glass" className={styles.summaryCard}>
                                <FiTarget className={styles.summaryIcon} />
                                <div>
                                    <span className={styles.summaryLabel}>Total das Metas</span>
                                    <span className={styles.summaryValue}>{formatCurrency(totalGoals)}</span>
                                </div>
                            </Card>
                            <Card variant="glass" className={styles.summaryCard}>
                                <FiTrendingUp className={styles.summaryIcon} style={{ color: 'var(--accent-success)' }} />
                                <div>
                                    <span className={styles.summaryLabel}>Total Acumulado</span>
                                    <span className={styles.summaryValue}>{formatCurrency(totalProgress)}</span>
                                </div>
                            </Card>
                            <Card variant="glass" className={styles.summaryCard}>
                                <div className={styles.progressCircle}>
                                    <span>{totalGoals > 0 ? ((totalProgress / totalGoals) * 100).toFixed(0) : 0}%</span>
                                </div>
                                <div>
                                    <span className={styles.summaryLabel}>Progresso Geral</span>
                                    <span className={styles.summaryValue}>{formatCurrency(Math.max(0, totalGoals - totalProgress))}</span>
                                    <span className={styles.summarySubtext}>restante</span>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Goals Grid */}
                    {goals.length === 0 ? renderEmpty() : (
                        <motion.div className={styles.goalsGrid}>
                            {goals.map((goal, index) => {
                                const current = parseFloat(goal.currentAmount);
                                const target = parseFloat(goal.targetAmount);
                                const progress = target > 0 ? (current / target) * 100 : 0;
                                const remaining = Math.max(0, target - current);

                                let daysLeftText = 'Sem data';
                                if (goal.deadline) {
                                    const diff = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                                    daysLeftText = diff > 0 ? `${diff} dias restantes` : 'Prazo vencido';
                                }

                                const linkedAccount = goal.linkedAccountId ? getLinkedAccount(goal.linkedAccountId) : null;

                                return (
                                    <motion.div
                                        key={goal.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * (index + 1) }}
                                        className={styles.goalCardWrapper} // Added wrapper class for hover effects maybe?
                                    >
                                        <Card
                                            className={styles.goalCard}
                                            onClick={() => setSelectedGoal(goal)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className={styles.goalHeader}>
                                                <div
                                                    className={styles.goalIcon}
                                                    style={{ background: `${goal.color || '#6366f1'}15`, color: goal.color || '#6366f1' }}
                                                >
                                                    <FiTarget />
                                                </div>
                                                <div className={styles.goalInfo}>
                                                    <span className={styles.goalName}>{goal.name}</span>
                                                    <span className={styles.goalCategory}>{categoryMap[goal.category] || goal.category}</span>
                                                </div>
                                                <div className={styles.goalActions}>
                                                    <button
                                                        className={styles.actionBtn}
                                                        onClick={(e) => { e.stopPropagation(); openModal(goal); }}
                                                        title="Editar"
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                    <button
                                                        className={styles.actionBtn}
                                                        onClick={(e) => { e.stopPropagation(); setHistoryModal({ show: true, goal: goal }); }}
                                                        title="Histórico"
                                                    >
                                                        <FiClock />
                                                    </button>
                                                    <div className={styles.quickActions}>
                                                        <button
                                                            className={`${styles.miniBtn} ${styles.addBtn}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setValueModal({ show: true, goal: goal, type: 'add', amount: '' });
                                                            }}
                                                            title="Adicionar Valor"
                                                        >
                                                            +
                                                        </button>
                                                        <button
                                                            className={`${styles.miniBtn} ${styles.removeBtn}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setValueModal({ show: true, goal: goal, type: 'remove', amount: '' });
                                                            }}
                                                            title="Retirar Valor"
                                                        >
                                                            -
                                                        </button>
                                                    </div>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.danger}`}
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(goal.id); }}
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>

                                            <span className={`${styles.priorityBadge} ${styles[goal.priority?.toLowerCase() || 'medium']}`}>
                                                {goal.priority === 'HIGH' ? 'Prioridade Alta' : goal.priority === 'MEDIUM' ? 'Prioridade Média' : 'Prioridade Baixa'}
                                            </span>

                                            {/* Bank/Account Info */}
                                            <div className={styles.storageInfo}>
                                                {goal.storageType === 'openfinance' && linkedAccount ? (
                                                    <div className={styles.linkedAccount}>
                                                        <FiLink className={styles.linkIcon} />
                                                        <span>{linkedAccount.institution} - {linkedAccount.bankName || linkedAccount.name}</span>
                                                        <span className={styles.autoSync}>Sincronizado</span>
                                                    </div>
                                                ) : goal.manualBank ? (
                                                    <div className={styles.manualBank}>
                                                        <FiHome />
                                                        <span>{goal.manualBank}</span>
                                                    </div>
                                                ) : (
                                                    <div className={styles.noBank}>
                                                        <span>Nenhum banco vinculado</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className={styles.goalProgress}>
                                                <div className={styles.progressHeader}>
                                                    <span>{formatCurrency(current)}</span>
                                                    <span>{formatCurrency(target)}</span>
                                                </div>
                                                <div className={styles.progressBar}>
                                                    <motion.div
                                                        className={styles.progressFill}
                                                        style={{ background: goal.color || '#6366f1' }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, progress)}%` }}
                                                        transition={{ duration: 1, delay: 0.2 }}
                                                    />
                                                </div>
                                                <div className={styles.progressFooter}>
                                                    <span>{progress.toFixed(0)}% concluído</span>
                                                    <span>{formatCurrency(remaining)} restante</span>
                                                </div>
                                            </div>

                                            <div className={styles.goalDeadline}>
                                                <FiCalendar />
                                                <span>
                                                    {daysLeftText} • {goal.deadline ? formatDate(goal.deadline) : 'Sem data fixa'}
                                                </span>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                            {/* Always show Ghost Goal at the end */}
                            <GhostGoal onClick={() => openModal()} />
                        </motion.div>
                    )}
                </div>
            </main>

            <Dock />

            {/* Goal Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingGoal ? 'Editar Meta' : 'Nova Meta'}
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

                    {/* Caixinha (Meta Infinita) Toggle */}
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
                        <span className={styles.helperText}>
                            {formData.isInfinite
                                ? 'O saldo acumula indefinidamente sem meta final'
                                : 'Define um valor alvo para alcançar'
                            }
                        </span>
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


                    <div className={styles.formRow}>
                        <div className={styles.inputGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label className={styles.inputLabel}>Prazo</label>
                                <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                    <input
                                        type="checkbox"
                                        checked={!formData.deadline}
                                        onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.checked ? '' : prev.deadline }))}
                                    />
                                    Sem data fixa
                                </label>
                            </div>
                            <Input
                                type="date"
                                leftIcon={<FiCalendar />}
                                value={formData.deadline}
                                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                                disabled={!formData.deadline && formData.deadline !== ''}
                            />
                        </div>
                    </div>
                    {/* Storage/Bank Selection */}
                    <div className={styles.storageSection}>
                        <label className={styles.inputLabel}>Onde está guardando?</label>
                        <div className={styles.storageToggle}>
                            <button
                                type="button"
                                className={`${styles.toggleBtn} ${formData.storageType === 'manual' ? styles.active : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, storageType: 'manual', linkedAccountId: '' }))}
                            >
                                <FiHome /> Manual
                            </button>
                            <button
                                type="button"
                                className={`${styles.toggleBtn} ${formData.storageType === 'openfinance' ? styles.active : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, storageType: 'openfinance', manualBank: '' }))}
                            >
                                <FiLink /> Open Finance
                            </button>
                        </div>

                        {formData.storageType === 'manual' ? (
                            <Input
                                label="Banco ou Instituição"
                                placeholder="Ex: Nubank, Banco Inter, Caixinha..."
                                leftIcon={<FiHome />}
                                value={formData.manualBank}
                                onChange={(e) => setFormData(prev => ({ ...prev, manualBank: e.target.value }))}
                                fullWidth
                            />
                        ) : (
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>Vincular à Conta</label>
                                <select
                                    className={styles.selectInput}
                                    value={formData.linkedAccountId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, linkedAccountId: e.target.value }))}
                                >
                                    <option value="">Selecione uma conta...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.institution} - {acc.name}
                                        </option>
                                    ))}
                                </select>
                                <span className={styles.helperText}>
                                    O saldo será atualizado automaticamente via Open Finance
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Budget Allocation Link */}
                    {budgetAllocations.length > 0 && (
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>🎯 Vincular ao Orçamento Mensal</label>
                            <select
                                className={styles.selectInput}
                                value={formData.budgetAllocationId}
                                onChange={(e) => setFormData(prev => ({ ...prev, budgetAllocationId: e.target.value }))}
                            >
                                <option value="">Nenhum (Não vincular)</option>
                                {budgetAllocations.map(alloc => (
                                    <option key={alloc.id} value={alloc.id}>
                                        {alloc.name} ({alloc.percentage}% - R$ {alloc.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                                    </option>
                                ))}
                            </select>
                            <span className={styles.helperText}>
                                Aportes nesta meta contarão para o orçamento selecionado
                            </span>
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
                        <Button variant="ghost" onClick={() => setShowModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave}>
                            {editingGoal ? 'Salvar Alterações' : 'Criar Meta'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Details Modal */}
            <GoalDetailsModal
                isOpen={!!selectedGoal}
                onClose={() => setSelectedGoal(null)}
                goal={selectedGoal}
                onAddValue={handleAddValue}
                onRemoveValue={handleRemoveValue}
                onEdit={() => { setSelectedGoal(null); openModal(selectedGoal); }}
            />

            {/* History Modal */}
            <GoalHistoryModal
                isOpen={historyModal.show}
                onClose={() => setHistoryModal({ ...historyModal, show: false })}
                goal={historyModal.goal}
            />

            {/* Quick Value Update Modal */}
            <Modal
                isOpen={valueModal.show}
                onClose={() => setValueModal({ ...valueModal, show: false })}
                title={valueModal.type === 'add' ? 'Adicionar Valor' : 'Retirar Valor'}
                size="sm"
            >
                <div>
                    <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                        {valueModal.type === 'add'
                            ? `Quanto você guardou para "${valueModal.goal?.name}"?`
                            : `Quanto você vai retirar de "${valueModal.goal?.name}"?`
                        }
                    </p>
                    <Input
                        label="Valor"
                        type="text"
                        placeholder="0,00"
                        leftIcon={<FiDollarSign />}
                        value={valueModal.amount}
                        onChange={(e) => setValueModal(prev => ({ ...prev, amount: formatInputBR(e.target.value) }))}
                        autoFocus
                    />
                    <div className={styles.modalActions} style={{ marginTop: '1.5rem' }}>
                        <Button variant="ghost" onClick={() => setValueModal({ ...valueModal, show: false })}>
                            Cancelar
                        </Button>
                        <Button onClick={submitValueUpdate}>
                            Confirmar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
