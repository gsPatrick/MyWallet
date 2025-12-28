'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    FiArrowLeft, FiTarget, FiTrendingUp, FiDollarSign,
    FiCalendar, FiPercent, FiDownload
} from 'react-icons/fi';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { usePrivateCurrency } from '@/components/ui/PrivateValue';
import { investmentsAPI } from '@/services/api';
import styles from './page.module.css';


function SimulatorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { formatCurrency } = usePrivateCurrency();

    // Pre-fill from URL params
    const tickerParam = searchParams.get('ticker');
    const priceParam = parseFloat(searchParams.get('price')) || 0;
    const dyParam = parseFloat(searchParams.get('dy')) || 0;
    const quantityParam = parseInt(searchParams.get('qty')) || 0;
    const indexerParam = searchParams.get('indexer');
    const rateParam = parseFloat(searchParams.get('rate')) || 0; // Taxa contratada (Ex: 100% do CDI, IPCA + 6%)

    // Economic Indicators
    const [indicators, setIndicators] = useState({ selic: 11.25, cdi: 11.15, ipca: 4.50 }); // Defaults/Fallback
    const [loadingIndicators, setLoadingIndicators] = useState(true);

    // Initial load logic will be handled in useEffect

    // Simulator inputs
    const [monthlyAmount, setMonthlyAmount] = useState(1000);
    const [interestRate, setInterestRate] = useState(1.0); // % a.m.
    const [years, setYears] = useState(20);

    // Fetch Indicators
    useEffect(() => {
        const fetchIndicators = async () => {
            try {
                const today = new Date();
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);
                const formatDate = (d) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

                // Fetch cached/latest
                const [selicRes, cdiRes, ipcaRes] = await Promise.all([
                    fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json&dataInicial=${formatDate(thirtyDaysAgo)}&dataFinal=${formatDate(today)}`).then(r => r.json()).catch(() => []),
                    fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${formatDate(thirtyDaysAgo)}&dataFinal=${formatDate(today)}`).then(r => r.json()).catch(() => []),
                    fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados?formato=json&ultimo=1`).then(r => r.json()).catch(() => [])
                ]);

                // Update state if data exists
                setIndicators(prev => ({
                    selic: selicRes.length ? parseFloat(selicRes[selicRes.length - 1].valor) : prev.selic,
                    cdi: cdiRes.length ? parseFloat(cdiRes[cdiRes.length - 1].valor) : prev.cdi,
                    ipca: ipcaRes.length ? parseFloat(ipcaRes[ipcaRes.length - 1].valor) : prev.ipca
                }));
            } catch (e) {
                console.error("Erro fetching indicators within simulator", e);
            } finally {
                setLoadingIndicators(false);
            }
        };
        fetchIndicators();
    }, []);

    // Auto-Calculate Rate based on Params
    useEffect(() => {
        if (!loadingIndicators) {
            let annualRate = 0;
            if (indexerParam === 'CDI') {
                // Ex: 100% of CDI -> 1.0 * 11.15 = 11.15
                // Ex: 110% of CDI -> 1.1 * 11.15 = 12.26
                const multiplier = rateParam ? (rateParam / 100) : 1;
                annualRate = multiplier * indicators.cdi;
            } else if (indexerParam === 'IPCA') {
                // Ex: IPCA + 6% -> 4.5 + 6 = 10.5
                annualRate = indicators.ipca + rateParam;
            } else if (indexerParam === 'PREFIXADO') {
                annualRate = rateParam;
            } else if (dyParam > 0) {
                // Convert DY annual usually provided or calculate from monthly
                // Assuming DY param is annual %
                annualRate = dyParam;
            }

            if (annualRate > 0) {
                // Convert Annual to Monthly: (1 + i)^(1/12) - 1
                const monthly = (Math.pow(1 + (annualRate / 100), 1 / 12) - 1) * 100;
                setInterestRate(monthly.toFixed(2));
            }
        }
    }, [indexerParam, rateParam, dyParam, indicators, loadingIndicators]);


    // Magic Number (if ticker provided)
    const magicNumber = useMemo(() => {
        if (!priceParam || !dyParam) return null;
        const monthlyDY = dyParam / 100 / 12;
        const estimatedMonthlyDividend = monthlyDY * priceParam;
        if (estimatedMonthlyDividend <= 0) return null;
        return {
            value: Math.ceil(priceParam / estimatedMonthlyDividend),
            monthlyDividend: estimatedMonthlyDividend
        };
    }, [priceParam, dyParam]);

    const magicProgress = useMemo(() => {
        if (!magicNumber || !quantityParam) return 0;
        return Math.min((quantityParam / magicNumber.value) * 100, 100);
    }, [magicNumber, quantityParam]);

    // Compound Interest Calculation
    const tableData = useMemo(() => {
        const months = years * 12;
        const monthlyRate = parseFloat(interestRate) / 100;
        const data = [];

        let totalContributions = 0;
        let totalInterest = 0;
        let accumulated = 0;

        for (let m = 0; m <= months; m++) {
            // Monthly interest on current balance
            const interestThisMonth = accumulated * monthlyRate;
            totalInterest += interestThisMonth;
            accumulated += interestThisMonth;

            // Add contribution
            totalContributions += monthlyAmount;
            accumulated += monthlyAmount;

            data.push({
                month: m,
                year: Math.floor(m / 12),
                contributions: totalContributions,
                interestMonth: interestThisMonth,
                interestTotal: totalInterest,
                accumulated: accumulated
            });
        }

        return data;
    }, [monthlyAmount, interestRate, years]);

    // Chart data (sampled for performance)
    const chartData = useMemo(() => {
        return tableData.filter((d, i) =>
            i === 0 || d.month % 12 === 0 || i === tableData.length - 1
        ).map(d => ({
            ...d,
            label: d.month === 0 ? 'Início' : `${d.year}A`
        }));
    }, [tableData]);

    const finalValues = useMemo(() => {
        const last = tableData[tableData.length - 1];
        return {
            contributions: last?.contributions || 0,
            interest: last?.interestTotal || 0,
            total: last?.accumulated || 0
        };
    }, [tableData]);

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Header */}
                    <div className={styles.header}>
                        <button
                            className={styles.backButton}
                            onClick={() => router.back()}
                        >
                            <FiArrowLeft />
                            <span>Voltar</span>
                        </button>
                        <div className={styles.titleArea}>
                            <h1>Simulador de Investimentos</h1>
                            {tickerParam && (
                                <span className={styles.tickerBadge}>{tickerParam}</span>
                            )}
                        </div>
                    </div>

                    <div className={styles.grid}>
                        {/* Left Column - Inputs */}
                        <div className={styles.leftColumn}>
                            {/* Magic Number Card (if applicable) */}
                            {magicNumber && (
                                <Card className={styles.magicCard}>
                                    <div className={styles.cardHeader}>
                                        <FiTarget className={styles.cardIcon} />
                                        <h3>Número Mágico</h3>
                                    </div>
                                    <div className={styles.magicDisplay}>
                                        <span className={styles.magicValue}>{magicNumber.value}</span>
                                        <span className={styles.magicLabel}>cotas</span>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <motion.div
                                            className={styles.progressFill}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${magicProgress}%` }}
                                        />
                                    </div>
                                    <p className={styles.progressText}>
                                        {quantityParam} / {magicNumber.value} ({magicProgress.toFixed(0)}%)
                                    </p>
                                    <p className={styles.magicExplanation}>
                                        Com <strong>{magicNumber.value} cotas</strong>, seus dividendos mensais
                                        compram automaticamente mais 1 cota!
                                    </p>
                                </Card>
                            )}

                            {/* Input Card */}
                            <Card className={styles.inputCard}>
                                <div className={styles.cardHeader}>
                                    <FiDollarSign className={styles.cardIcon} />
                                    <h3>Parâmetros</h3>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>
                                        <FiDollarSign />
                                        Aporte Mensal
                                    </label>
                                    <div className={styles.inputWrapper}>
                                        <span className={styles.inputPrefix}>R$</span>
                                        <input
                                            type="number"
                                            value={monthlyAmount}
                                            onChange={(e) => setMonthlyAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                                            min="0"
                                            step="100"
                                        />
                                    </div>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>
                                        <FiPercent />
                                        Taxa de Juros (mensal)
                                    </label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type="number"
                                            value={interestRate}
                                            onChange={(e) => setInterestRate(e.target.value)}
                                            min="0"
                                            max="10"
                                            step="0.1"
                                        />
                                        <span className={styles.inputSuffix}>% a.m.</span>
                                    </div>
                                    {/* Market Rate Badges */}
                                    <div className={styles.rateBadges}>
                                        <button className={styles.rateBadge} onClick={() => setInterestRate(((Math.pow(1 + (indicators.cdi / 100), 1 / 12) - 1) * 100).toFixed(2))}>
                                            CDI ({indicators.cdi}%)
                                        </button>
                                        <button className={styles.rateBadge} onClick={() => setInterestRate(((Math.pow(1 + (indicators.selic / 100), 1 / 12) - 1) * 100).toFixed(2))}>
                                            Selic ({indicators.selic}%)
                                        </button>
                                        <button className={styles.rateBadge} onClick={() => setInterestRate(((Math.pow(1 + (indicators.ipca / 100), 1 / 12) - 1) * 100).toFixed(2))}>
                                            IPCA ({indicators.ipca}%)
                                        </button>
                                    </div>
                                    <span className={styles.inputHint} style={{ fontSize: '0.7em', marginTop: '5px' }}>
                                        Equiv. Anual: {((Math.pow(1 + (parseFloat(interestRate) / 100), 12) - 1) * 100).toFixed(2)}%
                                    </span>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>
                                        <FiCalendar />
                                        Duração
                                    </label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type="number"
                                            value={years}
                                            onChange={(e) => setYears(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                                            min="1"
                                            max="30"
                                        />
                                        <span className={styles.inputSuffix}>anos</span>
                                    </div>
                                    <span className={styles.inputHint}>= {years * 12} meses</span>
                                </div>
                            </Card>

                            {/* Summary Cards */}
                            <div className={styles.summaryCards}>
                                <Card className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Total Investido</span>
                                    <span className={styles.summaryValue}>
                                        {formatCurrency(finalValues.contributions)}
                                    </span>
                                </Card>
                                <Card className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Juros Ganhos</span>
                                    <span className={`${styles.summaryValue} ${styles.profit}`}>
                                        +{formatCurrency(finalValues.interest)}
                                    </span>
                                </Card>
                                <Card className={`${styles.summaryCard} ${styles.highlight}`}>
                                    <span className={styles.summaryLabel}>Total Acumulado</span>
                                    <span className={styles.summaryValueLarge}>
                                        {formatCurrency(finalValues.total)}
                                    </span>
                                </Card>
                            </div>
                        </div>

                        {/* Right Column - Chart & Table */}
                        <div className={styles.rightColumn}>
                            {/* Chart Card */}
                            <Card className={styles.chartCard}>
                                <div className={styles.cardHeader}>
                                    <FiTrendingUp className={styles.cardIcon} />
                                    <h3>Evolução do Patrimônio</h3>
                                </div>
                                <div className={styles.chartWrapper}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorAccumulated" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--accent-success)" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="var(--accent-success)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="label"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                            />
                                            <YAxis hide domain={['dataMin', 'dataMax']} />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload?.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className={styles.tooltip}>
                                                                <span>Mês {data.month}</span>
                                                                <span>Acumulado: {formatCurrency(data.accumulated)}</span>
                                                                <span>Juros: {formatCurrency(data.interestTotal)}</span>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="accumulated"
                                                stroke="var(--accent-success)"
                                                strokeWidth={2}
                                                fill="url(#colorAccumulated)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            {/* Table Card */}
                            <Card className={styles.tableCard}>
                                <div className={styles.cardHeader}>
                                    <h3>Tabela Detalhada</h3>
                                </div>
                                <div className={styles.tableWrapper}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Mês</th>
                                                <th>Aportes</th>
                                                <th>Juros/Mês</th>
                                                <th>Juros Total</th>
                                                <th>Acumulado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableData.map((row) => (
                                                <tr
                                                    key={row.month}
                                                    className={row.month % 12 === 0 && row.month > 0 ? styles.yearRow : ''}
                                                >
                                                    <td>{row.month}</td>
                                                    <td>{formatCurrency(row.contributions)}</td>
                                                    <td>{formatCurrency(row.interestMonth)}</td>
                                                    <td className={styles.profit}>{formatCurrency(row.interestTotal)}</td>
                                                    <td className={styles.bold}>{formatCurrency(row.accumulated)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            <Dock />
        </div>
    );
}

export default function SimulatorPage() {
    return (
        <Suspense fallback={<div className={styles.loadingState}>Carregando simulador...</div>}>
            <SimulatorContent />
        </Suspense>
    );
}
