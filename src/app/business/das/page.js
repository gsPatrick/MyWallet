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
    FiChevronLeft, FiChevronRight, FiX, FiCreditCard, FiSettings
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import AppShell from '@/components/AppShell';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useProfiles } from '@/contexts/ProfileContext';
import { dasAPI, profilesAPI } from '@/services/api';
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
    const { currentProfile, loading: profileLoading } = useProfiles();

    const [year, setYear] = useState(new Date().getFullYear());
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Selection & Payment
    const [selectedGuides, setSelectedGuides] = useState([]);
    const [showPayModal, setShowPayModal] = useState(false);
    const [bulkPayMode, setBulkPayMode] = useState(false);
    const [selectedGuideSingle, setSelectedGuideSingle] = useState(null); // For single action
    const [paymentAmount, setPaymentAmount] = useState('');
    const [bankAccounts, setBankAccounts] = useState([]);
    const [selectedBankId, setSelectedBankId] = useState('');
    const [paying, setPaying] = useState(false);

    // Configuration Modal
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [configData, setConfigData] = useState({ value: '', day: '20' });
    const [savingConfig, setSavingConfig] = useState(false);

    // Summary
    const [summary, setSummary] = useState(null);

    // Check if profile is BUSINESS
    const isBusinessProfile = currentProfile?.type === 'BUSINESS';

    // Redirect non-business profiles
    useEffect(() => {
        if (!profileLoading && currentProfile && !isBusinessProfile) {
            router.push('/dashboard');
        }
    }, [currentProfile, profileLoading, isBusinessProfile, router]);

    // Initial check for configuration & Load Data
    useEffect(() => {
        if (!currentProfile || !isBusinessProfile) return;

        const initPage = async () => {
            setLoading(true);
            try {
                // 1. Check Config directly from API
                const profileRes = await profilesAPI.get(currentProfile.id);
                const profileData = profileRes.profile || profileRes;

                if (!profileData.dasValue) {
                    setShowConfigModal(true);
                }

                setConfigData({
                    value: profileData.dasValue?.toString() || '',
                    day: profileData.dasDueDay?.toString() || '20'
                });

                // 2. Load Data in Parallel (Guides, Summary, Bank Accounts)
                const [guidesRes, summaryRes, accountsRes] = await Promise.all([
                    (async () => {
                        try {
                            await dasAPI.ensureGuides();
                            const guides = await dasAPI.listGuides(year);
                            return Array.isArray(guides) ? guides : [];
                        } catch (e) {
                            console.error("Guides Error:", e);
                            return [];
                        }
                    })(),
                    dasAPI.getSummary().catch(e => { console.error("Summary Error:", e); return null; }),
                    bankAccountService.list().catch(e => { console.error("Bank Error:", e); return []; })
                ]);

                setGuides(guidesRes);
                setSummary(summaryRes);

                // Handle Bank Accounts
                const accounts = Array.isArray(accountsRes) ? accountsRes : (accountsRes?.data || []);
                setBankAccounts(accounts);
                const defaultAcc = accounts.find(a => a.isDefault) || accounts[0];
                if (defaultAcc) setSelectedBankId(defaultAcc.id);

            } catch (err) {
                console.error('Erro ao carregar DAS:', err);
                setError(err.message || 'Erro ao carregar dados');
            } finally {
                setLoading(false);
            }
        };

        initPage();
    }, [year, isBusinessProfile, currentProfile]);

    const handleSaveConfig = async () => {
        if (!configData.value || !configData.day) return;
        setSavingConfig(true);
        try {
            await profilesAPI.update(currentProfile.id, {
                dasValue: parseFloat(configData.value),
                dasDueDay: parseInt(configData.day)
            });
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar configuração.");
        } finally {
            setSavingConfig(false);
        }
    };

    // Calculate displayed guides (Pure UI Status Logic)
    const getDisplayedGuides = () => {
        const fullYearGuides = [];
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        for (let m = 1; m <= 12; m++) {
            const existing = guides.find(g => g.month === m);
            const nextMonthYear = m === 12 ? year + 1 : year;
            const nextMonth = m === 12 ? 0 : m;
            const dueDate = existing?.dueDate ? new Date(existing.dueDate) : new Date(nextMonthYear, nextMonth, 20); // Default 20th next month

            let displayStatus = 'PENDING';
            let statusLabel = 'A Vencer';
            let statusClass = 'statusVencer';
            let rowClass = 'rowVencer';

            const isPastMonth = year < currentYear || (year === currentYear && m < currentMonth);
            const isCurrentMonth = year === currentYear && m === currentMonth;

            if (existing?.status === 'PAID') {
                displayStatus = 'PAID';
                statusLabel = 'Liquidado';
                statusClass = 'statusLiquidado';
                rowClass = 'rowLiquidado';
            } else if (isPastMonth) {
                displayStatus = 'PAID_VISUAL';
                statusLabel = 'Liquidado';
                statusClass = 'statusLiquidado';
                rowClass = 'rowLiquidado';
            } else if (isCurrentMonth) {
                if (today > dueDate) {
                    displayStatus = 'OVERDUE';
                    statusLabel = 'Devedor';
                    statusClass = 'statusDevedor';
                    rowClass = 'rowDevedor';
                } else {
                    displayStatus = 'PENDING';
                    statusLabel = 'A Pagar';
                    statusClass = 'statusPagar';
                    rowClass = 'rowPagar';
                }
            } else {
                statusLabel = 'A Vencer';
                statusClass = 'statusVencer';
            }

            fullYearGuides.push({
                id: existing?.id || `mock-${m}`,
                month: m,
                monthName: MONTH_NAMES[m],
                baseValue: existing?.baseValue || 75.60,
                finalValue: existing?.status === 'PAID' ? existing.finalPaidValue : existing?.baseValue || 75.60,
                dueDate: dueDate.toISOString(),
                paidAt: existing?.paidAt,
                displayStatus,
                statusLabel,
                statusClass,
                rowClass,
                canPay: displayStatus === 'PENDING' || displayStatus === 'OVERDUE' || (isCurrentMonth && displayStatus !== 'PAID'),
                isMock: !existing
            });
        }
        return fullYearGuides;
    };

    const displayedGuides = getDisplayedGuides();

    // Selection Logic
    const toggleSelect = (id) => {
        setSelectedGuides(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            return [...prev, id];
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const payableIds = displayedGuides.filter(g => g.canPay).map(g => g.id);
            setSelectedGuides(payableIds);
        } else {
            setSelectedGuides([]);
        }
    };

    // Payment Logic
    const openPayModal = (guide = null) => {
        if (guide) {
            // Single Pay
            setBulkPayMode(false);
            setSelectedGuideSingle(guide);
            setPaymentAmount(guide.finalValue.toString());
        } else {
            // Bulk Pay
            setBulkPayMode(true);
            const total = displayedGuides
                .filter(g => selectedGuides.includes(g.id))
                .reduce((sum, g) => sum + parseFloat(g.finalValue), 0);
            setPaymentAmount(total.toFixed(2));
        }
        setShowPayModal(true);
    };

    const handlePay = async () => {
        if (!selectedBankId || !paymentAmount) return;
        setPaying(true);
        try {
            if (bulkPayMode) {
                // Bulk Pay Logic: Sequential payments
                // We don't support editing TOTAL for bulk safely, so we assume base values logic
                // For simplicity, we loop through selectedGuides
                for (const id of selectedGuides) {
                    const guide = displayedGuides.find(g => g.id === id);
                    if (guide && !guide.id.toString().startsWith('mock')) {
                        // Use guide's specific value logic
                        await dasAPI.payGuide(guide.id, {
                            bankAccountId: selectedBankId,
                            finalAmount: guide.finalValue // Using original value, bulk edit not supported to avoid math errors
                        });
                    }
                }
            } else {
                // Single Pay Logic
                const guide = selectedGuideSingle;
                const guideId = guide.id.toString().startsWith('mock') ? null : guide.id;
                if (!guideId) throw new Error("Guia não encontrada.");

                await dasAPI.payGuide(guideId, {
                    bankAccountId: selectedBankId,
                    finalAmount: parseFloat(paymentAmount)
                });
            }

            // Refresh
            const guidesData = await dasAPI.listGuides(year);
            setGuides(guidesData || []);
            const summaryData = await dasAPI.getSummary();
            setSummary(summaryData);

            setShowPayModal(false);
            setSelectedGuides([]);
            setBulkPayMode(false);
            alert('Pagamento realizado com sucesso!');
        } catch (err) {
            console.error(err);
            alert('Erro ao processar pagamento(s).');
        } finally {
            setPaying(false);
        }
    };

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

    if (!isBusinessProfile) return null;

    return (
        <AppShell>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <div className={styles.titleSection}>
                            <h1>Central do DAS</h1>
                            <p>Gerenciamento de impostos Simples Nacional</p>
                        </div>
                        <div className={styles.yearSelector}>
                            <button
                                className={styles.yearBtn}
                                onClick={() => setShowConfigModal(true)}
                                title="Configurar DAS"
                                style={{ marginRight: '8px' }}
                            >
                                <FiSettings />
                            </button>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Ano-Calendário:</span>
                            <button onClick={() => setYear(y => y - 1)} className={styles.yearBtn}><FiChevronLeft /></button>
                            <span className={styles.yearLabel}>{year}</span>
                            <button onClick={() => setYear(y => y + 1)} className={styles.yearBtn}><FiChevronRight /></button>
                        </div>
                    </div>

                    {/* Simples Nacional Style Table */}
                    <div className={styles.tableContainer}>
                        <div className={styles.tableHeader}>
                            <h3>Períodos de Apuração</h3>
                            <Button
                                onClick={() => {
                                    if (selectedGuides.length > 0) openPayModal(null);
                                }}
                                disabled={selectedGuides.length === 0}
                                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                            >
                                {selectedGuides.length > 0 ? `Pagar (${selectedGuides.length})` : 'Pagar Selecionados'}
                            </Button>
                        </div>
                        <div className={styles.tableWrapper}>
                            <table className={styles.dasTable}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px', paddingLeft: '16px' }}>
                                            <input
                                                type="checkbox"
                                                onChange={handleSelectAll}
                                                checked={selectedGuides.length > 0 && selectedGuides.length === displayedGuides.filter(g => g.canPay).length}
                                                style={{ accentColor: 'var(--primary-color)' }}
                                            />
                                        </th>
                                        <th>Período</th>
                                        <th>Apurado</th>
                                        <th>Situação</th>
                                        <th>Principal</th>
                                        <th>Multa</th>
                                        <th>Juros</th>
                                        <th>Total</th>
                                        <th>Vencimento</th>
                                        <th>Acolhimento</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedGuides.map((guide) => (
                                        <tr key={guide.id} className={styles[guide.rowClass]}>
                                            <td style={{ paddingLeft: '16px' }}>
                                                <input
                                                    type="checkbox"
                                                    disabled={!guide.canPay}
                                                    checked={selectedGuides.includes(guide.id)}
                                                    onChange={() => toggleSelect(guide.id)}
                                                    style={{ accentColor: 'var(--primary-color)' }}
                                                />
                                            </td>
                                            <td><strong>{guide.monthName}/{year}</strong></td>
                                            <td>Sim</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles[guide.statusClass]}`}>
                                                    {guide.statusLabel}
                                                </span>
                                            </td>
                                            <td>{formatCurrency(guide.baseValue)}</td>
                                            <td>{formatCurrency(0)}</td>
                                            <td>{formatCurrency(0)}</td>
                                            <td><strong>{formatCurrency(guide.finalValue)}</strong></td>
                                            <td>{formatDate(guide.dueDate)}</td>
                                            <td>{guide.paidAt ? formatDate(guide.paidAt) : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
            <Dock />

            {/* Config Modal */}
            <Modal
                isOpen={showConfigModal}
                onClose={() => setShowConfigModal(false)}
                title="Configuração do DAS"
                size="sm"
            >
                <div className={styles.payModalContent}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Configure o valor mensal e o dia de vencimento do seu DAS para gerarmos as guias corretamente.
                    </p>

                    <div className={styles.payField}>
                        <label>Valor Mensal do DAS (R$)</label>
                        <div className={styles.payAmountInput}>
                            <span>R$</span>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={configData.value}
                                onChange={(e) => setConfigData(prev => ({ ...prev, value: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className={styles.payField}>
                        <label>Dia de Vencimento</label>
                        <select
                            value={configData.day}
                            onChange={(e) => setConfigData(prev => ({ ...prev, day: e.target.value }))}
                            className={styles.paySelect}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        >
                            <option value="10">Dia 10</option>
                            <option value="15">Dia 15</option>
                            <option value="20">Dia 20 (Padrão)</option>
                            <option value="25">Dia 25</option>
                            <option value="28">Dia 28</option>
                        </select>
                    </div>

                    <div className={styles.payActions} style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowConfigModal(false);
                            }}
                            fullWidth
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveConfig} disabled={savingConfig || !configData.value} fullWidth>
                            {savingConfig ? 'Salvando...' : 'Salvar Configuração'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Payment Modal */}
            <Modal
                isOpen={showPayModal}
                onClose={() => { setShowPayModal(false); if (!bulkPayMode) setSelectedGuideSingle(null); }}
                title={bulkPayMode ? `Pagar ${selectedGuides.length} Guias` : `Pagamento DAS`}
                size="sm"
            >
                <div className={styles.payModalContent}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Total a Pagar:</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                {formatCurrency(paymentAmount)}
                            </span>
                        </div>
                    </div>

                    {!bulkPayMode && (
                        <div className={styles.payField}>
                            <label style={{ display: 'block', marginBottom: '8px' }}>Valor (Editar se houver juros)</label>
                            <div className={styles.payAmountInput}>
                                <span>R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className={styles.payField}>
                        <label>Conta Bancária</label>
                        <select
                            value={selectedBankId}
                            onChange={(e) => setSelectedBankId(e.target.value)}
                            className={styles.paySelect}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        >
                            <option value="">Selecione uma conta...</option>
                            {bankAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.nickname || acc.bankName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.payActions} style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <Button variant="secondary" onClick={() => setShowPayModal(false)} fullWidth>
                            Cancelar
                        </Button>
                        <Button onClick={handlePay} disabled={paying || !selectedBankId} fullWidth>
                            {paying ? 'Processando...' : 'Confirmar Pagamento'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AppShell >
    );
}
