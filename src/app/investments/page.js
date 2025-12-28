'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiTrendingUp, FiPlus, FiSearch, FiPieChart,
    FiDollarSign, FiActivity, FiList, FiRefreshCw, FiExternalLink,
    FiBriefcase, FiLoader, FiTrash2, FiClock, FiArrowDown, FiArrowUp, FiTarget, FiTrendingDown
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
import { investmentsAPI, brokersAPI, bankAccountsAPI, transactionsAPI } from '@/services/api';
import DividendsTab from '@/components/investments/DividendsTab';
import ProductCategoryGrid from '@/components/investments/ProductCategoryGrid';
import RentabilityChart from '@/components/investments/RentabilityChart';
import EconomicTicker from '@/components/investments/EconomicTicker';
import PortfolioTable from '@/components/investments/PortfolioTable';
import InvestorSummary from '@/components/investments/InvestorSummary';
import BROKERS_LIST from '@/data/brokers.json';
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

function InvestmentsContent() {
    const router = useRouter();
    const { formatCurrency } = usePrivateCurrency();
    const [activeTab, setActiveTab] = useState('portfolio');

    // Loading States
    const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
    const [isLoadingMarket, setIsLoadingMarket] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Data State
    const [portfolio, setPortfolio] = useState({ summary: {}, positions: [], allocation: {} });
    const [operations, setOperations] = useState([]);
    const [dividends, setDividends] = useState([]);

    // Market Data State (Paginação e Busca)
    const [marketAssets, setMarketAssets] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [marketPage, setMarketPage] = useState(1);
    const [hasMoreAssets, setHasMoreAssets] = useState(true);
    const [marketCategory, setMarketCategory] = useState(null); // Filter by product type
    const [portfolioFilter, setPortfolioFilter] = useState('classe'); // classe, produto, ativos

    // Modal State
    const [showTradeModal, setShowTradeModal] = useState(false);

    // Brokers State
    const [brokers, setBrokers] = useState([]);
    const availableBrokers = BROKERS_LIST; // Static data from JSON (like cardBanks)
    const [selectedBrokerId, setSelectedBrokerId] = useState(null); // null = todas as corretoras
    const [isLoadingBrokers, setIsLoadingBrokers] = useState(false);

    // Broker Accounts (Contas com saldo)
    const [brokerAccounts, setBrokerAccounts] = useState([]);
    const [allBankAccounts, setAllBankAccounts] = useState([]); // Todas as contas para transferencia

    // Transfer State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferType, setTransferType] = useState('DEPOSIT'); // DEPOSIT | WITHDRAW
    const [transferForm, setTransferForm] = useState({ amount: '', targetAccountId: '', date: new Date().toISOString().split('T')[0] });

    // Form update: Add bankAccountId
    const [tradeForm, setTradeForm] = useState({
        ticker: '', type: 'BUY', quantity: '', price: '', date: new Date().toISOString().split('T')[0], brokerId: '', bankAccountId: ''
    });

    // Expanded Position State (for spreadsheet-like details)
    const [expandedPositionId, setExpandedPositionId] = useState(null);

    // Pie Chart Filter State (filter positions by clicking legend)
    const [selectedAssetType, setSelectedAssetType] = useState(null); // null = all types

    // Netflix-style broker selector (show on entry if no broker selected)
    const [showBrokerSelector, setShowBrokerSelector] = useState(true);

    // URL Params (to skip Netflix selector when coming from /brokers)
    const searchParams = useSearchParams();

    // Economic Indicators (SELIC, CDI, IPCA)
    const [economicIndicators, setEconomicIndicators] = useState({
        selic: null,
        cdi: null,
        ipca: null
    });

    // Check URL params - redirect if no broker selected
    useEffect(() => {
        // Check if coming from /brokers page with ?broker= param
        const brokerParam = searchParams.get('broker');
        if (brokerParam) {
            setSelectedBrokerId(brokerParam);
            setShowBrokerSelector(false); // Skip Netflix selector
        } else {
            // Redirect to brokers page to select a broker first
            router.push('/brokers');
            return;
        }

        // Fetch economic indicators from BCB
        const fetchIndicators = async () => {
            try {
                // Calculate date range (last 30 days) for CDI which requires date params
                const today = new Date();
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);

                const formatDate = (d) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                const dataInicial = formatDate(thirtyDaysAgo);
                const dataFinal = formatDate(today);

                const [selicRes, cdiRes, ipcaRes] = await Promise.all([
                    fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.4189/dados?formato=json&dataInicial=${dataInicial}&dataFinal=${dataFinal}`).then(r => r.json()),
                    fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${dataInicial}&dataFinal=${dataFinal}`).then(r => r.json()),
                    fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=${dataInicial}&dataFinal=${dataFinal}`).then(r => r.json())
                ]);

                setEconomicIndicators({
                    selic: Array.isArray(selicRes) ? selicRes[selicRes.length - 1]?.valor : null,
                    cdi: Array.isArray(cdiRes) ? cdiRes[cdiRes.length - 1]?.valor : null,
                    ipca: Array.isArray(ipcaRes) ? ipcaRes[ipcaRes.length - 1]?.valor : null
                });
            } catch (err) {
                console.error('Erro ao carregar indicadores:', err);
            }
        };
        fetchIndicators();
    }, [searchParams]);

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
            const [pfData, opsData, brokersData, dividendsData, bankAccountsData] = await Promise.all([
                investmentsAPI.getPortfolio(),
                investmentsAPI.list(),
                brokersAPI.list().catch(() => ({ data: [] })),
                investmentsAPI.getDividends().catch(() => ({ data: [] })),
                bankAccountsAPI.list().catch(() => ({ data: [] })),
            ]);
            setPortfolio(pfData.data || { summary: {}, positions: [], allocation: {} });
            setOperations(opsData.data || []);
            setBrokers(brokersData.data || []);
            setDividends(Array.isArray(dividendsData.data) ? dividendsData.data : dividendsData || []);

            // Filter only Broker accounts for trading
            const accounts = Array.isArray(bankAccountsData) ? bankAccountsData : (bankAccountsData.data || []);
            setAllBankAccounts(accounts);
            setBrokerAccounts(accounts.filter(acc => acc.type === 'CORRETORA' || acc.type === 'CARTEIRA'));
        } catch (error) {
            console.error("Erro ao carregar portfolio:", error);
        } finally {
            setIsLoadingPortfolio(false);
        }
    };

    // Broker management handlers
    const handleAddBroker = async (code) => {
        try {
            // Use frontend dictionary as source of truth
            const template = BROKERS_LIST.find(b => b.code === code);
            if (!template) {
                alert('Corretora não encontrada no dicionário local');
                return;
            }

            const response = await brokersAPI.create({
                name: template.name,
                code: template.code,
                logoUrl: template.logoUrl,
                color: template.color,
                icon: template.icon,
                type: template.type
            });

            if (response.data) {
                setBrokers(prev => [...prev, response.data]);
                // Refresh bank accounts to show the new auto-created account immediately
                const bankResponse = await bankAccountsAPI.list();
                if (bankResponse.data) {
                    setAllBankAccounts(bankResponse.data);
                    setBrokerAccounts(bankResponse.data.filter(acc => acc.type === 'CORRETORA' || acc.type === 'CARTEIRA'));
                }
            }
        } catch (error) {
            console.error('Erro ao adicionar corretora:', error);
            alert(error.response?.data?.error || 'Erro ao adicionar corretora');
        }
    };

    const handleRemoveBroker = async (brokerId) => {
        if (!confirm('Remover esta corretora?')) return;
        try {
            await brokersAPI.delete(brokerId);
            setBrokers(prev => prev.filter(b => b.id !== brokerId));
            if (selectedBrokerId === brokerId) setSelectedBrokerId(null);
        } catch (error) {
            console.error('Erro ao remover corretora:', error);
        }
    };

    const loadMarketData = async (page, reset = false) => {
        setIsLoadingMarket(true);
        try {
            // Passa o tipo selecionado (marketCategory) para filtrar na API
            const response = await investmentsAPI.getAssets(searchQuery, page, marketCategory || '');

            // Nova estrutura de resposta: { assets: [...], pagination: {...} }
            const data = response.data || response;
            const newAssets = data.assets || data || [];
            const pagination = data.pagination || { totalPages: 1 };

            if (reset) {
                setMarketAssets(newAssets);
                setMarketPage(1);
            } else {
                setMarketAssets(prev => [...prev, ...newAssets]);
                setMarketPage(page);
            }

            // Usa paginação real da API
            setHasMoreAssets(page < pagination.totalPages);
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
            date: new Date().toISOString().split('T')[0],
            brokerId: selectedBrokerId || '',
            bankAccountId: currentBrokerAccount?.id || ''
        });
        setShowTradeModal(true);
    };

    const handleTradeSubmit = async () => {
        try {
            // Validate that bankAccountId is present for balance check
            if (!tradeForm.bankAccountId) {
                alert('É necessário ter uma conta de corretora vinculada para operar.');
                return;
            }

            // Mapeia 'type' do form para 'operationType' esperado pela API
            await investmentsAPI.registerOperation({
                ticker: tradeForm.ticker.toUpperCase(),
                operationType: tradeForm.type, // BUY ou SELL
                quantity: parseFloat(tradeForm.quantity),
                price: parseFloat(tradeForm.price),
                date: tradeForm.date,
                brokerId: tradeForm.brokerId || null,
                bankAccountId: tradeForm.bankAccountId // For balance validation
            });
            setShowTradeModal(false);
            loadPortfolioData(); // Atualiza a carteira
            alert('Operação registrada com sucesso!');
        } catch (error) {
            // Handle specific error codes
            const errorCode = error?.code || error?.response?.data?.code;
            const errorMsg = error?.error || error?.response?.data?.message || error?.message || 'Erro desconhecido';

            if (errorCode === 'INSUFFICIENT_FUNDS') {
                alert('Saldo insuficiente na conta da corretora. ' + errorMsg);
            } else {
                alert('Erro ao registrar operação: ' + errorMsg);
            }
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

    // Filter groups by selected asset type (from pie chart click)
    const filteredGroupedPortfolio = useMemo(() => {
        if (!selectedAssetType) return groupedPortfolio;
        return { [selectedAssetType]: groupedPortfolio[selectedAssetType] || [] };
    }, [groupedPortfolio, selectedAssetType]);

    // Derived State: Current Broker Account (linked)
    const currentBrokerAccount = useMemo(() => {
        if (!selectedBrokerId || !brokerAccounts.length) return null;
        const broker = brokers.find(b => b.id === selectedBrokerId);
        if (!broker) return null;

        const normalize = (str) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
        const stopWords = ['banco', 'corretora', 'conta', 'investimentos', 's.a.', 'do', 'de', 'da', 'financeira', 'cvm', 'distribuidora'];

        const getTokens = (str) => {
            return normalize(str)
                .split(/[\s-]+/)
                .filter(t => t.length > 2 && !stopWords.includes(t));
        };

        const brokerTokens = getTokens(broker.name);

        // Match by token overlap or if manual link (future)
        return brokerAccounts.find(acc => {
            const accTokens = getTokens(acc.name || acc.bankName);
            // Check if any significant token is shared
            return accTokens.some(at => brokerTokens.some(bt => bt === at || bt.includes(at) || at.includes(bt)));
        });
    }, [selectedBrokerId, brokers, brokerAccounts]);

    // Calculate Broker Total Assets
    const brokerTotalAssets = useMemo(() => {
        if (!selectedBrokerId) return 0;
        return portfolio.positions
            ? portfolio.positions
                .filter(pos => pos.brokerId === selectedBrokerId)
                .reduce((sum, pos) => sum + (pos.currentBalance || 0), 0)
            : 0;
    }, [selectedBrokerId, portfolio]);

    const handleTransfer = async () => {
        try {
            if (!currentBrokerAccount) return alert('Nenhuma conta vinculada a esta corretora.');
            if (!transferForm.targetAccountId) return alert('Selecione a conta de origem/destino.');

            const payload = {
                amount: parseFloat(transferForm.amount),
                date: transferForm.date,
                description: transferType === 'DEPOSIT' ? `Aporte para ${currentBrokerAccount.name}` : `Resgate de ${currentBrokerAccount.name}`,
                fromBankAccountId: transferType === 'DEPOSIT' ? transferForm.targetAccountId : currentBrokerAccount.id,
                toBankAccountId: transferType === 'DEPOSIT' ? currentBrokerAccount.id : transferForm.targetAccountId
            };

            await transactionsAPI.internalTransfer(payload);
            setShowTransferModal(false);
            loadPortfolioData(); // Refresh balances
            alert('Transferência realizada com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro na transferência: ' + (error?.message || 'Erro desconhecido'));
        }
    };

    const renderBrokerHeader = () => {
        const broker = brokers.find(b => b.id === selectedBrokerId);
        if (!broker) return null;

        // Merge with static data to ensure latest logo/colors from JSON
        const staticBroker = BROKERS_LIST.find(b => b.code === broker.code) || {};
        const displayLogo = staticBroker.logoUrl || broker.logoUrl;
        const displayColor = staticBroker.color || broker.color;

        return (
            <div className={styles.brokerDashboardHeader}>
                <div className={styles.brokerHeaderTop}>
                    <div className={styles.brokerInfo}>
                        {displayLogo ? <img src={displayLogo} className={styles.brokerLogoLarge} /> : <div className={styles.brokerIconLarge} style={{ background: displayColor }}>{broker.name[0]}</div>}
                        <div>
                            <h1>{broker.name}</h1>
                            <span className={styles.brokerStatus}><span className={styles.dot}></span> Conectado</span>
                        </div>
                    </div>
                    <button onClick={() => setSelectedBrokerId(null)} className={styles.ghostButton}>
                        Trocar Corretora
                    </button>
                </div>

                <div className={styles.brokerStats}>
                    <div className={styles.statCard}>
                        <span>Saldo em Conta</span>
                        <strong className={styles.highlightMoney}>
                            {formatCurrency(currentBrokerAccount?.balance || 0)}
                        </strong>
                        {!currentBrokerAccount && <small style={{ color: '#ef4444' }}>(Conta não vinculada)</small>}
                    </div>
                    <div className={styles.statCard}>
                        <span>Total Investido</span>
                        <strong>{formatCurrency(brokerTotalAssets)}</strong>
                    </div>
                    <div className={styles.statCard}>
                        <span>Patrimônio Total</span>
                        <strong>{formatCurrency((currentBrokerAccount?.balance || 0) + brokerTotalAssets)}</strong>
                    </div>
                </div>

                <div className={styles.brokerActionsRow}>
                    <Button
                        onClick={() => { setTransferType('DEPOSIT'); setShowTransferModal(true); }}
                        disabled={!currentBrokerAccount}
                        leftIcon={<FiArrowDown />}
                        variant="secondary"
                    >
                        Depositar
                    </Button>
                    <Button
                        onClick={() => { setTransferType('WITHDRAW'); setShowTransferModal(true); }}
                        disabled={!currentBrokerAccount}
                        leftIcon={<FiArrowUp />}
                        variant="secondary"
                    >
                        Sacar
                    </Button>
                    <Button onClick={() => openTradeModal()} leftIcon={<FiTrendingUp />}>
                        Investir
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>

                    {/* --- HEADER OR DASHBOARD --- */}
                    {selectedBrokerId ? renderBrokerHeader() : (
                        <div className={styles.header}>
                            <div>
                                <h1 className={styles.title}>Home Broker</h1>
                                <p className={styles.subtitle}>Todas as Corretoras</p>
                            </div>
                            <div className={styles.headerActions}>
                                <Link href="/brokers">
                                    <Button variant="ghost" leftIcon={<FiBriefcase />}>
                                        Corretoras
                                    </Button>
                                </Link>
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
                    )}

                    {/* --- ECONOMIC TICKER (HERO SECTION) --- */}
                    <EconomicTicker />

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

                    {/* === INVESTOR SUMMARY - MÉTRICAS DO INVESTIDOR === */}
                    {/* Dados vêm da API - nenhum cálculo no frontend */}
                    {/* Renderiza quando há posições, mesmo sem dados completos */}
                    {portfolio.positions?.length > 0 && (
                        <InvestorSummary
                            summary={portfolio.summary}
                            dividends={portfolio.dividends}
                            concentration={portfolio.concentration}
                            rankings={portfolio.rankings}
                            indicators={portfolio.indicators}
                            portfolioMetrics={portfolio.portfolioMetrics}
                            formatCurrency={formatCurrency}
                        />
                    )}


                    {/* --- MODERN TABS --- */}
                    <div className={styles.modernTabsContainer}>
                        <button
                            className={`${styles.modernTab} ${activeTab === 'portfolio' ? styles.modernTabActive : ''}`}
                            onClick={() => setActiveTab('portfolio')}
                        >
                            <FiPieChart />
                            <span>Carteira</span>
                        </button>
                        <button
                            className={`${styles.modernTab} ${activeTab === 'market' ? styles.modernTabActive : ''}`}
                            onClick={() => setActiveTab('market')}
                        >
                            <FiTrendingUp />
                            <span>Mercado</span>
                        </button>
                        <button
                            className={`${styles.modernTab} ${activeTab === 'operations' ? styles.modernTabActive : ''}`}
                            onClick={() => setActiveTab('operations')}
                        >
                            <FiClock />
                            <span>Histórico</span>
                        </button>
                        <button
                            className={`${styles.modernTab} ${activeTab === 'dividends' ? styles.modernTabActive : ''}`}
                            onClick={() => setActiveTab('dividends')}
                        >
                            <FiDollarSign />
                            <span>Proventos</span>
                        </button>
                        <Link href="/brokers" className={styles.modernTab}>
                            <FiBriefcase />
                            <span>Corretoras</span>
                        </Link>
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
                                                                contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
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
                                                {selectedAssetType && (
                                                    <button
                                                        className={styles.clearFilterBtn}
                                                        onClick={() => setSelectedAssetType(null)}
                                                    >
                                                        Limpar filtro
                                                    </button>
                                                )}
                                                {allocationChartData.map(d => (
                                                    <div
                                                        key={d.name}
                                                        className={`${styles.legendItem} ${selectedAssetType === d.name ? styles.legendActive : ''}`}
                                                        onClick={() => setSelectedAssetType(selectedAssetType === d.name ? null : d.name)}
                                                    >
                                                        <span className={styles.legendDot} style={{ background: d.color }} />
                                                        <span>{d.name}</span>
                                                        <strong>{d.value.toFixed(1)}%</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Right: Professional Portfolio Table with Accordion */}
                                    <div className={styles.positionsSection}>
                                        {isLoadingPortfolio ? (
                                            <div className={styles.loadingState}>
                                                <FiLoader className={styles.spin} />
                                                <span>Carregando carteira...</span>
                                            </div>
                                        ) : (
                                            <PortfolioTable
                                                positions={selectedAssetType
                                                    ? portfolio.positions?.filter(p => p.type === selectedAssetType)
                                                    : portfolio.positions || []
                                                }
                                                dividends={dividends}
                                                formatCurrency={formatCurrency}
                                                onTradeClick={(asset) => openTradeModal(asset)}
                                            />
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
                                                {marketAssets.map(asset => (
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

                                            {!isLoadingMarket && marketAssets.length === 0 && (
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

                            {/* --- TAB: BROKERS (CORRETORAS) --- */}
                            {activeTab === 'brokers' && (
                                <motion.div
                                    key="brokers"
                                    variants={TAB_VARIANTS}
                                    initial="hidden" animate="visible" exit="exit"
                                    className={styles.brokersSection}
                                >
                                    <h3 className={styles.sectionTitle}>Minhas Corretoras</h3>

                                    {/* Lista de Corretoras do Usuário */}
                                    <div className={styles.brokersList}>
                                        {brokers.length === 0 ? (
                                            <div className={styles.emptyState}>
                                                <FiBriefcase />
                                                <p>Nenhuma corretora cadastrada.</p>
                                            </div>
                                        ) : (
                                            brokers.map(broker => (
                                                <div
                                                    key={broker.id}
                                                    className={`${styles.brokerCard} ${selectedBrokerId === broker.id ? styles.brokerCardSelected : ''}`}
                                                    onClick={() => setSelectedBrokerId(selectedBrokerId === broker.id ? null : broker.id)}
                                                >
                                                    <div className={styles.brokerCardInfo}>
                                                        {broker.logoUrl ? (
                                                            <img src={broker.logoUrl} alt={broker.name} className={styles.brokerCardLogo} />
                                                        ) : (
                                                            <div className={styles.brokerCardIconWrapper} style={{ background: broker.color }}>
                                                                <FiTrendingUp />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <strong>{broker.name}</strong>
                                                            {broker.investmentFocus && <span>{broker.investmentFocus}</span>}
                                                            {broker.isSystemDefault && <span className={styles.defaultBadge}>Padrão</span>}
                                                        </div>
                                                    </div>
                                                    {!broker.isSystemDefault && (
                                                        <button
                                                            className={styles.brokerRemoveBtn}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveBroker(broker.id);
                                                            }}
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Adicionar Nova Corretora */}
                                    <h4 className={styles.subSectionTitle}>Adicionar Corretora</h4>
                                    <div className={styles.addBrokerGrid}>
                                        {availableBrokers
                                            .filter(ab => !brokers.find(b => b.code === ab.code))
                                            .map(broker => (
                                                <button
                                                    key={broker.code}
                                                    className={styles.addBrokerOption}
                                                    onClick={() => handleAddBroker(broker.code)}
                                                >
                                                    {broker.logoUrl ? (
                                                        <img src={broker.logoUrl} alt={broker.name} />
                                                    ) : (
                                                        <FiTrendingUp style={{ color: broker.color }} />
                                                    )}
                                                    <span>{broker.name}</span>
                                                    <FiPlus className={styles.addIcon} />
                                                </button>
                                            ))
                                        }
                                    </div>
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

                    <Input
                        label="Data da Operação"
                        type="date"
                        value={tradeForm.date}
                        onChange={(e) => setTradeForm(prev => ({ ...prev, date: e.target.value }))}
                    />

                    {/* Seleção de Corretora */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Corretora</label>
                        <select
                            className={styles.formSelect}
                            value={tradeForm.brokerId}
                            onChange={(e) => setTradeForm(prev => ({ ...prev, brokerId: e.target.value }))}
                        >
                            <option value="">Corretora padrão</option>
                            {brokers.map(broker => (
                                <option key={broker.id} value={broker.id}>
                                    {broker.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Seleção de Conta de Liquidação (Saldo) */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Conta de Liquidação (Saldo)</label>
                        <select
                            className={styles.formSelect}
                            value={tradeForm.bankAccountId}
                            onChange={(e) => setTradeForm(prev => ({ ...prev, bankAccountId: e.target.value }))}
                            required
                        >
                            <option value="">Selecione a conta...</option>
                            {brokerAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name} - Saldo: {formatCurrency(acc.balance)}
                                </option>
                            ))}
                        </select>
                        {tradeForm.bankAccountId && brokerAccounts.find(a => a.id === tradeForm.bankAccountId) && (
                            <div className={styles.inputHint} style={{ marginTop: '4px', color: '#10b981' }}>
                                Disponível: {formatCurrency(brokerAccounts.find(a => a.id === tradeForm.bankAccountId).balance)}
                            </div>
                        )}
                        {tradeForm.type === 'BUY' && tradeForm.bankAccountId && brokerAccounts.find(a => a.id === tradeForm.bankAccountId) && (parseFloat(brokerAccounts.find(a => a.id === tradeForm.bankAccountId).balance) < (parseFloat(tradeForm.quantity || 0) * parseFloat(tradeForm.price || 0))) && (
                            <div className={styles.inputHint} style={{ marginTop: '4px', color: '#ef4444' }}>
                                Saldo Insuficiente!
                            </div>
                        )}
                    </div>

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

            {/* Transfer Modal */}
            <Modal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                title={transferType === 'DEPOSIT' ? "Depositar na Corretora" : "Sacar da Corretora"}
                size="sm"
            >
                <div className={styles.tradeForm}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        {transferType === 'DEPOSIT' ? `Transferir da sua conta bancária para ${currentBrokerAccount?.name}` : `Transferir de ${currentBrokerAccount?.name} para sua conta bancária`}
                    </p>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{transferType === 'DEPOSIT' ? 'Conta de Origem' : 'Conta de Destino'}</label>
                        <select
                            className={styles.formSelect}
                            value={transferForm.targetAccountId}
                            onChange={(e) => setTransferForm(prev => ({ ...prev, targetAccountId: e.target.value }))}
                        >
                            <option value="">Selecione a conta...</option>
                            {allBankAccounts
                                .filter(a => a.id !== currentBrokerAccount?.id)
                                .map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.bankName}) - Saldo: {formatCurrency(acc.balance)}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <Input
                        label="Valor"
                        type="number"
                        placeholder="0,00"
                        leftIcon={<FiDollarSign />}
                        value={transferForm.amount}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                    />

                    <Input
                        label="Data"
                        type="date"
                        value={transferForm.date}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, date: e.target.value }))}
                    />

                    <div className={styles.modalActions}>
                        <Button variant="secondary" onClick={() => setShowTransferModal(false)}>Cancelar</Button>
                        <Button onClick={handleTransfer} variant="primary">
                            Confirmar {transferType === 'DEPOSIT' ? 'Depósito' : 'Saque'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default function InvestmentsPage() {
    return (
        <Suspense fallback={<div className={styles.loadingState}>Carregando...</div>}>
            <InvestmentsContent />
        </Suspense>
    );
}