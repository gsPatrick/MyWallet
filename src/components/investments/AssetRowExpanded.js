'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    FiTarget, FiTrendingUp, FiTrendingDown, FiDollarSign,
    FiPlus, FiMaximize2, FiAlertTriangle, FiCheckCircle,
    FiActivity, FiUsers, FiLayers, FiPieChart
} from 'react-icons/fi';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import Button from '@/components/ui/Button';
import styles from './AssetRowExpanded.module.css';

// P/VP Status badge colors
const PVP_STATUS = {
    DISCOUNT: { label: 'Com Desconto', color: '#10b981', icon: <FiTrendingDown /> },
    FAIR: { label: 'Preço Justo', color: '#f59e0b', icon: <FiCheckCircle /> },
    PREMIUM: { label: 'Com Prêmio', color: '#ef4444', icon: <FiTrendingUp /> },
    UNKNOWN: { label: 'N/A', color: '#6b7280', icon: null }
};

// Risk level colors
const RISK_LEVELS = {
    LOW: { label: 'Baixo', color: '#10b981' },
    MEDIUM: { label: 'Médio', color: '#f59e0b' },
    HIGH: { label: 'Alto', color: '#ef4444' },
    UNKNOWN: { label: 'N/A', color: '#6b7280' }
};

// Dividend trend icons
const TREND_ICONS = {
    RISING: { icon: <FiTrendingUp />, color: '#10b981', label: 'Em Alta' },
    STABLE: { icon: <FiActivity />, color: '#f59e0b', label: 'Estável' },
    FALLING: { icon: <FiTrendingDown />, color: '#ef4444', label: 'Em Queda' },
    UNKNOWN: { icon: null, color: '#6b7280', label: 'N/A' }
};

/**
 * AssetRowExpanded - Complete investment analysis panel
 * Now includes FII-specific analytics from Funds Explorer
 */
export default function AssetRowExpanded({
    position,
    formatCurrency,
    onTradeClick
}) {
    const router = useRouter();
    const [monthlyContribution, setMonthlyContribution] = useState(1);
    const [years, setYears] = useState(5);

    const isFII = position.type === 'FII';
    const isETF = position.type === 'ETF';
    const isStock = position.type === 'STOCK' || position.type === 'BDR';
    const isFixedIncome = position.source === 'FIXED_INCOME' || position.type === 'RENDA_FIXA';
    const hasDividends = position.hasDividends !== false;
    const fiiAnalytics = position.fiiAnalytics;
    const stockAnalytics = position.stockAnalytics;

    // Magic Number Calculation
    const magicNumber = useMemo(() => {
        const lastDividend = position.lastDividendPerShare;

        if (!lastDividend || lastDividend <= 0) {
            if (position.dividendYield > 0 && position.currentPrice > 0) {
                const estimatedMonthlyDividend = (position.dividendYield / 100 / 12) * position.currentPrice;
                if (estimatedMonthlyDividend > 0) {
                    return {
                        value: Math.ceil(position.currentPrice / estimatedMonthlyDividend),
                        isEstimate: true,
                        monthlyDividend: estimatedMonthlyDividend
                    };
                }
            }
            return null;
        }

        return {
            value: Math.ceil(position.currentPrice / lastDividend),
            isEstimate: false,
            monthlyDividend: lastDividend
        };
    }, [position]);

    const magicProgress = useMemo(() => {
        if (!magicNumber || !position.quantity) return 0;
        return Math.min((position.quantity / magicNumber.value) * 100, 100);
    }, [magicNumber, position.quantity]);

    const quotasRemaining = useMemo(() => {
        if (!magicNumber) return 0;
        return Math.max(0, magicNumber.value - position.quantity);
    }, [magicNumber, position.quantity]);

    // Compound Interest Simulation
    const simulationData = useMemo(() => {
        const months = years * 12;
        const currentPrice = position.currentPrice || 0;
        const monthlyDY = (position.dividendYield || 0) / 100 / 12;

        const data = [];
        let totalQuotas = position.quantity || 0;
        let totalInvested = totalQuotas * (position.averagePrice || currentPrice);

        for (let m = 0; m <= months; m++) {
            const monthlyDividend = totalQuotas * monthlyDY * currentPrice;

            if (m > 0) {
                totalQuotas += monthlyContribution;
                totalInvested += monthlyContribution * currentPrice;
            }

            const patrimonialValue = totalQuotas * currentPrice;

            if (m === 0 || m % 6 === 0 || m === months) {
                data.push({
                    month: m,
                    displayMonth: m === 0 ? 'Hoje' : `${Math.floor(m / 12)}A ${m % 12}M`,
                    patrimonio: patrimonialValue,
                    rendaPassiva: monthlyDividend,
                    totalQuotas: Math.floor(totalQuotas)
                });
            }
        }

        return {
            chartData: data,
            finalPatrimony: data[data.length - 1]?.patrimonio || 0,
            finalMonthlyIncome: data[data.length - 1]?.rendaPassiva || 0,
            finalQuotas: data[data.length - 1]?.totalQuotas || 0
        };
    }, [position, monthlyContribution, years]);

    const handleTrade = () => {
        if (onTradeClick) {
            onTradeClick({
                ticker: position.ticker,
                price: position.currentPrice,
                type: 'BUY'
            });
        }
    };

    const handleOpenFullSimulator = () => {
        const params = new URLSearchParams({
            ticker: position.ticker,
            price: position.currentPrice || 0,
            dy: position.dividendYield || 0,
            qty: position.quantity || 0,
            indexer: position.indexer || '',
            rate: position.rate || '',
            type: position.type || ''
        });
        router.push(`/investments/simulator?${params.toString()}`);
    };

    // Format large numbers
    const formatLargeNumber = (num) => {
        if (!num) return 'N/A';
        if (num >= 1000000000) return `R$ ${(num / 1000000000).toFixed(1)}B`;
        if (num >= 1000000) return `R$ ${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `R$ ${(num / 1000).toFixed(0)}K`;
        return formatCurrency(num);
    };

    // Format Indexer Display
    const formatIndexerDisplay = (pos) => {
        if (!pos.indexer) return 'N/A';
        if (pos.indexer === 'PREFIXADO') return `${pos.rate || 0}% a.a.`;
        if (pos.indexer === 'CDI') {
            const bonus = parseFloat(pos.indexerBonus) > 0 ? ` + ${pos.indexerBonus}%` : '';
            return `${pos.rate || 100}% do CDI${bonus}`;
        }
        if (pos.indexer === 'IPCA') return `IPCA + ${pos.rate || 0}%`;
        return pos.indexer;
    };

    return (
        <div className={styles.container}>
            {/* FII Analytics Panel - Only for FIIs */}
            {isFII && fiiAnalytics && (
                <div className={styles.fiiAnalyticsPanel}>
                    <div className={styles.analyticsHeader}>
                        <FiPieChart className={styles.icon} />
                        <h4>Análise do FII</h4>
                        {fiiAnalytics.segment && (
                            <span className={styles.segmentBadge}>{fiiAnalytics.segment}</span>
                        )}
                    </div>

                    <div className={styles.analyticsGrid}>
                        {/* P/VP Status */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>P/VP</span>
                            <div className={styles.metricValue}>
                                {fiiAnalytics.pvp ? fiiAnalytics.pvp.toFixed(2) : 'N/A'}
                                {fiiAnalytics.pvpStatus && fiiAnalytics.pvpStatus !== 'UNKNOWN' && (
                                    <span
                                        className={styles.statusBadge}
                                        style={{ backgroundColor: PVP_STATUS[fiiAnalytics.pvpStatus]?.color }}
                                    >
                                        {PVP_STATUS[fiiAnalytics.pvpStatus]?.label}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* DY Mensal */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>DY Mensal</span>
                            <span className={styles.metricValue}>
                                {fiiAnalytics.dividendYieldMonth
                                    ? `${fiiAnalytics.dividendYieldMonth.toFixed(2)}%`
                                    : 'N/A'
                                }
                            </span>
                        </div>

                        {/* Tendência */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Tendência</span>
                            <div className={styles.metricValue}>
                                {fiiAnalytics.dividendTrend && TREND_ICONS[fiiAnalytics.dividendTrend] && (
                                    <span
                                        className={styles.trendIndicator}
                                        style={{ color: TREND_ICONS[fiiAnalytics.dividendTrend].color }}
                                    >
                                        {TREND_ICONS[fiiAnalytics.dividendTrend].icon}
                                        {TREND_ICONS[fiiAnalytics.dividendTrend].label}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Nível de Risco */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Risco</span>
                            <span
                                className={styles.riskBadge}
                                style={{ backgroundColor: RISK_LEVELS[fiiAnalytics.riskLevel]?.color }}
                            >
                                {RISK_LEVELS[fiiAnalytics.riskLevel]?.label}
                            </span>
                        </div>

                        {/* Liquidez */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>
                                <FiActivity size={12} /> Liquidez/dia
                            </span>
                            <span className={styles.metricValue}>
                                {formatLargeNumber(fiiAnalytics.dailyLiquidity)}
                            </span>
                        </div>

                        {/* Cotistas */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>
                                <FiUsers size={12} /> Cotistas
                            </span>
                            <span className={styles.metricValue}>
                                {fiiAnalytics.shareholders
                                    ? fiiAnalytics.shareholders.toLocaleString('pt-BR')
                                    : 'N/A'
                                }
                            </span>
                        </div>

                        {/* Consistência */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Consistência</span>
                            <span className={styles.metricValue}>
                                {fiiAnalytics.paymentConsistency
                                    ? `${fiiAnalytics.paymentConsistency.toFixed(0)}%`
                                    : 'N/A'
                                }
                            </span>
                        </div>

                        {/* Patrimônio */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>
                                <FiLayers size={12} /> Patrimônio
                            </span>
                            <span className={styles.metricValue}>
                                {formatLargeNumber(fiiAnalytics.netWorth)}
                            </span>
                        </div>

                        {/* Renda Projetada (baseado no DY e quantidade) */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>
                                <FiDollarSign size={12} /> Renda/mês (Est.)
                            </span>
                            <span className={`${styles.metricValue} ${styles.highlight}`}>
                                {position.quantity && fiiAnalytics.lastDividend
                                    ? formatCurrency(position.quantity * fiiAnalytics.lastDividend)
                                    : fiiAnalytics.dividendYieldMonth && position.currentPrice
                                        ? formatCurrency((fiiAnalytics.dividendYieldMonth / 100) * position.currentBalance)
                                        : 'N/A'
                                }
                            </span>
                        </div>

                        {/* Próximo Dividendo */}
                        {fiiAnalytics.lastDividendDate && (
                            <div className={styles.metricCard}>
                                <span className={styles.metricLabel}>Próx. Dividendo (Est.)</span>
                                <span className={styles.metricValue}>
                                    {(() => {
                                        // Estima próximo dividendo: ~30 dias após o último
                                        const lastDate = new Date(fiiAnalytics.lastDividendDate);
                                        const nextDate = new Date(lastDate);
                                        nextDate.setMonth(nextDate.getMonth() + 1);
                                        const now = new Date();
                                        if (nextDate < now) nextDate.setMonth(now.getMonth() + 1);
                                        return nextDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                                    })()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ETF Info Panel - Only for ETFs */}
            {isETF && (
                <div className={styles.etfInfoPanel}>
                    <div className={styles.analyticsHeader}>
                        <FiActivity className={styles.icon} />
                        <h4>Informações do ETF</h4>
                        <span className={styles.segmentBadge}>ETF</span>
                    </div>
                    <div className={styles.etfMessage}>
                        <FiAlertTriangle size={16} />
                        <div>
                            <strong>Este ativo não distribui dividendos</strong>
                            <p>{position.dividendMessage || 'Dividendos são reinvestidos automaticamente no preço da cota. Os ganhos são refletidos na valorização do ativo.'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock/BDR Analytics Panel - Only for STOCK/BDR with stockAnalytics */}
            {isStock && stockAnalytics && (
                <div className={styles.stockAnalyticsPanel}>
                    <div className={styles.analyticsHeader}>
                        <FiTrendingUp className={styles.icon} />
                        <h4>Análise Fundamentalista</h4>
                        {stockAnalytics.sector && (
                            <span className={styles.segmentBadge}>{stockAnalytics.sector}</span>
                        )}
                        {stockAnalytics.originalCurrency && stockAnalytics.originalCurrency !== 'BRL' && (
                            <span className={styles.currencyBadge} title={`Taxa: R$ ${stockAnalytics.exchangeRateUsed?.toFixed(2)}`}>
                                USD {stockAnalytics.originalPrice}
                            </span>
                        )}
                    </div>

                    <div className={styles.analyticsGrid}>
                        {/* P/L */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>P/L</span>
                            <span className={styles.metricValue}>
                                {stockAnalytics.trailingPE
                                    ? stockAnalytics.trailingPE.toFixed(2)
                                    : 'N/A'}
                            </span>
                        </div>

                        {/* P/VP */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>P/VP</span>
                            <span className={styles.metricValue}>
                                {stockAnalytics.priceToBook
                                    ? stockAnalytics.priceToBook.toFixed(2)
                                    : 'N/A'}
                            </span>
                        </div>

                        {/* Market Cap */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Market Cap</span>
                            <span className={styles.metricValue}>
                                {formatLargeNumber(stockAnalytics.marketCap)}
                            </span>
                        </div>

                        {/* LPA (EPS) */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>LPA</span>
                            <span className={styles.metricValue}>
                                {stockAnalytics.epsTrailingTwelveMonths
                                    ? `R$ ${stockAnalytics.epsTrailingTwelveMonths.toFixed(2)}`
                                    : 'N/A'}
                            </span>
                        </div>

                        {/* VPA (Book Value) */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>VPA</span>
                            <span className={styles.metricValue}>
                                {stockAnalytics.bookValue
                                    ? `R$ ${stockAnalytics.bookValue.toFixed(2)}`
                                    : 'N/A'}
                            </span>
                        </div>

                        {/* 52 Week Range */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>52 Semanas</span>
                            <span className={styles.metricValue} style={{ fontSize: '0.75rem' }}>
                                {stockAnalytics.fiftyTwoWeekLow && stockAnalytics.fiftyTwoWeekHigh
                                    ? `R$ ${stockAnalytics.fiftyTwoWeekLow.toFixed(2)} - ${stockAnalytics.fiftyTwoWeekHigh.toFixed(2)}`
                                    : 'N/A'}
                            </span>
                        </div>

                        {/* Volume Médio */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Vol. Médio (3M)</span>
                            <span className={styles.metricValue}>
                                {stockAnalytics.averageDailyVolume3Month
                                    ? `${(stockAnalytics.averageDailyVolume3Month / 1000000).toFixed(1)}M`
                                    : 'N/A'}
                            </span>
                        </div>

                        {/* Rating Analistas */}
                        {stockAnalytics.averageAnalystRating && (
                            <div className={styles.metricCard}>
                                <span className={styles.metricLabel}>Rating</span>
                                <span className={styles.metricValue} style={{
                                    color: stockAnalytics.averageAnalystRating.includes('Buy') ? '#10b981' :
                                        stockAnalytics.averageAnalystRating.includes('Sell') ? '#ef4444' : '#f59e0b'
                                }}>
                                    {stockAnalytics.averageAnalystRating}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Setor e Indústria */}
                    {stockAnalytics.industry && (
                        <div className={styles.sectorInfo}>
                            <span>Indústria: {stockAnalytics.industry}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Fixed Income Panel */}
            {isFixedIncome && (
                <div className={styles.stockAnalyticsPanel}>
                    <div className={styles.analyticsHeader}>
                        <FiTrendingUp className={styles.icon} />
                        <h4>Detalhes da Renda Fixa</h4>
                        <span className={styles.segmentBadge}>{position.indexerDescription || position.indexer}</span>
                    </div>

                    <div className={styles.analyticsGrid}>
                        {/* Taxa Contratada */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Taxa Contratada</span>
                            <span className={styles.metricValue}>
                                {position.indexerDescription || formatIndexerDisplay(position)}
                            </span>
                        </div>

                        {/* Taxa Efetiva (Calculada) */}
                        {position.rateUsed > 0 && (
                            <div className={styles.metricCard}>
                                <span className={styles.metricLabel}>Taxa Efetiva (Anual)</span>
                                <span className={styles.metricValue} style={{ color: '#10b981' }}>
                                    {position.rateUsed}%
                                </span>
                            </div>
                        )}

                        {/* Dias Decorridos */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Prazo Decorrido</span>
                            <span className={styles.metricValue}>
                                {position.daysPassed || 0} dias
                            </span>
                        </div>

                        {/* Vencimento */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Vencimento</span>
                            <span className={styles.metricValue}>
                                {position.maturityDate ? new Date(position.maturityDate).toLocaleDateString('pt-BR') : 'N/A'}
                            </span>
                        </div>

                        {/* Liquidez */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Liquidez</span>
                            <span className={styles.metricValue}>
                                {position.liquidity || 'No Vencimento'}
                            </span>
                        </div>

                        {/* Rentabilidade Absoluta */}
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Lucro Acumulado</span>
                            <span className={styles.metricValue} style={{ color: '#10b981' }}>
                                {formatCurrency(position.profit)}
                            </span>
                        </div>
                    </div>

                    <div className={styles.sectorInfo}>
                        <span>Valor atualizado automaticamente com base nas taxas de mercado (CDI/IPCA/Selic).</span>
                    </div>
                </div>
            )}

            {/* === RENTABILITY BREAKDOWN (AUDITÁVEL) === */}
            {position.rentability?.breakdown && (
                <div className={styles.rentabilityPanel}>
                    <div className={styles.analyticsHeader}>
                        <FiTrendingUp className={styles.icon} />
                        <h4>Rentabilidade Real</h4>
                        <span
                            className={`${styles.returnBadge} ${position.rentability.totalReturnPercent >= 0 ? styles.positive : styles.negative}`}
                        >
                            {position.rentability.totalReturnPercent >= 0 ? '+' : ''}
                            {position.rentability.totalReturnPercent?.toFixed(2)}%
                        </span>
                    </div>
                    <div className={styles.breakdownGrid}>
                        <div className={styles.breakdownItem}>
                            <span className={styles.breakdownLabel}>Capital Investido</span>
                            <span className={styles.breakdownValue}>
                                {formatCurrency(position.rentability.breakdown.investedCapital)}
                            </span>
                        </div>
                        <div className={styles.breakdownItem}>
                            <span className={styles.breakdownLabel}>Valor Atual</span>
                            <span className={styles.breakdownValue}>
                                {formatCurrency(position.rentability.breakdown.currentValue)}
                            </span>
                        </div>
                        <div className={styles.breakdownItem}>
                            <span className={styles.breakdownLabel}>Valorização</span>
                            <span className={`${styles.breakdownValue} ${position.rentability.breakdown.capitalGain >= 0 ? styles.positive : styles.negative}`}>
                                {position.rentability.breakdown.capitalGain >= 0 ? '+' : ''}
                                {formatCurrency(position.rentability.breakdown.capitalGain)}
                            </span>
                        </div>
                        <div className={styles.breakdownItem}>
                            <span className={styles.breakdownLabel}>Dividendos Recebidos</span>
                            <span className={`${styles.breakdownValue} ${styles.positive}`}>
                                +{formatCurrency(position.rentability.breakdown.dividendsReceived)}
                            </span>
                        </div>
                    </div>
                    <div className={styles.formulaBox}>
                        <span className={styles.formulaLabel}>Cálculo:</span>
                        <code>{position.rentability.breakdown.calculation}</code>
                    </div>
                </div>
            )}

            {/* === RISCO EXPLICÁVEL === */}
            {position.risk && position.risk.reasons?.length > 0 && (
                <div className={`${styles.riskPanel} ${styles[`risk${position.risk.level}`]}`}>
                    <div className={styles.analyticsHeader}>
                        <FiAlertTriangle className={styles.icon} />
                        <h4>Análise de Risco</h4>
                        <span
                            className={styles.riskBadge}
                            style={{ backgroundColor: RISK_LEVELS[position.risk.level]?.color }}
                        >
                            {RISK_LEVELS[position.risk.level]?.label}
                        </span>
                    </div>
                    <ul className={styles.riskReasons}>
                        {position.risk.reasons.map((reason, idx) => (
                            <li key={idx}>
                                {position.risk.level === 'HIGH' ? <FiAlertTriangle /> : <FiCheckCircle />}
                                {reason}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* === CONCENTRAÇÃO NA CARTEIRA === */}
            {position.concentration && (
                <div className={styles.concentrationBox}>
                    <FiPieChart />
                    <span>Este ativo representa <strong>{position.concentration.percentage?.toFixed(1)}%</strong> da sua carteira</span>
                    {position.concentration.percentage > 25 && (
                        <span className={styles.warningText}>⚠️ Concentração elevada</span>
                    )}
                </div>
            )}

            <div className={styles.columnsWrapper}>
                {/* Left Column - Magic Number */}
                <div className={styles.column}>
                    <div className={styles.columnHeader}>
                        <FiTarget className={styles.icon} />
                        <h4>Número Mágico</h4>
                        {magicNumber?.isEstimate && (
                            <span className={styles.estimateBadge}>Estimado</span>
                        )}
                    </div>

                    {magicNumber ? (
                        <>
                            <div className={styles.magicNumberDisplay}>
                                <span className={styles.magicValue}>{magicNumber.value}</span>
                                <span className={styles.magicLabel}>cotas</span>
                            </div>

                            <div className={styles.progressContainer}>
                                <div className={styles.progressBar}>
                                    <motion.div
                                        className={styles.progressFill}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${magicProgress}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                    />
                                </div>
                                <div className={styles.progressLabel}>
                                    <span>{position.quantity} / {magicNumber.value}</span>
                                    <span>{magicProgress.toFixed(0)}%</span>
                                </div>
                            </div>

                            <div className={styles.magicMessage}>
                                {quotasRemaining > 0 ? (
                                    <>
                                        <p>
                                            Faltam <strong>{quotasRemaining}</strong> cotas
                                            para o <span className={styles.highlight}>efeito bola de neve</span>!
                                        </p>
                                        <span className={styles.subMessage}>
                                            Dividendo estimado: {formatCurrency(magicNumber.monthlyDividend)}/cota
                                        </span>
                                    </>
                                ) : (
                                    <p className={styles.successMessage}>
                                        🎉 <strong>Parabéns!</strong> Este ativo já se compra sozinho todo mês!
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className={styles.noData}>
                            <FiAlertTriangle />
                            <p>Aguardando dados de dividendos...</p>
                            <span className={styles.noDataHint}>
                                O sistema atualiza automaticamente a cada 12 horas
                            </span>
                        </div>
                    )}
                </div>

                {/* Right Column - Simulator */}
                <div className={styles.column}>
                    <div className={styles.columnHeader}>
                        <FiTrendingUp className={styles.icon} />
                        <h4>Simulador de Futuro</h4>
                    </div>

                    <div className={styles.simulatorInputs}>
                        <div className={styles.inputGroup}>
                            <label>Comprando</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={monthlyContribution}
                                    onChange={(e) => setMonthlyContribution(Math.max(0, parseInt(e.target.value) || 0))}
                                />
                                <span>cotas/mês</span>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Por</label>
                            <div className={styles.sliderWrapper}>
                                <input
                                    type="range"
                                    min="1"
                                    max="30"
                                    value={years}
                                    onChange={(e) => setYears(parseInt(e.target.value))}
                                />
                                <span className={styles.sliderValue}>{years} anos</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height={120}>
                            <AreaChart data={simulationData.chartData}>
                                <defs>
                                    <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-success)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--accent-success)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="displayMonth"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                                />
                                <YAxis hide domain={['dataMin', 'dataMax']} />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload?.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className={styles.tooltip}>
                                                    <span>Patrimônio: {formatCurrency(data.patrimonio)}</span>
                                                    <span>Cotas: {data.totalQuotas}</span>
                                                    <span>Renda/mês: {formatCurrency(data.rendaPassiva)}</span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="patrimonio"
                                    stroke="var(--accent-success)"
                                    strokeWidth={2}
                                    fill="url(#colorPatrimonio)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className={styles.simulationResults}>
                        <div className={styles.resultItem}>
                            <FiDollarSign />
                            <div>
                                <span className={styles.resultValue}>
                                    {formatCurrency(simulationData.finalPatrimony)}
                                </span>
                                <span className={styles.resultLabel}>Patrimônio em {years} anos</span>
                            </div>
                        </div>
                        <div className={styles.resultItem}>
                            <FiTrendingUp />
                            <div>
                                <span className={styles.resultValue}>
                                    {formatCurrency(simulationData.finalMonthlyIncome)}
                                </span>
                                <span className={styles.resultLabel}>Renda passiva/mês</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionBar}>
                <Button
                    variant="secondary"
                    leftIcon={<FiMaximize2 />}
                    onClick={handleOpenFullSimulator}
                    size="sm"
                >
                    Ver Tabela Completa
                </Button>
                <Button
                    leftIcon={<FiPlus />}
                    onClick={handleTrade}
                    size="sm"
                >
                    Realizar Aporte
                </Button>
            </div>
        </div>
    );
}
