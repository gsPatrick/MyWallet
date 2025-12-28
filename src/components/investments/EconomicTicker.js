'use client';

import { useState, useEffect } from 'react';
import { FiTrendingUp, FiTrendingDown, FiLoader } from 'react-icons/fi';
import styles from './EconomicTicker.module.css';

/**
 * EconomicTicker - Hero Section Component
 * Displays macro economic indicators: SELIC, CDI, IPCA, IBOV, IFIX, Dólar
 */
export default function EconomicTicker() {
    const [indicators, setIndicators] = useState({
        selic: { value: null, change: null, loading: true },
        cdi: { value: null, change: null, loading: true },
        ipca: { value: null, change: null, loading: true },
        ibov: { value: null, change: null, loading: true },
        ifix: { value: null, change: null, loading: true },
        dolar: { value: null, change: null, loading: true }
    });

    useEffect(() => {
        fetchAllIndicators();
    }, []);

    const fetchAllIndicators = async () => {
        // Calcula datas para as APIs do BCB
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const formatBCBDate = (d) =>
            `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

        const dataInicial = formatBCBDate(thirtyDaysAgo);
        const dataFinal = formatBCBDate(today);

        // Fetch em paralelo
        const [selicData, cdiData, ipcaData, marketData] = await Promise.allSettled([
            // BCB APIs
            fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.4189/dados?formato=json&dataInicial=${dataInicial}&dataFinal=${dataFinal}`)
                .then(r => r.json()),
            fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${dataInicial}&dataFinal=${dataFinal}`)
                .then(r => r.json()),
            fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=${dataInicial}&dataFinal=${dataFinal}`)
                .then(r => r.json()),
            // Yahoo Finance via proxy (IBOV, IFIX, Dólar)
            fetchMarketQuotes()
        ]);

        // Process BCB data
        setIndicators(prev => ({
            ...prev,
            selic: {
                value: selicData.status === 'fulfilled' && Array.isArray(selicData.value)
                    ? parseFloat(selicData.value[selicData.value.length - 1]?.valor || 0)
                    : null,
                change: null, // SELIC doesn't have daily change
                loading: false
            },
            cdi: {
                value: cdiData.status === 'fulfilled' && Array.isArray(cdiData.value)
                    ? parseFloat(cdiData.value[cdiData.value.length - 1]?.valor || 0)
                    : null,
                change: null,
                loading: false
            },
            ipca: {
                value: ipcaData.status === 'fulfilled' && Array.isArray(ipcaData.value)
                    ? parseFloat(ipcaData.value[ipcaData.value.length - 1]?.valor || 0)
                    : null,
                change: null,
                loading: false
            },
            ...(marketData.status === 'fulfilled' ? marketData.value : {})
        }));
    };

    /**
     * Fetches IBOV, IFIX, and USD/BRL quotes
     * Uses a simple approach - in production, this could use your backend as proxy
     */
    const fetchMarketQuotes = async () => {
        try {
            // Brapi has a free tier for Brazilian market quotes
            const response = await fetch('https://brapi.dev/api/quote/^BVSP,IFIX.SA,USDBRL=X?token=demo');
            const data = await response.json();

            if (!data.results) {
                throw new Error('No results');
            }

            const quotes = {};
            data.results.forEach(quote => {
                if (quote.symbol === '^BVSP' || quote.symbol === 'IBOV') {
                    quotes.ibov = {
                        value: quote.regularMarketPrice,
                        change: quote.regularMarketChangePercent,
                        loading: false
                    };
                } else if (quote.symbol === 'IFIX' || quote.symbol === 'IFIX.SA') {
                    quotes.ifix = {
                        value: quote.regularMarketPrice,
                        change: quote.regularMarketChangePercent,
                        loading: false
                    };
                } else if (quote.symbol.includes('USD') || quote.symbol.includes('BRL')) {
                    quotes.dolar = {
                        value: quote.regularMarketPrice,
                        change: quote.regularMarketChangePercent,
                        loading: false
                    };
                }
            });

            return quotes;
        } catch (error) {
            console.error('Error fetching market quotes:', error);
            // Fallback: try individual BCB quote for USD
            try {
                const today = new Date();
                const formatDate = (d) =>
                    `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}-${d.getFullYear()}`;
                const usdResponse = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json`);
                const usdData = await usdResponse.json();

                return {
                    ibov: { value: null, change: null, loading: false },
                    ifix: { value: null, change: null, loading: false },
                    dolar: {
                        value: Array.isArray(usdData) ? parseFloat(usdData[0]?.valor || 0) : null,
                        change: null,
                        loading: false
                    }
                };
            } catch {
                return {
                    ibov: { value: null, change: null, loading: false },
                    ifix: { value: null, change: null, loading: false },
                    dolar: { value: null, change: null, loading: false }
                };
            }
        }
    };

    const formatValue = (indicator, value) => {
        if (value === null) return '—';

        switch (indicator) {
            case 'selic':
            case 'cdi':
            case 'ipca':
                return `${value.toFixed(2)}%`;
            case 'ibov':
            case 'ifix':
                return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
            case 'dolar':
                return `R$ ${value.toFixed(2)}`;
            default:
                return value.toString();
        }
    };

    const indicatorConfig = [
        { key: 'selic', label: 'SELIC', description: 'Taxa básica' },
        { key: 'cdi', label: 'CDI', description: 'Taxa diária' },
        { key: 'ipca', label: 'IPCA', description: 'Inflação mensal' },
        { key: 'ibov', label: 'IBOV', description: 'Índice Bovespa' },
        { key: 'ifix', label: 'IFIX', description: 'Fundos Imob.' },
        { key: 'dolar', label: 'USD/BRL', description: 'Dólar comercial' }
    ];

    return (
        <div className={styles.tickerContainer}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                    <FiTrendingUp className={styles.sectionIcon} />
                    <span>Indicadores de Mercado</span>
                </div>
                <span className={styles.sectionSubtitle}>Atualização em tempo real</span>
            </div>
            <div className={styles.tickerScroll}>
                {indicatorConfig.map((config, index) => {
                    const indicator = indicators[config.key];
                    const hasChange = indicator.change !== null && indicator.change !== undefined;
                    const isPositive = hasChange && indicator.change >= 0;

                    return (
                        <div key={config.key} className={styles.tickerCard}>
                            <div className={styles.tickerHeader}>
                                <span className={styles.tickerLabel}>{config.label}</span>
                                {hasChange && (
                                    <span className={`${styles.changeIndicator} ${isPositive ? styles.positive : styles.negative}`}>
                                        {isPositive ? <FiTrendingUp /> : <FiTrendingDown />}
                                        {Math.abs(indicator.change).toFixed(2)}%
                                    </span>
                                )}
                            </div>
                            <div className={styles.tickerValue}>
                                {indicator.loading ? (
                                    <FiLoader className={styles.spinner} />
                                ) : (
                                    formatValue(config.key, indicator.value)
                                )}
                            </div>
                            <span className={styles.tickerDescription}>{config.description}</span>
                            {index < indicatorConfig.length - 1 && (
                                <div className={styles.divider} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

