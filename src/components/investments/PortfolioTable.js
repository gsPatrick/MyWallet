'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import AssetRowExpanded from './AssetRowExpanded';
import styles from './PortfolioTable.module.css';

const ASSET_COLORS = {
    STOCK: '#3b82f6',
    FII: '#10b981',
    ETF: '#f59e0b',
    BDR: '#ec4899',
    RENDA_FIXA: '#8b5cf6',
    CRYPTO: '#facc15',
    OTHER: '#64748b'
};

/**
 * PortfolioTable - Professional investment table with expandable rows
 * Shows: Ticker, Position, PM, Current Price, Total Balance, P/L, DY
 */
export default function PortfolioTable({
    positions = [],
    dividends = [],
    formatCurrency,
    onTradeClick
}) {
    const [expandedRow, setExpandedRow] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'ticker', direction: 'asc' });

    // =====================================================================
    // API NOW PROVIDES ALL DATA - NO FRONTEND CALCULATIONS
    // Backend calculates: dy, dividendRate, lastDividendPerShare, rentability
    // Frontend only displays what the API returns
    // =====================================================================
    const positionsWithDY = useMemo(() => {
        return positions.map(pos => ({
            ...pos,
            // Use data directly from API (no calculations)
            dividendYield: parseFloat(pos.dy) || 0,
            annualDividendPerShare: parseFloat(pos.dividendRate) || 0,
            lastDividendPerShare: parseFloat(pos.lastDividendPerShare) || 0,
            // Rentability comes ready from API
            rentability: pos.rentability || null,
            // Concentration comes ready from API
            concentration: pos.concentration || null
        }));
    }, [positions]);

    // Sort positions
    const sortedPositions = useMemo(() => {
        const sorted = [...positionsWithDY];
        sorted.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [positionsWithDY, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const toggleRow = (ticker) => {
        setExpandedRow(prev => prev === ticker ? null : ticker);
    };

    if (positions.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>Sua carteira está vazia.</p>
            </div>
        );
    }

    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.expandCol}></th>
                        <th onClick={() => handleSort('ticker')} className={styles.sortable}>
                            Ativo
                            {sortConfig.key === 'ticker' && (
                                <span className={styles.sortIndicator}>
                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                            )}
                        </th>
                        <th onClick={() => handleSort('quantity')} className={styles.sortable}>
                            Posição
                        </th>
                        <th>PM</th>
                        <th>Preço Atual</th>
                        <th onClick={() => handleSort('currentBalance')} className={styles.sortable}>
                            Saldo Total
                        </th>
                        <th onClick={() => handleSort('profitPercent')} className={styles.sortable}>
                            Rentabilidade
                        </th>
                        <th onClick={() => handleSort('dividendYield')} className={styles.sortable}>
                            DY
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedPositions.map(position => {
                        const isExpanded = expandedRow === position.ticker;
                        const profit = position.profit || (position.currentBalance - position.totalCost);
                        const profitPercent = position.profitPercent ||
                            (position.totalCost > 0 ? (profit / position.totalCost) * 100 : 0);
                        const isProfit = profit >= 0;

                        return (
                            <motion.tr
                                key={position.ticker}
                                layout
                                className={`${styles.row} ${isExpanded ? styles.rowExpanded : ''}`}
                            >
                                {/* Main row content in a wrapper for the accordion effect */}
                                <td colSpan={8} className={styles.rowWrapper}>
                                    <div
                                        className={styles.mainRow}
                                        onClick={() => toggleRow(position.ticker)}
                                    >
                                        <div className={styles.expandIcon}>
                                            {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                                        </div>

                                        <div className={styles.assetCell}>
                                            {position.logoUrl ? (
                                                <img
                                                    src={position.logoUrl}
                                                    alt=""
                                                    className={styles.assetLogo}
                                                />
                                            ) : (
                                                <div
                                                    className={styles.assetLogoPlaceholder}
                                                    style={{ background: ASSET_COLORS[position.type] || ASSET_COLORS.OTHER }}
                                                >
                                                    {position.ticker?.[0]}
                                                </div>
                                            )}
                                            <div className={styles.assetInfo}>
                                                <strong>{position.ticker}</strong>
                                                <span title={position.name}>
                                                    {position.name?.substring(0, 18)}
                                                    {position.name?.length > 18 ? '...' : ''}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.cell}>
                                            <span className={styles.monoValue}>{position.quantity}</span>
                                        </div>

                                        <div className={styles.cell}>
                                            <span className={styles.monoValue}>
                                                {formatCurrency(position.averagePrice)}
                                            </span>
                                        </div>

                                        <div className={styles.cell}>
                                            <span className={styles.monoValue}>
                                                {formatCurrency(position.currentPrice)}
                                            </span>
                                        </div>

                                        <div className={styles.cell}>
                                            <span className={`${styles.monoValue} ${styles.bold}`}>
                                                {formatCurrency(position.currentBalance)}
                                            </span>
                                        </div>

                                        <div className={styles.cell}>
                                            <div className={styles.profitCell}>
                                                <span className={`${styles.profitValue} ${isProfit ? styles.positive : styles.negative}`}>
                                                    {isProfit ? '+' : ''}{formatCurrency(profit)}
                                                </span>
                                                <span className={`${styles.profitPercent} ${isProfit ? styles.positive : styles.negative}`}>
                                                    ({profitPercent.toFixed(2)}%)
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.cell}>
                                            <span className={`${styles.dyBadge} ${position.dividendYield > 0 ? styles.hasDY : ''}`}>
                                                {position.dividendYield > 0
                                                    ? `${position.dividendYield.toFixed(2)}%`
                                                    : '—'
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className={styles.expandedContent}
                                            >
                                                <AssetRowExpanded
                                                    position={position}
                                                    formatCurrency={formatCurrency}
                                                    onTradeClick={onTradeClick}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </td>
                            </motion.tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
