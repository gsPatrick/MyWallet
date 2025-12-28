'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    FiTrendingUp, FiTrendingDown, FiDollarSign, FiPieChart,
    FiTarget, FiAlertTriangle, FiCheckCircle, FiAward
} from 'react-icons/fi';
import styles from './InvestorSummary.module.css';

/**
 * InvestorSummary - Dashboard de métricas do investidor
 * 
 * Exibe dados prontos da API - SEM CÁLCULOS NO FRONTEND
 * 
 * Props esperadas vêm direto do response da API /api/investments/portfolio:
 * - summary
 * - dividends
 * - concentration
 * - rankings
 * - indicators
 * - portfolioMetrics
 */
export default function InvestorSummary({
    summary,
    dividends,
    concentration,
    rankings,
    indicators,
    portfolioMetrics,
    formatCurrency
}) {
    // Evita cálculos - usa dados da API diretamente
    const healthStatus = indicators?.portfolioHealth?.status || 'UNKNOWN';
    const healthScore = indicators?.portfolioHealth?.score || 0;

    const getHealthColor = (status) => {
        switch (status) {
            case 'EXCELLENT': return 'var(--accent-success)';
            case 'GOOD': return 'var(--accent-success)';
            case 'FAIR': return 'var(--accent-warning)';
            case 'POOR': return 'var(--accent-danger)';
            default: return 'var(--text-tertiary)';
        }
    };

    const getHealthLabel = (status) => {
        switch (status) {
            case 'EXCELLENT': return 'Excelente';
            case 'GOOD': return 'Boa';
            case 'FAIR': return 'Regular';
            case 'POOR': return 'Atenção';
            default: return 'N/A';
        }
    };

    if (!summary) return null;

    return (
        <div className={styles.container}>
            {/* Row 1: Métricas principais */}
            <div className={styles.mainMetrics}>
                {/* Total Investido */}
                <motion.div
                    className={styles.metricCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                >
                    <div className={styles.metricIcon}>
                        <FiDollarSign />
                    </div>
                    <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Total Investido</span>
                        <span className={styles.metricValue}>
                            {formatCurrency(summary.totalInvested)}
                        </span>
                    </div>
                </motion.div>

                {/* Valor Atual */}
                <motion.div
                    className={styles.metricCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className={styles.metricIcon}>
                        <FiPieChart />
                    </div>
                    <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Valor Atual</span>
                        <span className={styles.metricValue}>
                            {formatCurrency(summary.totalCurrentBalance)}
                        </span>
                    </div>
                </motion.div>

                {/* Rentabilidade */}
                <motion.div
                    className={`${styles.metricCard} ${summary.totalProfit >= 0 ? styles.positive : styles.negative}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className={styles.metricIcon}>
                        {summary.totalProfit >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                    </div>
                    <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Rentabilidade Total</span>
                        <span className={styles.metricValue}>
                            {formatCurrency(summary.totalProfit)}
                            <span className={styles.metricPercent}>
                                ({summary.totalProfitPercent?.toFixed(2)}%)
                            </span>
                        </span>
                    </div>
                </motion.div>

                {/* Renda Projetada */}
                <motion.div
                    className={styles.metricCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className={styles.metricIcon}>
                        <FiTarget />
                    </div>
                    <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Renda Projetada</span>
                        <span className={styles.metricValue}>
                            {formatCurrency(dividends?.projectedMonthlyIncome)}/mês
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Row 2: Dividendos e Saúde */}
            <div className={styles.secondaryMetrics}>
                {/* Dividendos Recebidos */}
                <div className={styles.dividendsCard}>
                    <h4>💰 Dividendos Recebidos</h4>
                    <div className={styles.dividendsGrid}>
                        <div className={styles.dividendItem}>
                            <span className={styles.dividendLabel}>Este mês</span>
                            <span className={styles.dividendValue}>
                                {formatCurrency(dividends?.month?.total)}
                            </span>
                        </div>
                        <div className={styles.dividendItem}>
                            <span className={styles.dividendLabel}>Este ano</span>
                            <span className={styles.dividendValue}>
                                {formatCurrency(dividends?.year?.total)}
                            </span>
                        </div>
                        <div className={styles.dividendItem}>
                            <span className={styles.dividendLabel}>Total histórico</span>
                            <span className={styles.dividendValue}>
                                {formatCurrency(dividends?.allTime?.total)}
                            </span>
                        </div>
                    </div>
                    {/* === TRENDS TEMPORAIS === */}
                    {dividends?.trends && (
                        <div className={styles.trendsSection}>
                            <span className={styles.trendsTitle}>📈 Evolução</span>
                            <div className={styles.trendsGrid}>
                                {/* 3 meses */}
                                {dividends.trends.threeMonths && (
                                    <div className={styles.trendItem}>
                                        <span className={styles.trendLabel}>3 meses</span>
                                        <span className={`${styles.trendStatus} ${styles[dividends.trends.threeMonths.status?.toLowerCase()]}`}>
                                            {dividends.trends.threeMonths.status === 'GROWING' && '▲'}
                                            {dividends.trends.threeMonths.status === 'DECLINING' && '▼'}
                                            {dividends.trends.threeMonths.status === 'STABLE' && '—'}
                                            {' '}{dividends.trends.threeMonths.changePercent?.toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                                {/* 6 meses */}
                                {dividends.trends.sixMonths && (
                                    <div className={styles.trendItem}>
                                        <span className={styles.trendLabel}>6 meses</span>
                                        <span className={`${styles.trendStatus} ${styles[dividends.trends.sixMonths.status?.toLowerCase()]}`}>
                                            {dividends.trends.sixMonths.status === 'GROWING' && '▲'}
                                            {dividends.trends.sixMonths.status === 'DECLINING' && '▼'}
                                            {dividends.trends.sixMonths.status === 'STABLE' && '—'}
                                            {' '}{dividends.trends.sixMonths.changePercent?.toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                                {/* Média mensal 12m */}
                                {dividends.trends.twelveMonths && (
                                    <div className={styles.trendItem}>
                                        <span className={styles.trendLabel}>Média/mês (12m)</span>
                                        <span className={styles.trendValue}>
                                            {formatCurrency(dividends.trends.twelveMonths.monthlyAverage)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Saúde da Carteira */}
                <div className={styles.healthCard}>
                    <h4>📊 Saúde da Carteira</h4>
                    <div className={styles.healthContent}>
                        <div
                            className={styles.healthScore}
                            style={{ color: getHealthColor(healthStatus) }}
                        >
                            <span className={styles.scoreValue}>{healthScore}</span>
                            <span className={styles.scoreMax}>/100</span>
                        </div>
                        <span
                            className={styles.healthStatus}
                            style={{ backgroundColor: getHealthColor(healthStatus) }}
                        >
                            {getHealthLabel(healthStatus)}
                        </span>
                    </div>
                    {indicators?.portfolioHealth?.issues?.length > 0 && (
                        <div className={styles.healthIssues}>
                            {indicators.portfolioHealth.issues.map((issue, i) => (
                                <div key={i} className={styles.issueItem}>
                                    <FiAlertTriangle />
                                    <span>{issue}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Row 3: Rankings */}
            <div className={styles.rankingsRow}>
                {/* Top Pagadores */}
                <div className={styles.rankingCard}>
                    <h4><FiAward /> Top Pagadores de Dividendos</h4>
                    <div className={styles.rankingList}>
                        {rankings?.topDividendPayers?.slice(0, 3).map((item, i) => (
                            <div key={item.ticker} className={styles.rankingItem}>
                                <span className={styles.rankPosition}>{i + 1}º</span>
                                <span className={styles.rankTicker}>{item.ticker}</span>
                                <span className={styles.rankValue}>DY {item.dy?.toFixed(2)}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mais Rentáveis */}
                <div className={styles.rankingCard}>
                    <h4><FiTrendingUp /> Mais Rentáveis</h4>
                    <div className={styles.rankingList}>
                        {rankings?.mostProfitable?.slice(0, 3).map((item, i) => (
                            <div key={item.ticker} className={styles.rankingItem}>
                                <span className={styles.rankPosition}>{i + 1}º</span>
                                <span className={styles.rankTicker}>{item.ticker}</span>
                                <span className={`${styles.rankValue} ${item.totalReturnPercent >= 0 ? styles.positive : styles.negative}`}>
                                    {item.totalReturnPercent?.toFixed(2)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Concentração */}
                <div className={styles.rankingCard}>
                    <h4><FiPieChart /> Maior Concentração</h4>
                    <div className={styles.rankingList}>
                        {concentration?.topAssets?.slice(0, 3).map((item, i) => (
                            <div key={item.ticker} className={styles.rankingItem}>
                                <span className={styles.rankPosition}>{i + 1}º</span>
                                <span className={styles.rankTicker}>{item.ticker}</span>
                                <span className={styles.rankValue}>{item.percentage?.toFixed(2)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Indicadores-chave */}
            {indicators?.mostProfitable && (
                <div className={styles.keyIndicators}>
                    <div className={styles.indicatorItem}>
                        <FiCheckCircle className={styles.indicatorIcon} />
                        <span>
                            <strong>Mais rentável:</strong> {indicators.mostProfitable.ticker}
                            ({indicators.mostProfitable.totalReturnPercent?.toFixed(2)}%)
                        </span>
                    </div>
                    {indicators.topConcentration && (
                        <div className={styles.indicatorItem}>
                            <FiPieChart className={styles.indicatorIcon} />
                            <span>
                                <strong>Maior peso:</strong> {indicators.topConcentration.ticker}
                                ({indicators.topConcentration.percentage?.toFixed(2)}%)
                            </span>
                        </div>
                    )}
                    {indicators.highRiskCount > 0 && (
                        <div className={`${styles.indicatorItem} ${styles.warning}`}>
                            <FiAlertTriangle className={styles.indicatorIcon} />
                            <span>
                                <strong>{indicators.highRiskCount}</strong> ativo(s) de alto risco
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
