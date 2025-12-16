'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FiTrendingUp, FiTrendingDown, FiPlus, FiSearch, FiPieChart,
    FiDollarSign, FiPercent, FiList, FiGrid, FiRefreshCw, FiExternalLink
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { GhostPositionRow, GhostMarketCard, GhostOperationItem } from '@/components/ui/GhostInvestments';
import { usePrivateCurrency } from '@/components/ui/PrivateValue';
import { formatDate } from '@/utils/formatters';
import { investmentsAPI, financialProductsAPI } from '@/services/api';
import styles from './page.module.css';

const typeColors = {
    STOCK: '#3b82f6',
    FII: '#22c55e',
    ETF: '#f59e0b',
};

export default function InvestmentsPage() {
    // Privacy-aware formatting
    const { formatCurrency, formatPercent } = usePrivateCurrency();
    const [activeTab, setActiveTab] = useState('portfolio');
    const [searchQuery, setSearchQuery] = useState('');
    const [showOperationModal, setShowOperationModal] = useState(false);
    const [operationForm, setOperationForm] = useState({
        ticker: '', type: 'BUY', quantity: '', price: '', date: ''
    });

    const [positions, setPositions] = useState([]);
    const [portfolioData, setPortfolioData] = useState({ totalCost: 0, totalCurrent: 0, profit: 0, profitPercent: 0, byType: {} });
    const [availableAssets, setAvailableAssets] = useState([]);
    const [operations, setOperations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [portfolio, products, ops] = await Promise.all([
                    investmentsAPI.getPortfolio(),
                    financialProductsAPI.list(),
                    investmentsAPI.list()
                ]);

                if (portfolio?.data) {
                    const pData = portfolio.data;
                    setPositions(pData.positions || []);
                    setPortfolioData({
                        totalCost: pData.totalInvested || 0,
                        totalCurrent: pData.currentBalance || 0,
                        profit: (pData.currentBalance - pData.totalInvested) || 0,
                        profitPercent: pData.rentability || 0,
                        byType: pData.allocation || {}
                    });
                }

                setAvailableAssets(products?.data || []);
                setOperations(ops?.data || []);
            } catch (error) {
                console.error("Error loading investments:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredAssets = availableAssets.filter(a =>
        a.ticker?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSaveOperation = () => {
        console.log('Saving operation:', operationForm);
        setShowOperationModal(false);
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
                            <h1>Meus Investimentos</h1>
                            <p>Acompanhe sua carteira em tempo real</p>
                        </div>
                        <div className={styles.headerActions}>
                            <Button variant="secondary" leftIcon={<FiRefreshCw />} onClick={() => { }}>
                                Atualizar
                            </Button>
                            <Button leftIcon={<FiPlus />} onClick={() => setShowOperationModal(true)}>
                                Nova Operação
                            </Button>
                        </div>
                    </motion.div>

                    {/* Portfolio Summary */}
                    <motion.div
                        className={styles.portfolioSummary}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className={styles.summaryMain}>
                            <span className={styles.summaryLabel}>Patrimônio Total</span>
                            <span className={styles.summaryValue}>{formatCurrency(portfolioData.totalCurrent)}</span>
                            <span className={`${styles.summaryChange} ${portfolioData.profit >= 0 ? styles.positive : styles.negative}`}>
                                {portfolioData.profit >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                                {formatCurrency(Math.abs(portfolioData.profit))} ({portfolioData.profitPercent.toFixed(2)}%)
                            </span>
                        </div>

                        <div className={styles.summaryStats}>
                            <div className={styles.statCard}>
                                <FiDollarSign className={styles.statIcon} />
                                <div>
                                    <span className={styles.statLabel}>Investido</span>
                                    <span className={styles.statValue}>{formatCurrency(portfolioData.totalCost)}</span>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <FiTrendingUp className={`${styles.statIcon} ${styles.success}`} />
                                <div>
                                    <span className={styles.statLabel}>Lucro/Prejuízo</span>
                                    <span className={`${styles.statValue} ${portfolioData.profit >= 0 ? styles.positive : styles.negative}`}>
                                        {formatCurrency(portfolioData.profit)}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <FiPercent className={`${styles.statIcon} ${styles.primary}`} />
                                <div>
                                    <span className={styles.statLabel}>Rentabilidade</span>
                                    <span className={`${styles.statValue} ${portfolioData.profitPercent >= 0 ? styles.positive : styles.negative}`}>
                                        {portfolioData.profitPercent.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Diversification */}
                        <div className={styles.diversification}>
                            <h4>Diversificação</h4>
                            <div className={styles.diversBar}>
                                {Object.entries(portfolioData.byType || {}).map(([type, value]) => {
                                    const pct = portfolioData.totalCurrent > 0 ? (value / portfolioData.totalCurrent) * 100 : 0;
                                    return (
                                        <div
                                            key={type}
                                            className={styles.diversSegment}
                                            style={{ width: `${pct}%`, background: typeColors[type] || '#ccc' }}
                                            title={`${type}: ${pct.toFixed(1)}%`}
                                        />
                                    );
                                })}
                            </div>
                            <div className={styles.diversLegend}>
                                {Object.entries(portfolioData.byType || {}).map(([type, value]) => {
                                    const pct = portfolioData.totalCurrent > 0 ? (value / portfolioData.totalCurrent) * 100 : 0;
                                    return (
                                        <div key={type} className={styles.legendItem}>
                                            <span className={styles.legendDot} style={{ background: typeColors[type] || '#ccc' }} />
                                            <span className={styles.legendLabel}>{type}</span>
                                            <span className={styles.legendValue}>{pct.toFixed(1)}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>

                    {/* Tabs */}
                    <motion.div
                        className={styles.tabs}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <button className={`${styles.tab} ${activeTab === 'portfolio' ? styles.active : ''}`} onClick={() => setActiveTab('portfolio')}>
                            <FiPieChart /> Carteira
                        </button>
                        <button className={`${styles.tab} ${activeTab === 'market' ? styles.active : ''}`} onClick={() => setActiveTab('market')}>
                            <FiTrendingUp /> Mercado
                        </button>
                        <button className={`${styles.tab} ${activeTab === 'operations' ? styles.active : ''}`} onClick={() => setActiveTab('operations')}>
                            <FiList /> Operações
                        </button>
                    </motion.div>

                    {/* Portfolio Tab */}
                    {activeTab === 'portfolio' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className={styles.tableHeader}>
                                <span>Ativo</span>
                                <span>Tipo</span>
                                <span>Qtd</span>
                                <span>PM</span>
                                <span>Preço Atual</span>
                                <span>Variação</span>
                                <span>Total</span>
                                <span>Lucro</span>
                            </div>
                            {positions.map((pos, i) => {
                                const cost = pos.quantity * pos.avgPrice;
                                const current = pos.quantity * pos.currentPrice;
                                const profit = current - cost;
                                const profitPct = cost > 0 ? (profit / cost) * 100 : 0;

                                return (
                                    <motion.div
                                        key={pos.ticker}
                                        className={styles.positionRow}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05 * i }}
                                    >
                                        <div className={styles.tickerCell}>
                                            <Link href={`/investments/${pos.ticker}`} className={styles.tickerLink}>
                                                <strong>{pos.ticker}</strong>
                                                <span>{pos.name}</span>
                                            </Link>
                                        </div>
                                        <span className={styles.typeCell} style={{ color: typeColors[pos.type] }}>{pos.type}</span>
                                        <span>{pos.quantity}</span>
                                        <span>{formatCurrency(pos.avgPrice)}</span>
                                        <span>{formatCurrency(pos.currentPrice)}</span>
                                        <span className={pos.changePercent >= 0 ? styles.positive : styles.negative}>
                                            {pos.changePercent >= 0 ? '+' : ''}{pos.changePercent?.toFixed(2) || '0.00'}%
                                        </span>
                                        <span className={styles.totalCell}>{formatCurrency(current)}</span>
                                        <span className={profit >= 0 ? styles.positive : styles.negative}>
                                            {formatCurrency(profit)} ({profitPct.toFixed(1)}%)
                                        </span>
                                    </motion.div>
                                );
                            })}
                            {/* Ghost Position Row */}
                            <GhostPositionRow onClick={() => setShowOperationModal(true)} />
                        </motion.div>
                    )}

                    {/* Market Tab */}
                    {activeTab === 'market' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className={styles.searchBar}>
                                <FiSearch />
                                <input
                                    type="text"
                                    placeholder="Buscar ativos (ex: PETR4, VALE3, MXRF11)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className={styles.marketGrid}>
                                {filteredAssets.map((asset, i) => (
                                    <motion.div
                                        key={asset.ticker}
                                        className={styles.marketCard}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.03 * i }}
                                    >
                                        <div className={styles.marketHeader}>
                                            <div>
                                                <strong>{asset.ticker}</strong>
                                                <span className={styles.typeBadge} style={{ background: `${typeColors[asset.type]}20`, color: typeColors[asset.type] }}>
                                                    {asset.type}
                                                </span>
                                            </div>
                                            <Link href={`/investments/${asset.ticker}`} className={styles.detailLink}>
                                                <FiExternalLink />
                                            </Link>
                                        </div>
                                        <span className={styles.marketName}>{asset.name}</span>
                                        <div className={styles.marketPrice}>
                                            <span className={styles.price}>{formatCurrency(asset.price)}</span>
                                            <span className={asset.change >= 0 ? styles.positive : styles.negative}>
                                                {asset.change >= 0 ? '+' : ''}{asset.change?.toFixed(2) || '0.00'}%
                                            </span>
                                        </div>
                                        <button
                                            className={styles.addToCarteira}
                                            onClick={() => {
                                                setOperationForm(prev => ({ ...prev, ticker: asset.ticker, price: asset.price?.toString() || '' }));
                                                setShowOperationModal(true);
                                            }}
                                        >
                                            <FiPlus /> Adicionar
                                        </button>
                                    </motion.div>
                                ))}
                                {/* Ghost Market Card */}
                                <GhostMarketCard onClick={() => setShowOperationModal(true)} />
                            </div>
                        </motion.div>
                    )}

                    {/* Operations Tab */}
                    {activeTab === 'operations' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {operations.length > 0 ? (
                                <div className={styles.operationsList}>
                                    {operations.map((op, i) => (
                                        <motion.div
                                            key={op.id || i}
                                            className={styles.operationItem}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.05 * i }}
                                        >
                                            <div className={`${styles.opBadge} ${op.type === 'BUY' ? styles.buy : styles.sell}`}>
                                                {op.type === 'BUY' ? 'C' : 'V'}
                                            </div>
                                            <div className={styles.opInfo}>
                                                <strong>{op.ticker}</strong>
                                                <span>{formatDate(op.date)}</span>
                                            </div>
                                            <span className={styles.opQty}>{op.quantity} un</span>
                                            <span className={styles.opPrice}>{formatCurrency(op.price)}</span>
                                            <span className={`${styles.opTotal} ${op.type === 'BUY' ? styles.negative : styles.positive}`}>
                                                {op.type === 'BUY' ? '-' : '+'}{formatCurrency(op.quantity * op.price)}
                                            </span>
                                        </motion.div>
                                    ))}
                                    {/* Ghost Operation Item */}
                                    <GhostOperationItem onClick={() => setShowOperationModal(true)} />
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <FiList />
                                    <p>Nenhuma operação registrada.</p>
                                    {/* Ghost Operation Item */}
                                    <GhostOperationItem onClick={() => setShowOperationModal(true)} />
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </main>

            <Dock />

            {/* Operation Modal */}
            <Modal isOpen={showOperationModal} onClose={() => setShowOperationModal(false)} title="Nova Operação" size="sm">
                <div className={styles.modalForm}>
                    <Input
                        label="Ticker"
                        placeholder="Ex: PETR4"
                        value={operationForm.ticker}
                        onChange={(e) => setOperationForm(prev => ({ ...prev, ticker: e.target.value.toUpperCase() }))}
                        fullWidth
                    />
                    <div className={styles.typeToggle}>
                        <button
                            className={`${styles.toggleBtn} ${operationForm.type === 'BUY' ? styles.activeBuy : ''}`}
                            onClick={() => setOperationForm(prev => ({ ...prev, type: 'BUY' }))}
                        >
                            Compra
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${operationForm.type === 'SELL' ? styles.activeSell : ''}`}
                            onClick={() => setOperationForm(prev => ({ ...prev, type: 'SELL' }))}
                        >
                            Venda
                        </button>
                    </div>
                    <div className={styles.formRow}>
                        <Input label="Quantidade" type="number" value={operationForm.quantity} onChange={(e) => setOperationForm(prev => ({ ...prev, quantity: e.target.value }))} />
                        <Input label="Preço" type="number" step="0.01" leftIcon={<FiDollarSign />} value={operationForm.price} onChange={(e) => setOperationForm(prev => ({ ...prev, price: e.target.value }))} />
                    </div>
                    <Input label="Data" type="date" value={operationForm.date} onChange={(e) => setOperationForm(prev => ({ ...prev, date: e.target.value }))} fullWidth />

                    {operationForm.quantity && operationForm.price && (
                        <div className={styles.operationTotal}>
                            <span>Total:</span>
                            <strong>{formatCurrency(Number(operationForm.quantity) * Number(operationForm.price))}</strong>
                        </div>
                    )}

                    <div className={styles.modalActions}>
                        <Button variant="secondary" onClick={() => setShowOperationModal(false)}>Cancelar</Button>
                        <Button onClick={handleSaveOperation}>Registrar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
