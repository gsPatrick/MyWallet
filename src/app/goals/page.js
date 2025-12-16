'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiPlus, FiTarget, FiCalendar, FiTrendingUp, FiEdit2, FiTrash2,
    FiDollarSign, FiFlag, FiLink, FiHome, FiLoader, FiAlertCircle
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import GhostGoal from '@/components/ui/GhostGoal';
import { usePrivateCurrency } from '@/components/ui/PrivateValue';
import { formatDate } from '@/utils/formatters';
import { goalsAPI, openFinanceAPI } from '@/services/api';
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
    // Privacy-aware formatting
    const { formatCurrency } = usePrivateCurrency();

    const [goals, setGoals] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        targetAmount: '',
        currentAmount: '',
        deadline: '',
        category: '',
        priority: 'MEDIUM',
        color: '#6366f1',
        storageType: 'manual',
        linkedAccountId: '',
        manualBank: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [goalsRes, accountsRes] = await Promise.all([
                goalsAPI.list(),
                openFinanceAPI.listAccounts()
            ]);
            setGoals(goalsRes);
            setAccounts(accountsRes || []); // accountsRes.data se vier paginado? Ajustar conforme api.js
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            // Fallback to empty if fails
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
                targetAmount: goal.targetAmount.toString(),
                currentAmount: goal.currentAmount.toString(),
                deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
                category: categoryMap[goal.category] || 'Outros',
                priority: goal.priority,
                color: goal.color,
                storageType: goal.storageType || 'manual',
                linkedAccountId: goal.linkedAccountId || '',
                manualBank: goal.manualBank || '',
            });
        } else {
            setEditingGoal(null);
            setFormData({
                name: '',
                targetAmount: '',
                currentAmount: '0',
                deadline: '',
                category: '',
                priority: 'MEDIUM',
                color: '#6366f1',
                storageType: 'manual',
                linkedAccountId: '',
                manualBank: '',
            });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...formData,
                targetAmount: parseFloat(formData.targetAmount),
                currentAmount: parseFloat(formData.currentAmount),
                category: reverseCategoryMap[formData.category] || 'OTHER',
                deadline: formData.deadline || null
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
            alert("Erro ao salvar meta: " + error.response?.data?.error || error.message);
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
                                    >
                                        <Card className={styles.goalCard}>
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
                                                        onClick={() => openModal(goal)}
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.danger}`}
                                                        onClick={() => handleDelete(goal.id)}
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>

                                            <span className={`${styles.priorityBadge} ${styles[goal.priority?.toLowerCase() || 'medium']}`}>
                                                {goal.priority === 'HIGH' ? 'Alta' : goal.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
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
                                                    {daysLeftText} • {goal.deadline ? formatDate(goal.deadline) : '--/--/----'}
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

                    <div className={styles.formRow}>
                        <Input
                            label="Valor Objetivo"
                            type="number"
                            placeholder="0,00"
                            leftIcon={<FiDollarSign />}
                            value={formData.targetAmount}
                            onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                        />
                        <Input
                            label="Valor Atual"
                            type="number"
                            placeholder="0,00"
                            leftIcon={<FiDollarSign />}
                            value={formData.currentAmount}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: e.target.value }))}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Categoria</label>
                            <select
                                className={styles.selectInput}
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            >
                                <option value="">Selecione...</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Prazo"
                            type="date"
                            leftIcon={<FiCalendar />}
                            value={formData.deadline}
                            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                        />
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
        </div>
    );
}
