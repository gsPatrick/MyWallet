'use client';

/**
 * Central do DAS - Página
 * ========================================
 * Gerenciamento de guias DAS para MEI/ME
 * Exclusivo para perfis BUSINESS
 * ========================================
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCalendar, FiCheck, FiClock, FiAlertCircle, FiDollarSign,
    FiChevronLeft, FiChevronRight, FiX, FiCreditCard
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import AppShell from '@/components/AppShell';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useProfiles } from '@/contexts/ProfileContext';
import { dasAPI } from '@/services/api';
import bankAccountService from '@/services/bankAccountService';
import styles from './page.module.css';

const MONTH_NAMES = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
};

export default function DasPage() {
    const router = useRouter();
    const { currentProfile, profiles, loading: profileLoading } = useProfiles();

    const [year, setYear] = useState(new Date().getFullYear());
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Payment Modal
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [bankAccounts, setBankAccounts] = useState([]);
    const [selectedBankId, setSelectedBankId] = useState('');
    const [paying, setPaying] = useState(false);

    // Summary
    const [summary, setSummary] = useState(null);

    // Check if profile is BUSINESS
    const isBusinessProfile = currentProfile?.type === 'BUSINESS';

    // Redirect non-business profiles (wait for profile to load first)
    useEffect(() => {
        if (!profileLoading && currentProfile && !isBusinessProfile) {
            router.push('/dashboard');
        }
    }, [currentProfile, profileLoading, isBusinessProfile, router]);

    // Load data
    useEffect(() => {
        if (profileLoading || !isBusinessProfile) return;

        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Ensure guides exist
                await dasAPI.ensureGuides();

                // Load guides for selected year
                const guidesData = await dasAPI.listGuides(year);
                setGuides(guidesData || []);

                // Load summary
                const summaryData = await dasAPI.getSummary();
                setSummary(summaryData);

                // Load bank accounts
                const accountsData = await bankAccountService.list();
                const accounts = Array.isArray(accountsData) ? accountsData : (accountsData?.data || []);
                setBankAccounts(accounts);

                // Pre-select default account
                const defaultAcc = accounts.find(a => a.isDefault) || accounts[0];
                if (defaultAcc) {
                    setSelectedBankId(defaultAcc.id);
                }
            } catch (err) {
                console.error('Erro ao carregar DAS:', err);
                setError(err.message || 'Erro ao carregar dados');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [year, isBusinessProfile]);

    const handleOpenPayModal = (guide) => {
        setSelectedGuide(guide);
        setPaymentAmount(guide.baseValue?.toString() || '');
        setShowPayModal(true);
    };

    const handlePay = async () => {
        if (!selectedGuide || !selectedBankId || !paymentAmount) return;

        setPaying(true);
        try {
            await dasAPI.payGuide(selectedGuide.id, {
                bankAccountId: selectedBankId,
                finalAmount: parseFloat(paymentAmount)
            });

            // Refresh guides
            const guidesData = await dasAPI.listGuides(year);
            setGuides(guidesData || []);

            // Refresh summary
            const summaryData = await dasAPI.getSummary();
            setSummary(summaryData);

            setShowPayModal(false);
            setSelectedGuide(null);
        } catch (err) {
            console.error('Erro ao pagar DAS:', err);
            alert('Erro ao pagar: ' + (err.message || 'Erro desconhecido'));
        } finally {
            setPaying(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID': return 'green';
            case 'PENDING': return 'yellow';
            case 'OVERDUE': return 'red';
            default: return 'gray';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PAID': return 'Pago';
            case 'PENDING': return 'A vencer';
            case 'OVERDUE': return 'Atrasado';
            default: return status;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PAID': return <FiCheck />;
            case 'PENDING': return <FiClock />;
            case 'OVERDUE': return <FiAlertCircle />;
            default: return null;
        }
    };

    // Calculate totals
    const totalPaid = guides
        .filter(g => g.status === 'PAID')
        .reduce((sum, g) => sum + parseFloat(g.finalPaidValue || g.baseValue || 0), 0);

    const paidCount = guides.filter(g => g.status === 'PAID').length;
    const overdueCount = guides.filter(g => g.status === 'OVERDUE').length;

    // Show loading while profile loads
    if (profileLoading) {
        return (
            <AppShell>
                <Header />
                <main className={styles.main}>
                    <div className={styles.loadingState}>
                        <div className={styles.spinner} />
                        <span>Carregando...</span>
                    </div>
                </main>
                <Dock />
            </AppShell>
        );
    }

    if (!isBusinessProfile) {
        return null; // Redirect handled by useEffect
    }

    return (
        <AppShell>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <div className={styles.titleSection}>
                            <h1>Central do DAS</h1>
                            <p>Gerenciamento de impostos MEI/ME</p>
                        </div>
                        <div className={styles.yearSelector}>
                            <button onClick={() => setYear(y => y - 1)} className={styles.yearBtn}>
                                <FiChevronLeft />
                            </button>
                            <span className={styles.yearLabel}>{year}</span>
                            <button onClick={() => setYear(y => y + 1)} className={styles.yearBtn}>
                                <FiChevronRight />
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className={styles.summaryRow}>
                        <motion.div
                            className={styles.summaryCard}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <span className={styles.summaryLabel}>Total Pago em {year}</span>
                            <span className={styles.summaryValue}>{formatCurrency(totalPaid)}</span>
                            <span className={styles.summaryDetail}>{paidCount} de 12 guias pagas</span>
                        </motion.div>

                        {summary?.nextDue && (
                            <motion.div
                                className={`${styles.summaryCard} ${styles.nextDue}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <span className={styles.summaryLabel}>Próximo Vencimento</span>
                                <span className={styles.summaryValue}>{summary.nextDue.monthName}</span>
                                <span className={styles.summaryDetail}>
                                    {formatDate(summary.nextDue.dueDate)} • {formatCurrency(summary.nextDue.value)}
                                </span>
                            </motion.div>
                        )}

                        {overdueCount > 0 && (
                            <motion.div
                                className={`${styles.summaryCard} ${styles.overdue}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <span className={styles.summaryLabel}>Atenção!</span>
                                <span className={styles.summaryValue}>{overdueCount} Atrasado{overdueCount > 1 ? 's' : ''}</span>
                                <span className={styles.summaryDetail}>Regularize para evitar multas</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Loading & Error */}
                    {loading && (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner} />
                            <span>Carregando guias...</span>
                        </div>
                    )}

                    {error && !loading && (
                        <div className={styles.errorState}>
                            <FiAlertCircle />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Guides Grid */}
                    {!loading && !error && (
                        <div className={styles.guidesGrid}>
                            {guides.map((guide, index) => (
                                <motion.div
                                    key={guide.id}
                                    className={`${styles.guideCard} ${styles[getStatusColor(guide.status)]}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className={styles.guideHeader}>
                                        <span className={styles.guideMonth}>{guide.monthName}</span>
                                        <span className={`${styles.guideStatus} ${styles[getStatusColor(guide.status)]}`}>
                                            {getStatusIcon(guide.status)}
                                            {getStatusLabel(guide.status)}
                                        </span>
                                    </div>

                                    <div className={styles.guideBody}>
                                        <div className={styles.guideValue}>
                                            {guide.status === 'PAID'
                                                ? formatCurrency(guide.finalPaidValue || guide.baseValue)
                                                : formatCurrency(guide.baseValue)
                                            }
                                        </div>
                                        <div className={styles.guideDue}>
                                            Vence: {formatDate(guide.dueDate)}
                                        </div>
                                        {guide.status === 'PAID' && guide.paidAt && (
                                            <div className={styles.guidePaid}>
                                                Pago em {formatDate(guide.paidAt)}
                                            </div>
                                        )}
                                    </div>

                                    {guide.status !== 'PAID' && (
                                        <button
                                            className={styles.payBtn}
                                            onClick={() => handleOpenPayModal(guide)}
                                        >
                                            <FiDollarSign /> Pagar
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Dock />

            {/* Payment Modal */}
            <Modal
                isOpen={showPayModal}
                onClose={() => { setShowPayModal(false); setSelectedGuide(null); }}
                title={`Pagar DAS - ${selectedGuide?.monthName}/${year}`}
                size="sm"
            >
                <div className={styles.payModalContent}>
                    <div className={styles.payField}>
                        <label>Valor a Pagar</label>
                        <div className={styles.payAmountInput}>
                            <span>R$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder={selectedGuide?.baseValue?.toString()}
                            />
                        </div>
                        <span className={styles.payHint}>
                            Valor original: {formatCurrency(selectedGuide?.baseValue)}. Edite se houver juros/multa.
                        </span>
                    </div>

                    <div className={styles.payField}>
                        <label>Conta Bancária</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {selectedBankId && (() => {
                                const bank = bankAccounts.find(a => a.id === selectedBankId);
                                return bank?.icon ? (
                                    <img src={bank.icon} alt={bank.bankName} style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px', background: '#fff', padding: '4px' }} />
                                ) : bank ? (
                                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: bank.color || '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600 }}>
                                        {(bank.bankName || 'B').charAt(0)}
                                    </div>
                                ) : null;
                            })()}
                            <select
                                value={selectedBankId}
                                onChange={(e) => setSelectedBankId(e.target.value)}
                                className={styles.paySelect}
                                style={{ flex: 1 }}
                            >
                                <option value="">Selecione...</option>
                                {bankAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.nickname || acc.bankName} {acc.isDefault ? '(Padrão)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.payActions}>
                        <Button variant="secondary" onClick={() => setShowPayModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handlePay} disabled={paying || !selectedBankId || !paymentAmount}>
                            {paying ? 'Processando...' : 'Confirmar Pagamento'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AppShell>
    );
}
