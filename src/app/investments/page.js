'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiTrendingUp, FiPlus, FiSearch, FiPieChart,
    FiDollarSign, FiActivity, FiList, FiRefreshCw, FiExternalLink,
    FiBriefcase, FiLoader
} from 'react-icons/fi';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';

import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { usePrivateCurrency } from '@/components/ui/PrivateValue';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { investmentsAPI } from '@/services/api';
import DividendsTab from '@/components/investments/DividendsTab';
import ProductCategoryGrid from '@/components/investments/ProductCategoryGrid';
import RentabilityChart from '@/components/investments/RentabilityChart';
import styles from './page.module.css';

const ASSET_COLORS = {
    STOCK: '#3b82f6', FII: '#10b981', ETF: '#f59e0b',
    BDR: '#ec4899', RENDA_FIXA: '#8b5cf6', CRYPTO: '#facc15', OTHER: '#64748b'
};

const TAB_VARIANTS = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

export default function InvestmentsPage() {
    const { formatCurrency } = usePrivateCurrency();
    const [activeTab, setActiveTab] = useState('portfolio');

    // Loading States
    const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
    const [isLoadingMarket, setIsLoadingMarket] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Data State
    const [portfolio, setPortfolio] = useState({ summary: {}, positions: [], allocation: {} });
    const [operations, setOperations] = useState([]);

    // Market Data State (Paginação e Busca)
    const [marketAssets, setMarketAssets] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [marketPage, setMarketPage] = useState(1);
    const [hasMoreAssets, setHasMoreAssets] = useState(true);
    const [marketCategory, setMarketCategory] = useState(null); // Filter by product type
    const [portfolioFilter, setPortfolioFilter] = useState('classe'); // classe, produto, ativos

    // Modal State
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [tradeForm, setTradeForm] = useState({
        ticker: '', type: 'BUY', quantity: '', price: '', date: new Date().toISOString().split('T')[0]
    });

    // Carga Inicial do Portfólio e Histórico
    useEffect(() => {
        loadPortfolioData();
    }, []);

    // Carga do Mercado (Debounce na busca)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'market') {
                loadMarketData(1, true); // Reset list on search/category change
            }
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchQuery, activeTab, marketCategory]);

    const loadPortfolioData = async () => {
        setIsLoadingPortfolio(true);
        try {
            const [pfData, opsData] = await Promise.all([
                investmentsAPI.getPortfolio(),
                investmentsAPI.list()
            ]);
            setPortfolio(pfData.data || { summary: {}, positions: [], allocation: {} });
            setOperations(opsData.data || []);
        } catch (error) {
            console.error("Erro ao carregar portfolio:", error);
        } finally {
            setIsLoadingPortfolio(false);
        }
    };

    const loadMarketData = async (page, reset = false) => {
        setIsLoadingMarket(true);
        try {
            const response = await investmentsAPI.getAssets(searchQuery, page);
            const newAssets = response.data || [];

            if (reset) {
                setMarketAssets(newAssets);
                setMarketPage(1);
            } else {
                setMarketAssets(prev => [...prev, ...newAssets]);
                setMarketPage(page);
            }

            // Se vier menos que 50 itens, chegamos ao fim
            setHasMoreAssets(newAssets.length >= 50);
        } catch (error) {
            console.error("Erro ao carregar mercado:", error);
        } finally {
            setIsLoadingMarket(false);
        }
    };

    const handleLoadMoreAssets = () => {
        if (!isLoadingMarket && hasMoreAssets) {
            loadMarketData(marketPage + 1, false);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        await loadPortfolioData();
        setTimeout(() => setIsSyncing(false), 1000);
    };

    const openTradeModal = (asset = null) => {
        setTradeForm({
            ticker: asset?.ticker || '',
            type: 'BUY',
            quantity: '',
            price: asset?.price ? asset.price.toString() : '',
            date: new Date().toISOString().split('T')[0]
        });
        setShowTradeModal(true);
    };

    const handleTradeSubmit = async () => {
        try {
            await investmentsAPI.registerOperation({
                ...tradeForm,
                ticker: tradeForm.ticker.toUpperCase()
            });
            setShowTradeModal(false);
            loadPortfolioData(); // Atualiza a carteira
            alert('Operação registrada com sucesso!');
        } catch (error) {
            alert('Erro ao registrar operação: ' + (error.response?.data?.error || error.message));
        }
    };

    // Dados Agrupados e Gráficos (Corrigido com useMemo)
    const groupedPortfolio = useMemo(() => {
        const groups = {};
        if (portfolio?.positions) {
            portfolio.positions.forEach(pos => {
                const type = pos.type || 'OTHER';
                if (!groups[type]) groups[type] = [];
                groups[type].push(pos);
            });
        }
        return groups;
    }, [portfolio]);

    const allocationChartData = useMemo(() => {
        return Object.entries(portfolio.allocation || {}).map(([key, value]) => ({
            name: key,
            value: value,
            color: ASSET_COLORS[key] || ASSET_COLORS.OTHER
        }));
    }, [portfolio.allocation]);

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>

                    {/* --- HEADER --- */}
                    <div className={styles.header}>
                        <div>
                            <h1 className={styles.title}>Home Broker</h1>
                            <p className={styles.subtitle}>Gestão de Patrimônio & Trading</p>
                        </div>
                        <div className={styles.headerActions}>
                            <Button
                                variant="secondary"
                                leftIcon={<FiRefreshCw className={isSyncing ? styles.spin : ''} />}
                                onClick={handleSync}
                            >
                                Atualizar
                            </Button>
                            <Button leftIcon={<FiPlus />} onClick={() => openTradeModal()}>
                                Nova Ordem
                            </Button>
                        </div>
                    </div>

                    {/* --- RENTABILITY CHART --- */}
                    <RentabilityChart />

                    {/* --- SUMMARY CARDS --- */}
                    <div className={styles.summaryRow}>
                        <Card className={styles.summaryCard}>
                            <div className={styles.summaryHeader}>
                                <span>Patrimônio Total</span>
                                <FiBriefcase />
                            </div>
                            <div className={styles.summaryValue}>
                                {formatCurrency(portfolio.summary?.totalCurrentBalance || 0)}
                            </div>
                        </Card>

                        <Card className={styles.summaryCard}>
                            <div className={styles.summaryHeader}>
                                <span>Lucro / Prejuízo</span>
                                <FiActivity />
                            </div>
                            <div className={`${styles.summaryValue} ${portfolio.summary?.totalProfit >= 0 ? styles.profit : styles.loss}`}>
                                {portfolio.summary?.totalProfit >= 0 ? '+' : ''}
                                {formatCurrency(portfolio.summary?.totalProfit || 0)}
                                <span className={styles.summaryPercent}>
                                    ({portfolio.summary?.totalProfitPercent?.toFixed(2)}%)
                                </span>
                            </div>
                        </Card>

                        <Card className={styles.summaryCard}>
                            <div className={styles.summaryHeader}>
                                <span>Total Investido</span>
                                <FiDollarSign />
                            </div>
                            <div className={styles.summaryValue}>
                                {formatCurrency(portfolio.summary?.totalInvested || 0)}
                            </div>
                        </Card>
                    </div>

                    {/* --- TABS --- */}
                    <div className={styles.tabsContainer}>
                        <button
                            className={`${styles.tab} ${activeTab === 'portfolio' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('portfolio')}
                        >
                            <FiPieChart /> Carteira
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'market' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('market')}
                        >
                            <FiTrendingUp /> Mercado
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'operations' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('operations')}
                        >
                            <FiList /> Histórico
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'dividends' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('dividends')}
                        >
                            <FiDollarSign /> Proventos
                        </button>
                    </div>

                    {/* --- CONTENT AREA --- */}
                    <div className={styles.contentArea}>
                        <AnimatePresence mode="wait">

                            {/* --- TAB: PORTFOLIO --- */}
                            {activeTab === 'portfolio' && (
                                <motion.div
                                    key="portfolio"
                                    variants={TAB_VARIANTS}
                                    initial="hidden" animate="visible" exit="exit"
                                    className={styles.portfolioGrid}
                                >
                                    {/* Left: Allocation Chart */}
                                    <div className={styles.allocationSection}>
                                        <Card className={styles.chartCard}>
                                            <h3>Alocação</h3>
                                            <div className={styles.chartWrapper}>
                                                {allocationChartData.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={allocationChartData}
                                                                innerRadius={60}
                                                                outerRadius={80}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                            >
                                                                {allocationChartData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                            <RechartsTooltip
                                                                formatter={(value) => `${value.toFixed(1)}%`}
                                                                contentStyle={{ background: '#1e1e2d', border: 'none', borderRadius: '8px' }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className={styles.chartCenter}>
                                                        <span>Sem dados</span>
                                                    </div>
                                                )}
                                                {/* Centered Total */}
                                                <div className={styles.chartCenter}>
                                                    <span>Total</span>
                                                    <strong>100%</strong>
                                                </div>
                                            </div>
                                            <div className={styles.chartLegend}>
                                                {allocationChartData.map(d => (
                                                    <div key={d.name} className={styles.legendItem}>
                                                        <span className={styles.legendDot} style={{ background: d.color }} />
                                                        <span>{d.name}</span>
                                                        <strong>{d.value}%</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Right: Asset List Grouped */}
                                    <div className={styles.positionsSection}>
                                        {/* Portfolio Filter Tabs */}
                                        <div className={styles.portfolioFilterTabs}>
                                            <button
                                                className={`${styles.filterTab} ${portfolioFilter === 'classe' ? styles.filterTabActive : ''}`}
                                                onClick={() => setPortfolioFilter('classe')}
                                            >
                                                Classe
                                            </button>
                                            <button
                                                className={`${styles.filterTab} ${portfolioFilter === 'produto' ? styles.filterTabActive : ''}`}
                                                onClick={() => setPortfolioFilter('produto')}
                                            >
                                                Produto
                                            </button>
                                            <button
                                                className={`${styles.filterTab} ${portfolioFilter === 'ativos' ? styles.filterTabActive : ''}`}
                                                onClick={() => setPortfolioFilter('ativos')}
                                            >
                                                Ativos
                                            </button>
                                        </div>
                                        {Object.entries(groupedPortfolio).length > 0 ? Object.entries(groupedPortfolio).map(([type, assets]) => (
                                            <div key={type} className={styles.assetGroup}>
                                                <div className={styles.groupHeader}>
                                                    <h3 style={{ color: ASSET_COLORS[type] }}>{type}</h3>
                                                    <span className={styles.groupTotal}>
                                                        {formatCurrency(assets.reduce((sum, a) => sum + a.currentBalance, 0))}
                                                    </span>
                                                </div>
                                                <div className={styles.tableWrapper}>
                                                    <table className={styles.table}>
                                                        <thead>
                                                            <tr>
                                                                <th>Ativo</th>
                                                                <th>Qtd</th>
                                                                <th>Preço Médio</th>
                                                                <th>Preço Atual</th>
                                                                <th>Saldo</th>
                                                                <th>Res.</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {assets.map(asset => (
                                                                <tr key={asset.ticker || asset.id}>
                                                                    <td>
                                                                        <div className={styles.assetCell}>
                                                                            {asset.logoUrl ? (
                                                                                <img src={asset.logoUrl} alt="" className={styles.assetLogo} />
                                                                            ) : (
                                                                                <div className={styles.assetLogoPlaceholder}>{asset.ticker?.[0]}</div>
                                                                            )}
                                                                            <div>
                                                                                <strong>{asset.ticker}</strong>
                                                                                <span>{asset.name?.substring(0, 20)}...</span>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td>{asset.quantity}</td>
                                                                    <td>{formatCurrency(asset.averagePrice)}</td>
                                                                    <td>{formatCurrency(asset.currentPrice)}</td>
                                                                    <td>{formatCurrency(asset.currentBalance)}</td>
                                                                    <td>
                                                                        <span className={`${styles.badge} ${asset.profit >= 0 ? styles.profit : styles.loss}`}>
                                                                            {asset.profitPercent.toFixed(2)}%
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className={styles.emptyState}>
                                                <FiBriefcase />
                                                <p>Sua carteira está vazia.</p>
                                                <Button size="sm" onClick={() => setActiveTab('market')}>Ir ao Mercado</Button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* --- TAB: MARKET (BUSCA REAL) --- */}
                            {activeTab === 'market' && (
                                <motion.div
                                    key="market"
                                    variants={TAB_VARIANTS}
                                    initial="hidden" animate="visible" exit="exit"
                                    className={styles.marketContainer}
                                >
                                    {/* Show categories if no category selected */}
                                    {!marketCategory ? (
                                        <ProductCategoryGrid onEnterCategory={setMarketCategory} />
                                    ) : (
                                        <>
                                            {/* Back button and category header */}
                                            <div className={styles.marketHeader}>
                                                <button
                                                    className={styles.backBtn}
                                                    onClick={() => setMarketCategory(null)}
                                                >
                                                    ← Voltar
                                                </button>
                                                <h3 className={styles.categoryTitle}>
                                                    {marketCategory === 'STOCK' ? 'Ações' :
                                                        marketCategory === 'FII' ? 'Fundos Imobiliários' :
                                                            marketCategory === 'ETF' ? 'ETFs' :
                                                                marketCategory === 'BDR' ? 'BDRs' :
                                                                    marketCategory === 'RENDA_FIXA' ? 'Renda Fixa' :
                                                                        marketCategory === 'CRYPTO' ? 'Crypto' : marketCategory}
                                                </h3>
                                            </div>

                                            <div className={styles.searchBar}>
                                                <FiSearch />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar Ativos..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>

                                            {/* Market Grid */}
                                            <div className={styles.marketGrid}>
                                                {marketAssets.filter(asset => asset.type === marketCategory).map(asset => (
                                                    <div key={asset.id} className={styles.marketCard}>
                                                        <div className={styles.marketCardHeader}>
                                                            <div className={styles.assetIcon}>
                                                                {asset.logoUrl ? <img src={asset.logoUrl} alt="" /> : asset.ticker[0]}
                                                            </div>
                                                            <div className={styles.assetInfo}>
                                                                <strong>{asset.ticker}</strong>
                                                                <span title={asset.name}>{asset.name?.substring(0, 25)}...</span>
                                                            </div>
                                                            <span className={styles.typeTag} style={{ color: ASSET_COLORS[asset.type] }}>
                                                                {asset.type}
                                                            </span>
                                                        </div>

                                                        <div className={styles.marketPriceRow}>
                                                            <span className={styles.livePrice}>{formatCurrency(asset.price)}</span>
                                                            {asset.change !== undefined && (
                                                                <span className={`${styles.liveChange} ${asset.change >= 0 ? styles.positive : styles.negative}`}>
                                                                    {asset.change >= 0 ? '+' : ''}{asset.change?.toFixed(2)}%
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className={styles.marketCardFooter}>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                fullWidth
                                                                onClick={() => openTradeModal(asset)}
                                                            >
                                                                Negociar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Numbered Pagination */}
                                            <div className={styles.pagination}>
                                                {isLoadingMarket ? (
                                                    <div className={styles.loader}>
                                                        <FiLoader className={styles.spin} /> Carregando...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            className={styles.pageBtn}
                                                            disabled={marketPage === 1}
                                                            onClick={() => { setMarketPage(p => p - 1); loadMarketData(marketPage - 1, true); }}
                                                        >
                                                            ←
                                                        </button>
                                                        {[...Array(Math.min(5, Math.ceil(50 / 10)))].map((_, i) => {
                                                            const page = i + 1;
                                                            return (
                                                                <button
                                                                    key={page}
                                                                    className={`${styles.pageBtn} ${marketPage === page ? styles.pageActive : ''}`}
                                                                    onClick={() => { setMarketPage(page); loadMarketData(page, true); }}
                                                                >
                                                                    {page}
                                                                </button>
                                                            );
                                                        })}
                                                        <button
                                                            className={styles.pageBtn}
                                                            disabled={!hasMoreAssets}
                                                            onClick={() => { setMarketPage(p => p + 1); loadMarketData(marketPage + 1, true); }}
                                                        >
                                                            →
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {!isLoadingMarket && marketAssets.filter(a => a.type === marketCategory).length === 0 && (
                                                <div className={styles.emptySearch}>
                                                    <p>Nenhum ativo encontrado</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </motion.div>
                            )}

                            {/* --- TAB: OPERATIONS --- */}
                            {activeTab === 'operations' && (
                                <motion.div
                                    key="operations"
                                    variants={TAB_VARIANTS}
                                    initial="hidden" animate="visible" exit="exit"
                                    className={styles.operationsContainer}
                                >
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th>Data</th>
                                                    <th>Ativo</th>
                                                    <th>Operação</th>
                                                    <th>Qtd</th>
                                                    <th>Preço</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {operations.map(op => (
                                                    <tr key={op.id}>
                                                        <td><span className={styles.dateCell}><FiClock /> {formatDate(op.date)}</span></td>
                                                        <td><strong>{op.ticker}</strong></td>
                                                        <td>
                                                            <span className={`${styles.opBadge} ${op.operationType === 'BUY' ? styles.buy : styles.sell}`}>
                                                                {op.operationType === 'BUY' ? 'COMPRA' : 'VENDA'}
                                                            </span>
                                                        </td>
                                                        <td>{op.quantity}</td>
                                                        <td>{formatCurrency(op.price)}</td>
                                                        <td><strong>{formatCurrency(op.totalValue)}</strong></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {operations.length === 0 && (
                                            <div className={styles.emptyState}>
                                                <FiList />
                                                <p>Nenhuma operação registrada.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* --- TAB: DIVIDENDS --- */}
                            {activeTab === 'dividends' && (
                                <motion.div
                                    key="dividends"
                                    variants={TAB_VARIANTS}
                                    initial="hidden" animate="visible" exit="exit"
                                >
                                    <DividendsTab />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            <Dock />

            {/* Trade Modal */}
            <Modal
                isOpen={showTradeModal}
                onClose={() => setShowTradeModal(false)}
                title="Nova Ordem"
                size="sm"
            >
                <div className={styles.tradeForm}>
                    <div className={styles.tradeTypeSelector}>
                        <button
                            className={`${styles.typeBtn} ${tradeForm.type === 'BUY' ? styles.buyActive : ''}`}
                            onClick={() => setTradeForm(prev => ({ ...prev, type: 'BUY' }))}
                        >
                            Comprar
                        </button>
                        <button
                            className={`${styles.typeBtn} ${tradeForm.type === 'SELL' ? styles.sellActive : ''}`}
                            onClick={() => setTradeForm(prev => ({ ...prev, type: 'SELL' }))}
                        >
                            Vender
                        </button>
                    </div>

                    <Input
                        label="Ativo (Ticker)"
                        placeholder="Ex: PETR4"
                        value={tradeForm.ticker}
                        onChange={(e) => setTradeForm(prev => ({ ...prev, ticker: e.target.value.toUpperCase() }))}
                    />

                    <div className={styles.row}>
                        <Input
                            label="Quantidade"
                            type="number"
                            placeholder="0"
                            value={tradeForm.quantity}
                            onChange={(e) => setTradeForm(prev => ({ ...prev, quantity: e.target.value }))}
                        />
                        <Input
                            label="Preço Unitário"
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            leftIcon={<FiDollarSign />}
                            value={tradeForm.price}
                            onChange={(e) => setTradeForm(prev => ({ ...prev, price: e.target.value }))}
                        />
                    </div>

                    <Input
                        label="Data da Operação"
                        type="date"
                        value={tradeForm.date}
                        onChange={(e) => setTradeForm(prev => ({ ...prev, date: e.target.value }))}
                    />

                    <div className={styles.tradeTotal}>
                        <span>Total Estimado</span>
                        <strong>{formatCurrency((parseFloat(tradeForm.quantity) || 0) * (parseFloat(tradeForm.price) || 0))}</strong>
                    </div>

                    <div className={styles.modalActions}>
                        <Button variant="secondary" onClick={() => setShowTradeModal(false)}>Cancelar</Button>
                        <Button
                            onClick={handleTradeSubmit}
                            variant={tradeForm.type === 'BUY' ? 'primary' : 'danger'}
                        >
                            Confirmar {tradeForm.type === 'BUY' ? 'Compra' : 'Venda'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}