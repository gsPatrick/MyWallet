'use client';

/**
 * Admin Panel - Painel Administrativo
 * ========================================
 * - Dashboard de métricas financeiras
 * - Gestão de usuários
 * - Criação de usuários com planos
 * - Diagnóstico de investimentos
 * ========================================
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiUsers, FiDollarSign, FiTrendingUp, FiUserPlus,
    FiUserMinus, FiSearch, FiGift,
    FiChevronLeft, FiChevronRight, FiPlus,
    FiActivity, FiFileText, FiGrid
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import api from '@/services/api';
import PatchNotesTab from './components/PatchNotesTab';
import InvestmentHealthTab from './components/InvestmentHealthTab';
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
    const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD, USERS, PATCH_NOTES, HEALTH

    // Grant Modal state
    const [showGrantModal, setShowGrantModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [grantPlan, setGrantPlan] = useState('LIFETIME');
    const [granting, setGranting] = useState(false);

    // Create User Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        password: '',
        plan: 'MONTHLY'
    });
    const [creating, setCreating] = useState(false);

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

    const refreshUsers = async () => {
        const data = await api.get('/admin/users', { params: { page } });
        setUsers(data.users || []);
    };

    const handleGrantAccess = async () => {
        if (!selectedUser) return;

        setGranting(true);
        try {
            await api.post(`/admin/users/${selectedUser.id}/grant`, {
                planType: grantPlan
            });
            await refreshUsers();
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
            await refreshUsers();
        } catch (error) {
            console.error('Erro ao revogar acesso:', error);
            alert('Erro ao revogar acesso');
        }
    };

    const handleCreateUser = async () => {
        if (!createForm.name || !createForm.email || !createForm.password) {
            alert('Preencha todos os campos');
            return;
        }

        setCreating(true);
        try {
            await api.post('/admin/users/create', createForm);
            await refreshUsers();
            setShowCreateModal(false);
            setCreateForm({ name: '', email: '', password: '', plan: 'MONTHLY' });
            alert('Usuário criado com sucesso!');
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            alert(error?.error || 'Erro ao criar usuário');
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <div className={styles.container}>
                {/* Page Header */}
                <div className={styles.pageHeader}>
                    <div className={styles.pageTitle}>
                        <h1>Painel Administrativo</h1>
                        <p>Gestão de usuários e métricas do sistema</p>
                    </div>
                    <button className={styles.createUserBtn} onClick={() => setShowCreateModal(true)}>
                        <FiPlus /> Criar Usuário
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className={styles.tabsContainer}>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'DASHBOARD' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('DASHBOARD')}
                    >
                        <FiGrid />
                        <span>Dashboard</span>
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'USERS' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('USERS')}
                    >
                        <FiUsers />
                        <span>Usuários</span>
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'HEALTH' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('HEALTH')}
                    >
                        <FiActivity />
                        <span>Diagnóstico</span>
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'PATCH_NOTES' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('PATCH_NOTES')}
                    >
                        <FiFileText />
                        <span>Patch Notes</span>
                    </button>
                </div>

                {/* Tab Content: Dashboard */}
                {activeTab === 'DASHBOARD' && (
                    <>
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

                        {/* Financial Dashboard */}
                        <div className={styles.financialSection}>
                            <div className={styles.chartCard}>
                                <h3>Receita por Plano</h3>
                                <div className={styles.chartPlaceholder}>
                                    Gráfico de receita em desenvolvimento
                                </div>
                            </div>
                            <div className={styles.chartCard}>
                                <h3>Resumo</h3>
                                <div className={styles.revenueList}>
                                    <div className={styles.revenueItem}>
                                        <span className={styles.revenueLabel}>Assinaturas Mensais</span>
                                        <span className={`${styles.revenueValue} ${styles.positive}`}>
                                            {dashboard?.monthlySubscribers || 0}
                                        </span>
                                    </div>
                                    <div className={styles.revenueItem}>
                                        <span className={styles.revenueLabel}>Assinaturas Anuais</span>
                                        <span className={`${styles.revenueValue} ${styles.positive}`}>
                                            {dashboard?.annualSubscribers || 0}
                                        </span>
                                    </div>
                                    <div className={styles.revenueItem}>
                                        <span className={styles.revenueLabel}>Vitalícios</span>
                                        <span className={styles.revenueValue}>{dashboard?.lifetimeUsers || 0}</span>
                                    </div>
                                    <div className={styles.revenueItem}>
                                        <span className={styles.revenueLabel}>Total de Usuários</span>
                                        <span className={styles.revenueValue}>{dashboard?.totalUsers || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Tab Content: Users */}
                {activeTab === 'USERS' && (
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
                )}

                {/* Tab Content: Patch Notes */}
                {activeTab === 'PATCH_NOTES' && (
                    <PatchNotesTab />
                )}

                {/* Tab Content: Investment Health Diagnostics */}
                {activeTab === 'HEALTH' && (
                    <InvestmentHealthTab />
                )}
            </div>

            {/* Grant Access Modal */}
            <Modal
                isOpen={showGrantModal}
                onClose={() => { setShowGrantModal(false); setSelectedUser(null); }}
                title="Liberar Acesso"
                size="sm"
            >
                <div className={styles.modalContent}>
                    <p>Conceder acesso para <strong>{selectedUser?.name}</strong>?</p>

                    <div className={styles.formGroup}>
                        <label>Selecione o Plano:</label>
                        <select value={grantPlan} onChange={(e) => setGrantPlan(e.target.value)}>
                            <option value="MONTHLY">Mensal (1 mês)</option>
                            <option value="ANNUAL">Anual (1 ano)</option>
                            <option value="LIFETIME">Vitalício (para sempre)</option>
                        </select>
                    </div>

                    <div className={styles.modalActions}>
                        <Button variant="secondary" onClick={() => setShowGrantModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleGrantAccess} disabled={granting}>
                            {granting ? 'Processando...' : 'Confirmar'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Create User Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Criar Novo Usuário"
                size="md"
            >
                <div className={styles.modalContent}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Nome</label>
                            <input
                                type="text"
                                placeholder="Nome completo"
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Email</label>
                            <input
                                type="email"
                                placeholder="email@exemplo.com"
                                value={createForm.email}
                                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Senha</label>
                            <input
                                type="password"
                                placeholder="Senha do usuário"
                                value={createForm.password}
                                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Plano</label>
                            <select
                                value={createForm.plan}
                                onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}
                            >
                                <option value="MONTHLY">Mensal</option>
                                <option value="ANNUAL">Anual</option>
                                <option value="LIFETIME">Vitalício</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateUser} disabled={creating}>
                            {creating ? 'Criando...' : 'Criar Usuário'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
