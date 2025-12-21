'use client';

/**
 * Bank Accounts Widget
 * ========================================
 * Widget for displaying bank accounts and balances on dashboard
 * Shows reserved balance from linked goals
 * ========================================
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiPlus, FiChevronRight, FiRefreshCw, FiTarget } from 'react-icons/fi';
import bankAccountService from '@/services/bankAccountService';
import { goalsAPI } from '@/services/api';
import styles from './BankAccountsWidget.module.css';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

export default function BankAccountsWidget() {
    const [accounts, setAccounts] = useState([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            console.log('🏦 [WIDGET] Loading bank accounts and goals...');

            const [accountsResponse, balanceResponse, goalsResponse] = await Promise.all([
                bankAccountService.list(),
                bankAccountService.getTotalBalance(),
                goalsAPI.list().catch(() => [])
            ]);

            console.log('🏦 [WIDGET] Accounts:', accountsResponse);
            console.log('🏦 [WIDGET] Goals:', goalsResponse);

            setAccounts(accountsResponse?.data || accountsResponse || []);
            setTotalBalance(balanceResponse?.data?.totalBalance || balanceResponse?.totalBalance || 0);
            setGoals(goalsResponse?.data || goalsResponse || []);
            setError(null);
        } catch (err) {
            console.error('🏦 [WIDGET] Error loading:', err);
            setError('Erro ao carregar contas');
        } finally {
            setLoading(false);
        }
    };

    // Calculate reserved amount for a specific account from linked goals
    const getReservedAmount = (accountId) => {
        return goals
            .filter(g => g.bankAccountId === accountId && g.status === 'ACTIVE')
            .reduce((sum, g) => sum + parseFloat(g.currentAmount || 0), 0);
    };

    // Calculate total reserved across all accounts
    const totalReserved = goals
        .filter(g => g.status === 'ACTIVE')
        .reduce((sum, g) => sum + parseFloat(g.currentAmount || 0), 0);

    useEffect(() => {
        loadAccounts();
    }, []);

    if (loading) {
        return (
            <div className={styles.widget}>
                <div className={styles.header}>
                    <h3>Minhas Contas</h3>
                </div>
                <div className={styles.loading}>
                    <FiRefreshCw className={styles.spinner} />
                    <span>Carregando...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.widget}>
                <div className={styles.header}>
                    <h3>Minhas Contas</h3>
                </div>
                <div className={styles.error}>
                    <span>{error}</span>
                    <button onClick={loadAccounts}>Tentar novamente</button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className={styles.widget}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className={styles.header}>
                <h3>Minhas Contas</h3>
                <Link href="/banks" className={styles.viewAll}>
                    Ver tudo <FiChevronRight />
                </Link>
            </div>

            {/* Total Balance */}
            <div className={styles.totalBalance}>
                <span className={styles.totalLabel}>Saldo Total</span>
                <span className={styles.totalValue}>{formatCurrency(totalBalance)}</span>
                {totalReserved > 0 && (
                    <span className={styles.reservedBadge}>
                        <FiTarget /> {formatCurrency(totalReserved)} em metas
                    </span>
                )}
            </div>

            {/* Account List */}
            <div className={styles.accountList}>
                {accounts.length === 0 ? (
                    <div className={styles.empty}>
                        <p>Nenhuma conta cadastrada</p>
                        <Link href="/banks?new=true" className={styles.addBtn}>
                            <FiPlus /> Adicionar Conta
                        </Link>
                    </div>
                ) : (
                    <>
                        {accounts.slice(0, 4).map((account, index) => {
                            const reserved = getReservedAmount(account.id);
                            return (
                                <Link
                                    key={account.id}
                                    href={`/banks/${account.id}`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <motion.div
                                        className={styles.accountItem}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className={styles.accountInfo}>
                                            {account.icon ? (
                                                <img
                                                    src={account.icon}
                                                    alt={account.bankName}
                                                    className={styles.bankIcon}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div
                                                    className={styles.bankIconPlaceholder}
                                                    style={{ backgroundColor: account.color || '#6b7280' }}
                                                >
                                                    {account.bankName?.charAt(0) || 'B'}
                                                </div>
                                            )}
                                            <div className={styles.accountDetails}>
                                                <span className={styles.bankName}>
                                                    {account.nickname || account.bankName}
                                                </span>
                                                <span className={styles.accountType}>
                                                    {account.type?.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles.balanceColumn}>
                                            <span
                                                className={`${styles.balance} ${parseFloat(account.balance) >= 0 ? styles.positive : styles.negative}`}
                                            >
                                                {formatCurrency(account.balance)}
                                            </span>
                                            {reserved > 0 && (
                                                <span className={styles.accountReserved}>
                                                    {formatCurrency(reserved)} reservado
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                </Link>
                            );
                        })}

                        {accounts.length > 4 && (
                            <Link href="/banks" className={styles.moreAccounts}>
                                +{accounts.length - 4} mais contas
                            </Link>
                        )}
                    </>
                )}
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <Link href="/banks?new=true" className={styles.actionBtn}>
                    <FiPlus /> Nova Conta
                </Link>
                <Link href="/banks?transfer=true" className={styles.actionBtn}>
                    <FiRefreshCw /> Transferir
                </Link>
            </div>
        </motion.div>
    );
}
