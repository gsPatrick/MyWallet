'use client';

/**
 * Admin Panel - Painel Administrativo
 * ========================================
 * Acesso exclusivo para usuários OWNER
 * Dashboard de métricas, gestão de usuários, etc.
 * ========================================
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiUsers, FiDollarSign, FiTrendingUp, FiUserPlus,
    FiUserMinus, FiSearch, FiGift,
    FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import api from '@/services/api';
import styles from './page.module.css';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

const PLAN_LABELS = {
    FREE: 'Gratuito',
    MONTHLY: 'Mensal',
    ANNUAL: 'Anual',
    LIFETIME: 'Vitalício',
    OWNER: 'Admin'
};

const STATUS_LABELS = {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    PAST_DUE: 'Atrasado',
    CANCELLED: 'Cancelado'
};

export default function AdminPage() {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState(null);
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [filterPlan, setFilterPlan] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Modal state
    const [showGrantModal, setShowGrantModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [grantPlan, setGrantPlan] = useState('LIFETIME');
    const [granting, setGranting] = useState(false);

    // Load dashboard metrics
    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const data = await api.get('/admin/dashboard');
                setDashboard(data);
            } catch (error) {
                console.error('Erro ao carregar dashboard:', error);
            }
        };

        if (user?.plan === 'OWNER') {
            loadDashboard();
        }
    }, [user]);

    // Load users
    useEffect(() => {
        const loadUsers = async () => {
            setUsersLoading(true);
            try {
                const data = await api.get('/admin/users', {
                    params: { page, search, plan: filterPlan, status: filterStatus }
                });
                setUsers(data.users || []);
                setTotalPages(data.totalPages || 1);
            } catch (error) {
                console.error('Erro ao carregar usuários:', error);
            } finally {
                setUsersLoading(false);
            }
        };

        if (user?.plan === 'OWNER') {
            loadUsers();
        }
    }, [user, page, search, filterPlan, filterStatus]);

    const handleGrantAccess = async () => {
        if (!selectedUser) return;

        setGranting(true);
        try {
            await api.post(`/admin/users/${selectedUser.id}/grant`, {
                planType: grantPlan
            });

            // Refresh users
            const data = await api.get('/admin/users', { params: { page } });
            setUsers(data.users || []);

            setShowGrantModal(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Erro ao conceder acesso:', error);
            alert('Erro ao conceder acesso');
        } finally {
            setGranting(false);
        }
    };

    const handleRevokeAccess = async (userId) => {
        if (!confirm('Tem certeza que deseja revogar o acesso deste usuário?')) return;

        try {
            await api.post(`/admin/users/${userId}/revoke`);

            // Refresh users
            const data = await api.get('/admin/users', { params: { page } });
            setUsers(data.users || []);
        } catch (error) {
            console.error('Erro ao revogar acesso:', error);
            alert('Erro ao revogar acesso');
        }
    };

    return (
        <>
            <div className={styles.container}>
                {/* Page Header */}
                <div className={styles.pageHeader}>
                    <h1>Painel Administrativo</h1>
                    <p>Gestão de usuários e métricas do sistema</p>
                </div>

                {/* KPI Cards */}
                <div className={styles.kpiGrid}>
                    <motion.div
                        className={styles.kpiCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className={styles.kpiIcon} style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                            <FiDollarSign />
                        </div>
                        <div className={styles.kpiContent}>
                            <span className={styles.kpiLabel}>Faturamento Total</span>
                            <span className={styles.kpiValue}>{formatCurrency(dashboard?.totalRevenue)}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.kpiCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className={styles.kpiIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                            <FiTrendingUp />
                        </div>
                        <div className={styles.kpiContent}>
                            <span className={styles.kpiLabel}>MRR</span>
                            <span className={styles.kpiValue}>{formatCurrency(dashboard?.mrr)}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.kpiCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className={styles.kpiIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                            <FiUsers />
                        </div>
                        <div className={styles.kpiContent}>
                            <span className={styles.kpiLabel}>Usuários Ativos</span>
                            <span className={styles.kpiValue}>{dashboard?.activeUsers || 0}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.kpiCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className={styles.kpiIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                            <FiUserPlus />
                        </div>
                        <div className={styles.kpiContent}>
                            <span className={styles.kpiLabel}>Novos (Mês)</span>
                            <span className={styles.kpiValue}>{dashboard?.newUsersThisMonth || 0}</span>
                        </div>
                    </motion.div>
                </div>

                {/* Users Section */}
                <div className={styles.usersSection}>
                    <div className={styles.usersHeader}>
                        <h2>Usuários</h2>
                        <div className={styles.filters}>
                            <div className={styles.searchBox}>
                                <FiSearch />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome ou email..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>
                            <select
                                value={filterPlan}
                                onChange={(e) => { setFilterPlan(e.target.value); setPage(1); }}
                            >
                                <option value="">Todos os Planos</option>
                                <option value="FREE">Gratuito</option>
                                <option value="MONTHLY">Mensal</option>
                                <option value="ANNUAL">Anual</option>
                                <option value="LIFETIME">Vitalício</option>
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                            >
                                <option value="">Todos os Status</option>
                                <option value="ACTIVE">Ativo</option>
                                <option value="INACTIVE">Inativo</option>
                                <option value="CANCELLED">Cancelado</option>
                            </select>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className={styles.tableWrapper}>
                        <table className={styles.usersTable}>
                            <thead>
                                <tr>
                                    <th>Usuário</th>
                                    <th>Plano</th>
                                    <th>Status</th>
                                    <th>Expira em</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersLoading ? (
                                    <tr>
                                        <td colSpan={5} className={styles.loadingCell}>
                                            Carregando...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className={styles.emptyCell}>
                                            Nenhum usuário encontrado
                                        </td>
                                    </tr>
                                ) : users.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div className={styles.userCell}>
                                                <img
                                                    src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                                                    alt=""
                                                    className={styles.userAvatar}
                                                />
                                                <div>
                                                    <span className={styles.userName}>{u.name}</span>
                                                    <span className={styles.userEmail}>{u.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.planBadge} ${styles[u.plan?.toLowerCase()]}`}>
                                                {PLAN_LABELS[u.plan] || u.plan}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[u.subscriptionStatus?.toLowerCase()]}`}>
                                                {STATUS_LABELS[u.subscriptionStatus] || u.subscriptionStatus}
                                            </span>
                                        </td>
                                        <td>
                                            {u.subscriptionExpiresAt
                                                ? new Date(u.subscriptionExpiresAt).toLocaleDateString('pt-BR')
                                                : '-'
                                            }
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.grantBtn}
                                                    onClick={() => { setSelectedUser(u); setShowGrantModal(true); }}
                                                    title="Liberar Acesso"
                                                >
                                                    <FiGift />
                                                </button>
                                                {u.plan !== 'FREE' && u.plan !== 'OWNER' && (
                                                    <button
                                                        className={styles.revokeBtn}
                                                        onClick={() => handleRevokeAccess(u.id)}
                                                        title="Revogar Acesso"
                                                    >
                                                        <FiUserMinus />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <FiChevronLeft />
                            </button>
                            <span>Página {page} de {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                <FiChevronRight />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Grant Access Modal */}
            <Modal
                isOpen={showGrantModal}
                onClose={() => { setShowGrantModal(false); setSelectedUser(null); }}
                title="Liberar Acesso"
                size="sm"
            >
                <div className={styles.grantModal}>
                    <p>Conceder acesso para <strong>{selectedUser?.name}</strong>?</p>

                    <div className={styles.grantSelect}>
                        <label>Selecione o Plano:</label>
                        <select value={grantPlan} onChange={(e) => setGrantPlan(e.target.value)}>
                            <option value="MONTHLY">Mensal (1 mês grátis)</option>
                            <option value="ANNUAL">Anual (1 ano grátis)</option>
                            <option value="LIFETIME">Vitalício (para sempre)</option>
                        </select>
                    </div>

                    <div className={styles.grantActions}>
                        <Button variant="secondary" onClick={() => setShowGrantModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleGrantAccess} disabled={granting}>
                            {granting ? 'Processando...' : 'Confirmar'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
