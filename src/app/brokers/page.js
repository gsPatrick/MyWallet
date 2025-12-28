'use client';

/**
 * Brokers Page
 * ========================================
 * Manage brokerage accounts, view portfolio by broker
 * ========================================
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiChevronRight,
    FiTrendingUp, FiX, FiCheck, FiDollarSign, FiPieChart
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import AppShell from '@/components/AppShell';
import GhostCard from '@/components/ui/GhostCard';
import { brokersAPI } from '@/services/api';
import BROKERS_LIST from '@/data/brokers.json';
import styles from './page.module.css';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

function BrokersContent() {
    const router = useRouter();

    const [brokers, setBrokers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBrokerGallery, setShowBrokerGallery] = useState(false);
    const [editingBroker, setEditingBroker] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        brokerCode: '',
        nickname: '',
        investmentFocus: ''
    });

    const loadBrokers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await brokersAPI.list();
            setBrokers(response?.data || []);
            setError(null);
        } catch (err) {
            console.error('Erro ao carregar corretoras:', err);
            setError('Erro ao carregar corretoras');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBrokers();
    }, [loadBrokers]);

    // Broker options from JSON
    const brokerOptions = BROKERS_LIST;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBrokerSelect = (code) => {
        const broker = brokerOptions.find(b => b.code === code);
        setFormData(prev => ({
            ...prev,
            brokerCode: code,
            color: broker?.color,
            logoUrl: broker?.logoUrl
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const selectedBroker = brokerOptions.find(b => b.code === formData.brokerCode);

        try {
            if (editingBroker) {
                await brokersAPI.update(editingBroker.id, {
                    nickname: formData.nickname || null,
                    investmentFocus: formData.investmentFocus || null
                });
            } else {
                // Use frontend dictionary as source of truth
                const template = brokerOptions.find(b => b.code === formData.brokerCode);
                if (!template) {
                    alert('Corretora não encontrada no dicionário local');
                    return;
                }

                await brokersAPI.create({
                    name: template.name,
                    code: template.code,
                    logoUrl: template.logoUrl,
                    color: template.color,
                    icon: template.icon,
                    investmentFocus: formData.investmentFocus || null
                });
            }

            await loadBrokers();
            closeModal();
        } catch (err) {
            console.error('Erro ao salvar corretora:', err);
            alert(err.response?.data?.message || 'Erro ao salvar corretora');
        }
    };

    const handleDelete = async (brokerId) => {
        if (!confirm('Tem certeza que deseja excluir esta corretora?')) return;

        try {
            await brokersAPI.delete(brokerId);
            await loadBrokers();
        } catch (err) {
            console.error('Erro ao excluir corretora:', err);
            alert(err.response?.data?.message || 'Erro ao excluir corretora');
        }
    };

    const handleEdit = (broker) => {
        setEditingBroker(broker);
        setFormData({
            brokerCode: broker.code || '',
            nickname: broker.nickname || '',
            investmentFocus: broker.investmentFocus || ''
        });
        setShowAddModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingBroker(null);
        setFormData({
            brokerCode: '',
            nickname: '',
            investmentFocus: ''
        });
    };

    // Get broker info from JSON
    const getBrokerInfo = (code) => {
        return brokerOptions.find(b => b.code === code) || {};
    };

    // Calculate totals (placeholder - would need actual portfolio data)
    const totalPatrimonio = 0; // Would come from portfolio API

    return (
        <AppShell>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <div className={styles.titleSection}>
                            <h1>Minhas Corretoras</h1>
                            <p>Gerencie suas contas em corretoras</p>
                        </div>
                        <div className={styles.headerActions}>
                            <Link href="/investments" className={styles.investBtn}>
                                <FiPieChart /> Home Broker
                            </Link>
                            <button
                                className={styles.addBtn}
                                onClick={() => setShowAddModal(true)}
                            >
                                <FiPlus /> Nova Corretora
                            </button>
                        </div>
                    </div>

                    {/* Hero Card */}
                    <motion.div
                        className={styles.heroCard}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className={styles.heroContent}>
                            <span className={styles.heroLabel}>Total em Corretoras</span>
                            <span className={styles.heroValue}>
                                {formatCurrency(totalPatrimonio)}
                            </span>
                        </div>
                        <div className={styles.heroStats}>
                            <div className={styles.heroStat}>
                                <span className={styles.statNumber}>{brokers.length}</span>
                                <span className={styles.statLabel}>Corretoras</span>
                            </div>
                            <div className={styles.heroStat}>
                                <span className={styles.statNumber}>
                                    {brokers.filter(b => b.isActive).length}
                                </span>
                                <span className={styles.statLabel}>Ativas</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Loading & Error States */}
                    {loading && (
                        <div className={styles.loadingState}>
                            <FiRefreshCw className={styles.spinner} />
                            <span>Carregando corretoras...</span>
                        </div>
                    )}

                    {error && !loading && (
                        <div className={styles.errorState}>
                            <span>{error}</span>
                            <button onClick={loadBrokers}>Tentar novamente</button>
                        </div>
                    )}

                    {/* Brokers Grid */}
                    {!loading && !error && (
                        <div className={styles.brokersGrid}>
                            {brokers.map((broker) => {
                                const info = getBrokerInfo(broker.code);

                                return (
                                    <motion.div
                                        key={broker.id}
                                        className={styles.brokerCard}
                                        style={{ '--broker-color': info.color || broker.color || '#10b981' }}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ y: -4 }}
                                    >
                                        <div className={styles.brokerHeader}>
                                            {info.logoUrl ? (
                                                <img
                                                    src={info.logoUrl}
                                                    alt={broker.name}
                                                    className={styles.brokerLogo}
                                                />
                                            ) : (
                                                <div
                                                    className={styles.brokerLogoPlaceholder}
                                                    style={{ background: info.color || '#10b981' }}
                                                >
                                                    <FiTrendingUp />
                                                </div>
                                            )}
                                            <div className={styles.brokerInfo}>
                                                <h3>{broker.nickname || broker.name}</h3>
                                                <span className={styles.brokerType}>
                                                    {broker.investmentFocus || info.type || 'Corretora'}
                                                </span>
                                            </div>
                                            <div className={styles.brokerActions}>
                                                <button onClick={() => handleEdit(broker)}>
                                                    <FiEdit2 />
                                                </button>
                                                <button onClick={() => handleDelete(broker.id)}>
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>

                                        <div className={styles.brokerFooter}>
                                            <Link
                                                href={`/investments?broker=${broker.id}`}
                                                className={styles.viewPortfolio}
                                            >
                                                Ver Carteira <FiChevronRight />
                                            </Link>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* Ghost Card */}
                            <div className={styles.ghostCardContainer}>
                                <GhostCard
                                    label="ADICIONAR CORRETORA"
                                    onClick={() => setShowAddModal(true)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Dock />

            {/* Add/Edit Broker Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.modalHeader}>
                                <h2>{editingBroker ? 'Editar Corretora' : 'Nova Corretora'}</h2>
                                <button className={styles.closeBtn} onClick={closeModal}>
                                    <FiX />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className={styles.form}>
                                {/* Broker Selection - Icon Picker Style */}
                                {!editingBroker && (
                                    <div className={styles.formGroup}>
                                        <label>Corretora</label>
                                        <div className={styles.iconPickerSection}>
                                            <div
                                                className={styles.iconPreview}
                                                onClick={() => setShowBrokerGallery(true)}
                                                style={{ '--broker-color': formData.brokerCode ? (brokerOptions.find(b => b.code === formData.brokerCode)?.color || '#6366F1') : '#6366F1' }}
                                            >
                                                {formData.brokerCode ? (
                                                    <>
                                                        {brokerOptions.find(b => b.code === formData.brokerCode)?.logoUrl ? (
                                                            <img
                                                                src={brokerOptions.find(b => b.code === formData.brokerCode)?.logoUrl}
                                                                alt={brokerOptions.find(b => b.code === formData.brokerCode)?.name}
                                                                className={styles.selectedBrokerIcon}
                                                            />
                                                        ) : (
                                                            <span className={styles.brokerInitialLarge}>
                                                                {brokerOptions.find(b => b.code === formData.brokerCode)?.name?.charAt(0)}
                                                            </span>
                                                        )}
                                                        <span className={styles.selectedBrokerName}>
                                                            {brokerOptions.find(b => b.code === formData.brokerCode)?.name}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className={styles.iconPlaceholder}>
                                                        <FiPlus /> Escolher Corretora
                                                    </span>
                                                )}
                                            </div>
                                            {formData.brokerCode && (
                                                <button
                                                    type="button"
                                                    className={styles.changeBrokerBtn}
                                                    onClick={() => setShowBrokerGallery(true)}
                                                >
                                                    Trocar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Nickname */}
                                <div className={styles.formGroup}>
                                    <label>Apelido (opcional)</label>
                                    <input
                                        type="text"
                                        name="nickname"
                                        value={formData.nickname}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Minha XP, Ações Tech..."
                                    />
                                </div>

                                {/* Investment Focus */}
                                <div className={styles.formGroup}>
                                    <label>Foco de Investimento (opcional)</label>
                                    <input
                                        type="text"
                                        name="investmentFocus"
                                        value={formData.investmentFocus}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Ações, FIIs, Renda Fixa..."
                                    />
                                </div>

                                <div className={styles.formActions}>
                                    <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.submitBtn}
                                        disabled={!editingBroker && !formData.brokerCode}
                                    >
                                        <FiCheck /> {editingBroker ? 'Salvar' : 'Adicionar'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Broker Gallery Modal */}
            <AnimatePresence>
                {showBrokerGallery && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowBrokerGallery(false)}
                    >
                        <motion.div
                            className={styles.galleryModal}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.modalHeader}>
                                <h2>Escolher Corretora</h2>
                                <button className={styles.closeBtn} onClick={() => setShowBrokerGallery(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <div className={styles.galleryContent}>
                                <div className={styles.brokerGrid}>
                                    {brokerOptions.map((broker) => (
                                        <button
                                            key={broker.code}
                                            type="button"
                                            className={`${styles.brokerOption} ${formData.brokerCode === broker.code ? styles.selected : ''}`}
                                            style={{ '--broker-color': broker.color }}
                                            onClick={() => {
                                                handleBrokerSelect(broker.code);
                                                setShowBrokerGallery(false);
                                            }}
                                            disabled={brokers.some(b => b.code === broker.code)}
                                        >
                                            {broker.logoUrl ? (
                                                <img src={broker.logoUrl} alt={broker.name} />
                                            ) : (
                                                <span className={styles.brokerInitial}>{broker.name.charAt(0)}</span>
                                            )}
                                            <span>{broker.name}</span>
                                            {brokers.some(b => b.code === broker.code) && (
                                                <span className={styles.alreadyAdded}>Já adicionada</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppShell>
    );
}

// Loading fallback
function BrokersLoading() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    );
}

// Export with Suspense boundary
export default function BrokersPage() {
    return (
        <Suspense fallback={<BrokersLoading />}>
            <BrokersContent />
        </Suspense>
    );
}
