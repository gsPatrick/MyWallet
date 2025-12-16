'use client';

import { motion } from 'framer-motion';
import { FiUsers, FiActivity, FiDatabase, FiShield } from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import styles from './page.module.css';

const systemStats = [
    { label: 'Usuários Ativos', value: '15,234', icon: FiUsers, color: 'var(--accent-primary)' },
    { label: 'Transações Hoje', value: '45,678', icon: FiActivity, color: 'var(--accent-success)' },
    { label: 'Dados Processados', value: '2.5 TB', icon: FiDatabase, color: 'var(--accent-info)' },
    { label: 'Uptime', value: '99.9%', icon: FiShield, color: 'var(--accent-warning)' },
];

const recentUsers = [
    { id: 1, name: 'João Silva', email: 'joao@email.com', status: 'active', joined: '2024-12-14' },
    { id: 2, name: 'Maria Santos', email: 'maria@email.com', status: 'active', joined: '2024-12-13' },
    { id: 3, name: 'Pedro Oliveira', email: 'pedro@email.com', status: 'pending', joined: '2024-12-12' },
    { id: 4, name: 'Ana Costa', email: 'ana@email.com', status: 'active', joined: '2024-12-11' },
];

export default function AdminPage() {
    return (
        <div className={styles.pageWrapper}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    <motion.div
                        className={styles.pageHeader}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className={styles.pageTitle}>Administração</h1>
                        <p className={styles.pageSubtitle}>Painel de controle do sistema</p>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        className={styles.statsGrid}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        {systemStats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <Card key={index} className={styles.statCard}>
                                    <div className={styles.statIcon} style={{ background: `${stat.color}20`, color: stat.color }}>
                                        <Icon />
                                    </div>
                                    <div className={styles.statInfo}>
                                        <span className={styles.statValue}>{stat.value}</span>
                                        <span className={styles.statLabel}>{stat.label}</span>
                                    </div>
                                </Card>
                            );
                        })}
                    </motion.div>

                    {/* Users Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card>
                            <h2 className={styles.cardTitle}>Usuários Recentes</h2>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Email</th>
                                            <th>Status</th>
                                            <th>Data</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentUsers.map(user => (
                                            <tr key={user.id}>
                                                <td>{user.name}</td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${styles[user.status]}`}>
                                                        {user.status === 'active' ? 'Ativo' : 'Pendente'}
                                                    </span>
                                                </td>
                                                <td>{new Date(user.joined).toLocaleDateString('pt-BR')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </main>

            <Dock />
        </div>
    );
}
