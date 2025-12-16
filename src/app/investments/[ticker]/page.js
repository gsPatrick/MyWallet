'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiPlus, FiTrendingUp, FiTrendingDown, FiCalendar, FiDollarSign } from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatCurrency, formatPercent, formatDate, getAssetTypeColor } from '@/utils/formatters';
import { mockPortfolio, mockDividends } from '@/utils/mockData';
import styles from './page.module.css';

const mockHistory = [
    { id: 1, type: 'BUY', quantity: 200, price: 28.00, date: '2024-01-15', total: 5600 },
    { id: 2, type: 'BUY', quantity: 150, price: 27.50, date: '2024-03-20', total: 4125 },
    { id: 3, type: 'BUY', quantity: 100, price: 30.00, date: '2024-06-10', total: 3000 },
    { id: 4, type: 'SELL', quantity: 50, price: 32.00, date: '2024-08-05', total: 1600 },
    { id: 5, type: 'BUY', quantity: 100, price: 34.00, date: '2024-10-15', total: 3400 },
];

const mockPriceHistory = [
    { date: '2024-07', price: 28.50 },
    { date: '2024-08', price: 30.20 },
    { date: '2024-09', price: 29.80 },
    { date: '2024-10', price: 32.50 },
    { date: '2024-11', price: 34.00 },
    { date: '2024-12', price: 35.20 },
];

export default function InvestmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ticker = params.ticker;

    // Find the asset from mock data
    const asset = mockPortfolio.positions.find(p => p.ticker === ticker) || {
        ticker,
        name: 'Ativo não encontrado',
        type: 'STOCK',
        quantity: 0,
        averagePrice: 0,
        currentPrice: 0,
        currentValue: 0,
        profit: 0,
        profitPercent: 0,
    };

    const isProfit = asset.profit >= 0;

    // Get dividends for this asset
    const assetDividends = mockDividends.filter(d => d.asset === ticker);

    return (
        <div className={styles.pageWrapper}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Page Header */}
                    <motion.div
                        className={styles.pageHeader}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <button className={styles.backBtn} onClick={() => router.back()}>
                            <FiArrowLeft /> Voltar
                        </button>
                        <div className={styles.assetHeader}>
                            <div
                                className={styles.assetBadge}
                                style={{ background: getAssetTypeColor(asset.type) }}
                            >
                                {asset.type}
                            </div>
                            <div>
                                <h1 className={styles.pageTitle}>{asset.ticker}</h1>
                                <p className={styles.assetName}>{asset.name}</p>
                            </div>
                        </div>
                        <Link href="/investments/create">
                            <Button leftIcon={<FiPlus />}>Nova Operação</Button>
                        </Link>
                    </motion.div>

                    {/* Summary Cards */}
                    <motion.div
                        className={styles.summaryGrid}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card variant="glass" className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Quantidade</span>
                            <span className={styles.summaryValue}>{asset.quantity}</span>
                        </Card>
                        <Card variant="glass" className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Preço Médio</span>
                            <span className={styles.summaryValue}>{formatCurrency(asset.averagePrice)}</span>
                        </Card>
                        <Card variant="glass" className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Cotação Atual</span>
                            <span className={styles.summaryValue}>{formatCurrency(asset.currentPrice)}</span>
                        </Card>
                        <Card variant="glass" className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Valor Total</span>
                            <span className={styles.summaryValue}>{formatCurrency(asset.currentValue)}</span>
                        </Card>
                    </motion.div>

                    {/* Profit Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className={`${styles.profitCard} ${isProfit ? styles.positive : styles.negative}`}>
                            <div className={styles.profitIcon}>
                                {isProfit ? <FiTrendingUp /> : <FiTrendingDown />}
                            </div>
                            <div className={styles.profitInfo}>
                                <span className={styles.profitLabel}>Lucro / Prejuízo</span>
                                <div className={styles.profitValues}>
                                    <span className={styles.profitAmount}>{formatCurrency(asset.profit, true)}</span>
                                    <span className={styles.profitPercent}>{formatPercent(asset.profitPercent, 2, true)}</span>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <div className={styles.contentGrid}>
                        {/* Price Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card>
                                <Card.Header>
                                    <Card.Title>Histórico de Preço</Card.Title>
                                </Card.Header>
                                <Card.Content>
                                    <div className={styles.priceChart}>
                                        {mockPriceHistory.map((item, index) => (
                                            <div key={item.date} className={styles.chartColumn}>
                                                <motion.div
                                                    className={styles.chartBar}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${(item.price / 40) * 100}%` }}
                                                    transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                                                />
                                                <span className={styles.chartLabel}>{item.date.split('-')[1]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card.Content>
                            </Card>
                        </motion.div>

                        {/* Dividends */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Card>
                                <Card.Header>
                                    <Card.Title>Proventos</Card.Title>
                                </Card.Header>
                                <Card.Content>
                                    {assetDividends.length > 0 ? (
                                        <div className={styles.dividendsList}>
                                            {assetDividends.map((div, i) => (
                                                <div key={i} className={styles.dividendItem}>
                                                    <div className={styles.dividendInfo}>
                                                        <span className={styles.dividendType}>{div.type}</span>
                                                        <span className={styles.dividendDate}>
                                                            <FiCalendar /> {formatDate(div.paymentDate)}
                                                        </span>
                                                    </div>
                                                    <span className={styles.dividendAmount}>{formatCurrency(div.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={styles.emptyMessage}>Nenhum provento registrado</p>
                                    )}
                                </Card.Content>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Operations History */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card>
                            <Card.Header>
                                <Card.Title>Histórico de Operações</Card.Title>
                            </Card.Header>
                            <Card.Content>
                                <div className={styles.operationsList}>
                                    {mockHistory.map(op => (
                                        <div key={op.id} className={styles.operationItem}>
                                            <div className={`${styles.operationIcon} ${op.type === 'BUY' ? styles.buy : styles.sell}`}>
                                                {op.type === 'BUY' ? <FiTrendingUp /> : <FiTrendingDown />}
                                            </div>
                                            <div className={styles.operationInfo}>
                                                <span className={styles.operationType}>
                                                    {op.type === 'BUY' ? 'Compra' : 'Venda'}
                                                </span>
                                                <span className={styles.operationDetails}>
                                                    {op.quantity} x {formatCurrency(op.price)}
                                                </span>
                                            </div>
                                            <div className={styles.operationMeta}>
                                                <span className={styles.operationTotal}>{formatCurrency(op.total)}</span>
                                                <span className={styles.operationDate}>{formatDate(op.date)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card.Content>
                        </Card>
                    </motion.div>
                </div>
            </main>

            <Dock />
        </div>
    );
}
