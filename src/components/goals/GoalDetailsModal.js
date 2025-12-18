import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiMinus, FiClock, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { usePrivateCurrency } from '@/components/ui/PrivateValue';
import { formatDate } from '@/utils/formatters';
import styles from './GoalDetailsModal.module.css';

export default function GoalDetailsModal({
    isOpen,
    onClose,
    goal,
    onAddValue,
    onRemoveValue,
    onEdit
}) {
    const { formatCurrency } = usePrivateCurrency();
    const [action, setAction] = useState(null); // 'add' or 'remove'
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [history, setHistory] = useState([]); // Mock history for now

    if (!isOpen || !goal) return null;

    const handleActionSubmit = async () => {
        if (!amount) return;
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;

        if (action === 'add') {
            await onAddValue(goal, val);
            // Mock adding to history
            setHistory(prev => [{ date: new Date().toISOString(), type: 'deposit', amount: val }, ...prev]);
        } else if (action === 'remove') {
            if (!reason) {
                alert("Por favor, informe o motivo da retirada.");
                return;
            }
            await onRemoveValue(goal, val, reason);
            // Mock adding to history
            setHistory(prev => [{ date: new Date().toISOString(), type: 'withdraw', amount: val, reason }, ...prev]);
        }

        // Reset
        setAction(null);
        setAmount('');
        setReason('');
    };

    const progress = goal.targetAmount > 0
        ? (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100
        : 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className={styles.modal}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    >
                        <div className={styles.header}>
                            <div className={styles.headerContent}>
                                <div className={styles.iconWrapper} style={{ backgroundColor: `${goal.color || '#6366f1'}20`, color: goal.color || '#6366f1' }}>
                                    <FiTrendingUp />
                                </div>
                                <div>
                                    <h2 className={styles.title}>{goal.name}</h2>
                                    <span className={styles.subtitle}>Meta Financeira</span>
                                </div>
                            </div>
                            <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
                        </div>

                        <div className={styles.body}>
                            {/* Stats */}
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <span className={styles.statLabel}>Valor Atual</span>
                                    <span className={styles.statValue} style={{ color: 'var(--accent-success)' }}>
                                        {formatCurrency(goal.currentAmount)}
                                    </span>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={styles.statLabel}>Valor Meta</span>
                                    <span className={styles.statValue}>
                                        {formatCurrency(goal.targetAmount)}
                                    </span>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={styles.statLabel}>Prazo</span>
                                    <span className={styles.statValue}>
                                        {goal.deadline ? formatDate(goal.deadline) : 'Sem data'}
                                    </span>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className={styles.progressSection}>
                                <div className={styles.progressLabels}>
                                    <span>Progresso</span>
                                    <span>{progress.toFixed(1)}%</span>
                                </div>
                                <div className={styles.progressBarBg}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${Math.min(100, progress)}%`, backgroundColor: goal.color || '#6366f1' }}
                                    />
                                </div>
                            </div>

                            {/* Actions Area */}
                            <div className={styles.actionsRow}>
                                <Button
                                    variant={action === 'add' ? 'primary' : 'outline'}
                                    onClick={() => setAction('add')}
                                    className={styles.actionBtn}
                                >
                                    <FiPlus /> Adicionar Valor
                                </Button>
                                <Button
                                    variant={action === 'remove' ? 'danger' : 'outline'}
                                    onClick={() => setAction('remove')}
                                    className={`${styles.actionBtn} ${styles.dangerBtn}`}
                                >
                                    <FiMinus /> Resgatar
                                </Button>
                                <Button variant="ghost" onClick={onEdit} className={styles.editBtn}>
                                    Editar Meta
                                </Button>
                            </div>

                            {/* Action Form */}
                            <AnimatePresence>
                                {action && (
                                    <motion.div
                                        className={styles.actionForm}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                    >
                                        <h3 className={styles.formTitle}>
                                            {action === 'add' ? 'Adicionar Saldo' : 'Resgatar Valor'}
                                        </h3>
                                        <div className={styles.formContent}>
                                            <Input
                                                type="number"
                                                placeholder="0,00"
                                                value={amount}
                                                onChange={e => setAmount(e.target.value)}
                                                leftIcon={<span style={{ fontSize: '14px', fontWeight: 600 }}>R$</span>}
                                            />
                                            {action === 'remove' && (
                                                <Input
                                                    placeholder="Motivo do resgate (obrigatório)"
                                                    value={reason}
                                                    onChange={e => setReason(e.target.value)}
                                                />
                                            )}
                                            <div className={styles.formButtons}>
                                                <Button size="sm" variant="ghost" onClick={() => { setAction(null); setAmount(''); setReason(''); }}>Cancelar</Button>
                                                <Button size="sm" onClick={handleActionSubmit}>Confirmar</Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* History Section */}
                            <div className={styles.historySection}>
                                <h3 className={styles.sectionTitle}><FiClock /> Histórico Recente</h3>
                                {history.length > 0 ? (
                                    <div className={styles.historyList}>
                                        {history.map((h, i) => (
                                            <div key={i} className={styles.historyItem}>
                                                <div className={styles.historyIcon} data-type={h.type}>
                                                    {h.type === 'deposit' ? <FiPlus /> : <FiMinus />}
                                                </div>
                                                <div className={styles.historyDetails}>
                                                    <span className={styles.historyAmount}>{formatCurrency(h.amount)}</span>
                                                    <span className={styles.historyDate}>{formatDate(h.date)}</span>
                                                    {h.reason && <span className={styles.historyReason}>{h.reason}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.emptyHistory}>
                                        <p>Nenhuma movimentação registrada.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
