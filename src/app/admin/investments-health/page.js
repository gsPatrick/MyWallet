'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BiRefresh, BiCheck, BiX, BiError, BiChevronDown, BiChevronUp,
    BiServer, BiCloud, BiData, BiLineChart
} from 'react-icons/bi';
import { investmentsAPI } from '@/services/api';
import styles from './page.module.css';

export default function InvestmentsHealthPage() {
    const [diagnostics, setDiagnostics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedItems, setExpandedItems] = useState({});

    const runDiagnostics = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await investmentsAPI.getHealthDiagnostics();
            setDiagnostics(response.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao executar diagnósticos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    const toggleExpand = (service) => {
        setExpandedItems(prev => ({
            ...prev,
            [service]: !prev[service]
        }));
    };

    const getServiceIcon = (service) => {
        switch (service) {
            case 'FII_SCRAPER': return <BiServer />;
            case 'BRAPI': return <BiCloud />;
            case 'YAHOO': return <BiData />;
            case 'BCB_RATES': return <BiLineChart />;
            default: return <BiServer />;
        }
    };

    const getServiceName = (service) => {
        switch (service) {
            case 'FII_SCRAPER': return 'Funds Explorer (FII)';
            case 'BRAPI': return 'Brapi (Ações B3)';
            case 'YAHOO': return 'Yahoo Finance';
            case 'BCB_RATES': return 'Banco Central (Taxas)';
            default: return service;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUCCESS': return '#22c55e';
            case 'WARNING': return '#f59e0b';
            case 'CRITICAL_FAILURE': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'SUCCESS': return <BiCheck />;
            case 'WARNING': return <BiError />;
            case 'CRITICAL_FAILURE': return <BiX />;
            default: return <BiError />;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>🔬 Diagnóstico de Investimentos</h1>
                    <p>Monitoramento em tempo real das fontes de dados</p>
                </div>
                <button
                    className={styles.refreshBtn}
                    onClick={runDiagnostics}
                    disabled={loading}
                >
                    <BiRefresh className={loading ? styles.spinning : ''} />
                    {loading ? 'Analisando...' : 'Executar Diagnóstico'}
                </button>
            </div>

            {error && (
                <div className={styles.errorBanner}>
                    <BiX /> {error}
                </div>
            )}

            {diagnostics && (
                <>
                    {/* Summary */}
                    <div className={styles.summary}>
                        <div className={`${styles.summaryCard} ${styles[diagnostics.summary.overallStatus.toLowerCase()]}`}>
                            <span className={styles.summaryLabel}>Status Geral</span>
                            <span className={styles.summaryValue}>{diagnostics.summary.overallStatus}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Serviços OK</span>
                            <span className={styles.summaryValue} style={{ color: '#22c55e' }}>
                                {diagnostics.summary.success}
                            </span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Avisos</span>
                            <span className={styles.summaryValue} style={{ color: '#f59e0b' }}>
                                {diagnostics.summary.warnings}
                            </span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Falhas</span>
                            <span className={styles.summaryValue} style={{ color: '#ef4444' }}>
                                {diagnostics.summary.failures}
                            </span>
                        </div>
                    </div>

                    {/* Diagnostic Cards */}
                    <div className={styles.diagnosticsList}>
                        {diagnostics.diagnostics.map((diag) => (
                            <motion.div
                                key={diag.service}
                                className={styles.diagnosticCard}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div
                                    className={styles.cardHeader}
                                    onClick={() => diag.status !== 'SUCCESS' && toggleExpand(diag.service)}
                                    style={{ cursor: diag.status !== 'SUCCESS' ? 'pointer' : 'default' }}
                                >
                                    <div className={styles.serviceInfo}>
                                        <div
                                            className={styles.statusIndicator}
                                            style={{ backgroundColor: getStatusColor(diag.status) }}
                                        >
                                            {getStatusIcon(diag.status)}
                                        </div>
                                        <div className={styles.serviceIcon}>
                                            {getServiceIcon(diag.service)}
                                        </div>
                                        <div className={styles.serviceName}>
                                            <h3>{getServiceName(diag.service)}</h3>
                                            <span>{diag.diagnosis}</span>
                                        </div>
                                    </div>
                                    <div className={styles.cardMeta}>
                                        <span className={styles.latency}>{diag.latency}ms</span>
                                        {diag.status !== 'SUCCESS' && (
                                            <button className={styles.expandBtn}>
                                                {expandedItems[diag.service] ? <BiChevronUp /> : <BiChevronDown />}
                                                Ver Diagnóstico
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expandedItems[diag.service] && (
                                        <motion.div
                                            className={styles.diagnosticDetails}
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                        >
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>🔍 O que quebrou:</span>
                                                <span className={styles.detailValue}>{diag.diagnosis}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>⚙️ Detalhe Técnico:</span>
                                                <code className={styles.technicalDetail}>{diag.technicalDetails}</code>
                                            </div>
                                            {diag.recommendedAction && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>✅ Ação Recomendada:</span>
                                                    <span className={styles.actionValue}>{diag.recommendedAction}</span>
                                                </div>
                                            )}
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>🕐 Timestamp:</span>
                                                <span className={styles.detailValue}>
                                                    {new Date(diag.timestamp).toLocaleString('pt-BR')}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </>
            )}

            {loading && !diagnostics && (
                <div className={styles.loadingState}>
                    <BiRefresh className={styles.spinning} />
                    <p>Executando diagnósticos...</p>
                </div>
            )}
        </div>
    );
}
