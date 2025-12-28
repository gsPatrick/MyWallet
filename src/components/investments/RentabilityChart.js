'use client';

import { useState, useEffect } from 'react';
import { FiTrendingUp, FiAlertCircle, FiPercent, FiDollarSign } from 'react-icons/fi';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { investmentsAPI } from '@/services/api';
import styles from './RentabilityChart.module.css';

const PERIOD_OPTIONS = [
    { id: '1M', label: '1M', months: 1 },
    { id: '3M', label: '3M', months: 3 },
    { id: '6M', label: '6M', months: 6 },
    { id: '1A', label: '1A', months: 12 },
    { id: 'TOTAL', label: 'Total', months: 60 },
];

const VIEW_MODES = [
    { id: 'percent', label: 'Rentabilidade %', icon: FiPercent },
    { id: 'absolute', label: 'Evolução R$', icon: FiDollarSign }
];

export default function RentabilityChart() {
    const [selectedPeriod, setSelectedPeriod] = useState('1A');
    const [viewMode, setViewMode] = useState('absolute'); // 'percent' or 'absolute'
    const [evolutionData, setEvolutionData] = useState([]);
    const [summary, setSummary] = useState({ returnPercent: 0, cdiPercent: 0, cdiForPeriod: 0 });
    const [hasRealData, setHasRealData] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadEvolutionData();
    }, [selectedPeriod]);

    const loadEvolutionData = async () => {
        setLoading(true);
        setError(null);

        try {
            const period = PERIOD_OPTIONS.find(p => p.id === selectedPeriod);
            const { data } = await investmentsAPI.getEvolution(period?.months || 12);

            setEvolutionData(data.data || []);
            setSummary(data.summary || { returnPercent: 0, cdiPercent: 0, cdiForPeriod: 0 });
            setHasRealData(data.hasRealData || false);
        } catch (err) {
            console.error('Error loading evolution data:', err);
            setError('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    if (loading && evolutionData.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Carregando rentabilidade...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <FiAlertCircle /> {error}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Rentabilidade</h3>
                <div className={styles.headerControls}>
                    {/* View Mode Toggle */}
                    <div className={styles.viewModeToggle}>
                        {VIEW_MODES.map(mode => {
                            const Icon = mode.icon;
                            return (
                                <button
                                    key={mode.id}
                                    className={`${styles.viewModeBtn} ${viewMode === mode.id ? styles.viewModeActive : ''}`}
                                    onClick={() => setViewMode(mode.id)}
                                    title={mode.label}
                                >
                                    <Icon />
                                </button>
                            );
                        })}
                    </div>
                    {/* Period Selector */}
                    <div className={styles.periodSelector}>
                        {PERIOD_OPTIONS.map(p => (
                            <button
                                key={p.id}
                                className={`${styles.periodBtn} ${selectedPeriod === p.id ? styles.periodActive : ''}`}
                                onClick={() => setSelectedPeriod(p.id)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.metrics}>
                <div className={styles.metricItem}>
                    <span className={styles.metricValue}>
                        <FiTrendingUp className={summary.returnPercent >= 0 ? styles.positive : styles.negative} />
                        {summary.returnPercent >= 0 ? '+' : ''}{summary.returnPercent?.toFixed(2)}%
                    </span>
                    <span className={styles.metricLabel}>Rentabilidade</span>
                </div>
                <div className={styles.metricItem}>
                    <span className={styles.metricValue}>
                        {summary.cdiPercent?.toFixed(0)}% do CDI
                    </span>
                    <span className={styles.metricLabel}>CDI: {summary.cdiForPeriod?.toFixed(1) || '0'}%</span>
                </div>
            </div>

            {!hasRealData && (
                <div className={styles.mockDataWarning}>
                    ⚠️ Dados simulados. Snapshots históricos ainda não disponíveis.
                </div>
            )}

            <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={viewMode === 'percent' ? '#10b981' : '#6366f1'} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={viewMode === 'percent' ? '#10b981' : '#6366f1'} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="displayDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            hide={true}
                            domain={viewMode === 'percent' ? ['dataMin', 'dataMax'] : ['dataMin - 1000', 'dataMax + 1000']}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload?.length) {
                                    const dataPoint = payload[0].payload;
                                    return (
                                        <div className={styles.tooltip}>
                                            <span className={styles.tooltipDate}>{label}</span>
                                            {viewMode === 'percent' ? (
                                                <>
                                                    <span className={styles.tooltipValue}>
                                                        {dataPoint.profitPercent?.toFixed(2) || '0'}%
                                                    </span>
                                                    <span className={styles.tooltipSub}>
                                                        Lucro: {formatCurrency(dataPoint.profit || 0)}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className={styles.tooltipValue}>
                                                        {formatCurrency(payload[0].value)}
                                                    </span>
                                                    <span className={styles.tooltipSub}>
                                                        Investido: {formatCurrency(dataPoint.invested || 0)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey={viewMode === 'percent' ? 'profitPercent' : 'value'}
                            stroke={viewMode === 'percent' ? '#10b981' : '#6366f1'}
                            strokeWidth={2}
                            fill="url(#colorValue)"
                            dot={false}
                            activeDot={{ r: 4, fill: viewMode === 'percent' ? '#10b981' : '#6366f1' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

