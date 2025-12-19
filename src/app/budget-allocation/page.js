'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiPlus, FiTrash2, FiSave, FiSliders, FiDollarSign, FiTrendingUp,
    FiShield, FiHeart, FiHome, FiShoppingBag, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import OnboardingQuiz from '@/components/budgets/OnboardingQuiz';
import { budgetsAPI } from '@/services/api'; // Added import
import Modal from '@/components/ui/Modal'; // Already there but ensuring it is used
// Styles import
import styles from './page.module.css';

const defaultAllocations = [
    { id: 1, name: 'Gastos Essenciais', percent: 50, color: '#ef4444', icon: 'home' },
    { id: 2, name: 'Gastos Pessoais', percent: 20, color: '#f59e0b', icon: 'shopping' },
    { id: 3, name: 'Investimentos', percent: 15, color: '#22c55e', icon: 'trending' },
    { id: 4, name: 'Reserva de Emergência', percent: 10, color: '#3b82f6', icon: 'shield' },
    { id: 5, name: 'Lazer', percent: 5, color: '#8b5cf6', icon: 'heart' },
];

const icons = {
    home: FiHome,
    shopping: FiShoppingBag,
    trending: FiTrendingUp,
    shield: FiShield,
    heart: FiHeart,
    dollar: FiDollarSign,
};

const colorOptions = [
    '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6',
    '#ec4899', '#14b8a6', '#6366f1', '#84cc16', '#f97316'
];

export default function BudgetAllocationPage() {
    const [allocations, setAllocations] = useState(defaultAllocations);
    const [income, setIncome] = useState(10000);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', percent: 0, color: '#3b82f6', icon: 'dollar' });
    const [isEditingIncome, setIsEditingIncome] = useState(false);
    const [incomeInputValue, setIncomeInputValue] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false); // Added State

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const hasOnboarded = localStorage.getItem('budget_onboarded');
            const response = await budgetsAPI.getCurrentAllocations();
            const data = response.data?.allocations || response.data || [];

            if (data.length > 0) {
                const mapped = data.map(item => ({
                    id: item.id,
                    name: item.name,
                    percent: parseFloat(item.percentage),
                    color: item.color,
                    icon: item.icon
                }));
                setAllocations(mapped);

                // Estimate income from total amounts
                const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.amount), 0);
                if (totalAmount > 0) setIncome(totalAmount);
            } else if (!hasOnboarded) {
                setShowQuiz(true);
            }
        } catch (error) {
            console.error('Erro ao carregar alocações:', error);
            // Fallback to quiz if no data and not onboarded
            const hasOnboarded = localStorage.getItem('budget_onboarded');
            if (!hasOnboarded) setShowQuiz(true);
        }
    };

    // Format number to Brazilian currency display (R$ 10.000,00)
    const formatCurrencyBR = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    // Parse Brazilian formatted string to number
    const parseBRCurrency = (str) => {
        if (!str) return 0;
        // Remove R$ and spaces
        let cleaned = str.replace(/R\$\s?/g, '').trim();
        // Remove thousand separators (.) and replace decimal comma with dot
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    };

    // Format input as user types (1000 -> 1.000)
    const formatInputBR = (value) => {
        // Remove non-numeric chars except comma
        let cleaned = value.replace(/[^\d,]/g, '');

        // Handle comma for decimals
        const parts = cleaned.split(',');
        let integerPart = parts[0] || '';
        let decimalPart = parts[1] || '';

        // Add thousand separators to integer part
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        // Limit decimal to 2 digits
        if (decimalPart.length > 2) {
            decimalPart = decimalPart.substring(0, 2);
        }

        return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
    };

    const handleIncomeClick = () => {
        setIsEditingIncome(true);
        // Format current income for editing (without R$)
        setIncomeInputValue(income.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    const handleIncomeChange = (e) => {
        const formatted = formatInputBR(e.target.value);
        setIncomeInputValue(formatted);
    };

    const handleIncomeBlur = () => {
        const parsed = parseBRCurrency(incomeInputValue);
        setIncome(parsed);
        setIsEditingIncome(false);
    };

    const handleIncomeKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleIncomeBlur();
        }
        if (e.key === 'Escape') {
            setIsEditingIncome(false);
        }
    };

    const totalPercent = allocations.reduce((sum, a) => sum + a.percent, 0);
    const isValid = totalPercent === 100;

    // State for editing individual allocation amounts
    const [editingAmountId, setEditingAmountId] = useState(null);
    const [amountInputValue, setAmountInputValue] = useState('');

    const updatePercent = (id, newPercent) => {
        setAllocations(prev => prev.map(a =>
            a.id === id ? { ...a, percent: Math.max(0, Math.min(100, newPercent)) } : a
        ));
    };

    // Handle clicking on amount to edit
    const handleAmountClick = (allocId, currentAmount) => {
        setEditingAmountId(allocId);
        setAmountInputValue(currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    // Handle amount input change with formatting
    const handleAmountChange = (e) => {
        const formatted = formatInputBR(e.target.value);
        setAmountInputValue(formatted);
    };

    // Handle blur - calculate new percent from amount
    const handleAmountBlur = (allocId) => {
        const newAmount = parseBRCurrency(amountInputValue);
        // Calculate percent based on income
        if (income > 0) {
            const newPercent = Math.round((newAmount / income) * 100);
            updatePercent(allocId, newPercent);
        }
        setEditingAmountId(null);
    };

    // Handle keydown for amount input
    const handleAmountKeyDown = (e, allocId) => {
        if (e.key === 'Enter') {
            handleAmountBlur(allocId);
        }
        if (e.key === 'Escape') {
            setEditingAmountId(null);
        }
    };

    const removeAllocation = (id) => {
        setAllocations(prev => prev.filter(a => a.id !== id));
    };

    const addCategory = () => {
        if (newCategory.name && newCategory.percent > 0) {
            setAllocations(prev => [...prev, {
                ...newCategory,
                id: Date.now(),
            }]);
            setNewCategory({ name: '', percent: 0, color: '#3b82f6', icon: 'dollar' });
            setShowAddModal(false);
        }
    };

    const handleSave = async () => {
        try {
            await budgetsAPI.create({
                income,
                allocations
            });
            setShowSuccessModal(true);
            localStorage.setItem('budget_onboarded', 'true');
        } catch (error) {
            console.error('Error saving budget:', error);
            alert('Erro ao salvar orçamento: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleQuizFinish = (data) => {
        setIncome(data.income);
        setAllocations(data.allocations);
        setShowQuiz(false);
        localStorage.setItem('budget_onboarded', 'true');
    };

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Page Header */}
                    <motion.div
                        className={styles.pageHeader}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className={styles.headerText}>
                            <h1>Alocação de Orçamento</h1>
                            <p>Defina como distribuir sua renda entre categorias</p>
                        </div>
                        <Button onClick={handleSave} disabled={!isValid} leftIcon={<FiSave />}>
                            Salvar
                        </Button>
                    </motion.div>

                    {/* Income Input */}
                    <motion.div
                        className={styles.incomeSection}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className={styles.incomeCard}>
                            <div className={styles.incomeHeader}>
                                <FiDollarSign className={styles.incomeIcon} />
                                <span>Renda Mensal</span>
                            </div>
                            {isEditingIncome ? (
                                <input
                                    type="text"
                                    value={incomeInputValue}
                                    onChange={handleIncomeChange}
                                    onBlur={handleIncomeBlur}
                                    onKeyDown={handleIncomeKeyDown}
                                    className={styles.incomeInput}
                                    autoFocus
                                    placeholder="10.000,00"
                                />
                            ) : (
                                <div
                                    className={styles.incomeDisplay}
                                    onClick={handleIncomeClick}
                                    title="Clique para editar"
                                >
                                    {formatCurrencyBR(income)}
                                </div>
                            )}
                        </Card>
                    </motion.div>

                    {/* Allocation Bar */}
                    <motion.div
                        className={styles.allocationBar}
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className={styles.barContainer}>
                            {allocations.map((alloc, index) => (
                                <motion.div
                                    key={alloc.id}
                                    className={styles.barSegment}
                                    style={{
                                        width: `${alloc.percent}%`,
                                        background: alloc.color,
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${alloc.percent}%` }}
                                    title={`${alloc.name}: ${alloc.percent}%`}
                                >
                                    {alloc.percent >= 8 && (
                                        <span className={styles.barLabel}>{alloc.percent}%</span>
                                    )}
                                </motion.div>
                            ))}
                            {totalPercent < 100 && (
                                <div
                                    className={styles.barRemaining}
                                    style={{ width: `${100 - totalPercent}%` }}
                                >
                                    <span>{100 - totalPercent}%</span>
                                </div>
                            )}
                        </div>
                        <div className={styles.barLegend}>
                            <span className={`${styles.totalLabel} ${isValid ? styles.valid : styles.invalid}`}>
                                {isValid ? (
                                    <>✓ 100% alocado</>
                                ) : totalPercent > 100 ? (
                                    <><FiAlertCircle /> {totalPercent}% (excede 100%)</>
                                ) : (
                                    <><FiAlertCircle /> {totalPercent}% (faltam {100 - totalPercent}%)</>
                                )}
                            </span>
                        </div>
                    </motion.div>

                    {/* Allocations List */}
                    <motion.div
                        className={styles.allocationsList}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        {allocations.map((alloc, index) => {
                            const Icon = icons[alloc.icon] || FiDollarSign;
                            const amount = (income * alloc.percent) / 100;

                            return (
                                <motion.div
                                    key={alloc.id}
                                    className={styles.allocationItem}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                >
                                    <div className={styles.itemIcon} style={{ background: `${alloc.color}20`, color: alloc.color }}>
                                        <Icon />
                                    </div>

                                    <div className={styles.itemInfo}>
                                        <span className={styles.itemName}>{alloc.name}</span>
                                        {editingAmountId === alloc.id ? (
                                            <input
                                                type="text"
                                                value={amountInputValue}
                                                onChange={handleAmountChange}
                                                onBlur={() => handleAmountBlur(alloc.id)}
                                                onKeyDown={(e) => handleAmountKeyDown(e, alloc.id)}
                                                className={styles.itemAmountInput}
                                                autoFocus
                                                placeholder="1.000,00"
                                            />
                                        ) : (
                                            <span
                                                className={styles.itemAmountClickable}
                                                onClick={() => handleAmountClick(alloc.id, amount)}
                                                title="Clique para editar o valor"
                                            >
                                                R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        )}
                                    </div>

                                    <div className={styles.itemSlider}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={alloc.percent}
                                            onChange={(e) => updatePercent(alloc.id, Number(e.target.value))}
                                            className={styles.slider}
                                            style={{ '--color': alloc.color }}
                                        />
                                    </div>

                                    <div className={styles.itemPercent}>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={alloc.percent}
                                            onChange={(e) => updatePercent(alloc.id, Number(e.target.value))}
                                            className={styles.percentInput}
                                        />
                                        <span>%</span>
                                    </div>

                                    <button
                                        className={styles.removeBtn}
                                        onClick={() => removeAllocation(alloc.id)}
                                    >
                                        <FiTrash2 />
                                    </button>
                                </motion.div>
                            );
                        })}

                        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
                            <FiPlus />
                            Adicionar Categoria
                        </button>
                    </motion.div>

                    {/* Tips */}
                    <motion.div
                        className={styles.tips}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className={styles.tipCard}>
                            <h4>💡 Regra dos 50-30-20</h4>
                            <p>
                                Uma regra popular sugere: <strong>50%</strong> para necessidades,
                                <strong>30%</strong> para desejos e <strong>20%</strong> para poupança/investimentos.
                            </p>
                        </Card>
                    </motion.div>
                </div>
            </main>

            <Dock />

            {/* Onboarding Quiz Modal */}
            <OnboardingQuiz
                isOpen={showQuiz}
                onClose={() => setShowQuiz(false)}
                onFinish={handleQuizFinish}
            />

            {/* Add Category Modal */}
            {showAddModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
                    <motion.div
                        className={styles.modal}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3>Nova Categoria</h3>
                        <div className={styles.modalForm}>
                            <Input
                                label="Nome da Categoria"
                                placeholder="Ex: Educação"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                                fullWidth
                            />
                            <div className={styles.formRow}>
                                <Input
                                    label="Percentual"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={newCategory.percent}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, percent: Number(e.target.value) }))}
                                />
                            </div>
                            <div className={styles.colorPicker}>
                                <label>Cor</label>
                                <div className={styles.colorOptions}>
                                    {colorOptions.map(color => (
                                        <button
                                            key={color}
                                            className={`${styles.colorOption} ${newCategory.color === color ? styles.selected : ''}`}
                                            style={{ background: color }}
                                            onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancelar</Button>
                                <Button onClick={addCategory}>Adicionar</Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Orçamento Salvo!"
                size="sm"
            >
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <FiCheckCircle style={{ fontSize: '3rem', color: '#22c55e', marginBottom: '1rem' }} />
                    <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
                        Suas preferências de alocação foram salvas com sucesso.
                    </p>
                    <Button onClick={() => setShowSuccessModal(false)}>
                        Continuar
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
