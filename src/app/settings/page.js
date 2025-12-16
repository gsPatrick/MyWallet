'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiMoon, FiMonitor, FiCheck, FiLink, FiShield, FiDownload, FiBell } from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { authAPI } from '@/services/api';
import styles from './page.module.css';

const accentColors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Rose', value: '#f43f5e' },
];

export default function SettingsPage() {
    const { theme, setTheme, accentColor, setAccentColor } = useTheme();
    const [notifications, setNotifications] = useState({
        dividends: true,
        goals: true,
        budget: true,
        marketing: false,
    });

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const userData = await authAPI.me();
                setUser(userData);
                // Also load preferences if backend supports it (or map user preferences)
            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

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
                        <h1 className={styles.pageTitle}>Configurações</h1>
                        <p className={styles.pageSubtitle}>Personalize sua experiência {user ? `- Olá, ${user.name}` : ''}</p>
                    </motion.div>

                    <div className={styles.settingsGrid}>
                        {/* Appearance */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h2 className={styles.sectionTitle}>Aparência</h2>

                            <Card className={styles.settingCard}>
                                <div className={styles.settingHeader}>
                                    <span className={styles.settingLabel}>Tema</span>
                                </div>
                                <div className={styles.themeOptions}>
                                    <button
                                        className={`${styles.themeBtn} ${theme === 'light' ? styles.active : ''}`}
                                        onClick={() => setTheme('light')}
                                    >
                                        <FiSun />
                                        <span>Claro</span>
                                    </button>
                                    <button
                                        className={`${styles.themeBtn} ${theme === 'dark' ? styles.active : ''}`}
                                        onClick={() => setTheme('dark')}
                                    >
                                        <FiMoon />
                                        <span>Escuro</span>
                                    </button>
                                    <button
                                        className={`${styles.themeBtn}`}
                                        onClick={() => setTheme('dark')}
                                    >
                                        <FiMonitor />
                                        <span>Sistema</span>
                                    </button>
                                </div>
                            </Card>

                            <Card className={styles.settingCard}>
                                <div className={styles.settingHeader}>
                                    <span className={styles.settingLabel}>Cor de Destaque</span>
                                </div>
                                <div className={styles.colorOptions}>
                                    {accentColors.map(color => (
                                        <button
                                            key={color.value}
                                            className={`${styles.colorBtn} ${accentColor === color.value ? styles.active : ''}`}
                                            style={{ background: color.value }}
                                            onClick={() => setAccentColor(color.value)}
                                            title={color.name}
                                        >
                                            {accentColor === color.value && <FiCheck />}
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        </motion.section>

                        {/* Notifications */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className={styles.sectionTitle}>Notificações</h2>

                            <Card className={styles.settingCard}>
                                {[
                                    { key: 'dividends', label: 'Dividendos recebidos', desc: 'Notificar quando receber proventos' },
                                    { key: 'goals', label: 'Metas', desc: 'Alertas sobre progresso das metas' },
                                    { key: 'budget', label: 'Orçamento', desc: 'Avisos quando atingir limites' },
                                    { key: 'marketing', label: 'Novidades', desc: 'Receber dicas e novidades' },
                                ].map(item => (
                                    <div key={item.key} className={styles.toggleItem}>
                                        <div className={styles.toggleInfo}>
                                            <span className={styles.toggleLabel}>{item.label}</span>
                                            <span className={styles.toggleDesc}>{item.desc}</span>
                                        </div>
                                        <button
                                            className={`${styles.toggle} ${notifications[item.key] ? styles.on : ''}`}
                                            onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                                        >
                                            <span className={styles.toggleKnob} />
                                        </button>
                                    </div>
                                ))}
                            </Card>
                        </motion.section>

                        {/* Open Finance */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h2 className={styles.sectionTitle}>Open Finance</h2>

                            <Card className={styles.settingCard}>
                                <div className={styles.openFinanceHeader}>
                                    <FiLink className={styles.linkIcon} />
                                    <div>
                                        <span className={styles.settingLabel}>Conectar Banco</span>
                                        <p className={styles.settingDesc}>Importe seus dados automaticamente via Open Finance Brasil</p>
                                    </div>
                                </div>
                                <Button variant="secondary" leftIcon={<FiLink />}>
                                    Conectar Instituição
                                </Button>
                            </Card>
                        </motion.section>

                        {/* Security */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h2 className={styles.sectionTitle}>Segurança</h2>

                            <Card className={styles.settingCard}>
                                <div className={styles.securityItem}>
                                    <FiShield className={styles.securityIcon} />
                                    <div className={styles.securityInfo}>
                                        <span className={styles.settingLabel}>Alterar Senha</span>
                                        <span className={styles.settingDesc}>Última alteração há 30 dias</span>
                                    </div>
                                    <Button variant="ghost" size="sm">Alterar</Button>
                                </div>
                            </Card>
                        </motion.section>

                        {/* Data */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <h2 className={styles.sectionTitle}>Dados (LGPD)</h2>

                            <Card className={styles.settingCard}>
                                <div className={styles.dataItem}>
                                    <FiDownload className={styles.dataIcon} />
                                    <div className={styles.dataInfo}>
                                        <span className={styles.settingLabel}>Exportar Dados</span>
                                        <span className={styles.settingDesc}>Baixe todos os seus dados em formato JSON</span>
                                    </div>
                                    <Button variant="secondary" size="sm" leftIcon={<FiDownload />}>Exportar</Button>
                                </div>
                            </Card>
                        </motion.section>
                    </div>
                </div>
            </main>

            <Dock />
        </div>
    );
}
