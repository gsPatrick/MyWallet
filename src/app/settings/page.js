'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiSun, FiMoon, FiMonitor, FiCheck, FiLink, FiShield, FiDownload,
    FiBell, FiMessageCircle, FiRefreshCw, FiUser, FiLock, FiSmartphone,
    FiCreditCard, FiLogOut, FiTrash2, FiAlertCircle, FiCheckCircle,
    FiX, FiEdit2, FiSave
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAI } from '@/contexts/AIContext';
import { authAPI, whatsappAPI, settingsAPI } from '@/services/api';
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

const tabs = [
    { id: 'account', label: 'Conta', icon: FiUser },
    { id: 'privacy', label: 'Privacidade', icon: FiLock },
    { id: 'devices', label: 'Dispositivos', icon: FiSmartphone },
    { id: 'plans', label: 'Planos', icon: FiCreditCard },
];

const NOTIFICATION_TYPES = [
    { key: 'PAYMENT_REMINDERS', label: 'Lembretes de pagamento', desc: 'Avisa antes de contas vencerem' },
    { key: 'INCOME_REMINDERS', label: 'Lembretes de receita', desc: 'Avisa sobre receitas programadas' },
    { key: 'INVOICE_REMINDERS', label: 'Lembretes de fatura', desc: 'Avisa sobre faturas do cartão' },
    { key: 'DIVIDENDS', label: 'Dividendos', desc: 'Notifica proventos recebidos' },
    { key: 'GOALS', label: 'Metas', desc: 'Alertas sobre progresso das metas' },
    { key: 'BUDGET_ALERTS', label: 'Orçamento', desc: 'Avisos quando atingir limites' },
    { key: 'STREAK_ALERTS', label: 'Streaks', desc: 'Alertas de sequência de economia' },
    { key: 'DAS_REMINDERS', label: 'DAS (MEI)', desc: 'Lembretes de vencimento do DAS' },
    { key: 'SECURITY_ALERTS', label: 'Segurança', desc: 'Alertas de login em novos dispositivos' },
    { key: 'MARKETING', label: 'Novidades', desc: 'Receber dicas e promoções' },
];

const PLAN_NAMES = {
    'FREE': 'Gratuito',
    'MONTHLY': 'Mensal',
    'ANNUAL': 'Anual',
    'LIFETIME': 'Vitalício',
    'BETA_TESTER': 'Beta Tester',
    'OWNER': 'Proprietário'
};

const PLAN_PRICES = {
    'FREE': 0,
    'MONTHLY': 29.90,
    'ANNUAL': 299.90,
    'LIFETIME': 997,
    'BETA_TESTER': 0,
    'OWNER': 0
};

export default function SettingsPage() {
    const { theme, setTheme, accentColor, setAccentColor } = useTheme();
    const { user: authUser, logout } = useAuth();
    const ai = useAI();
    const [activeTab, setActiveTab] = useState('account');
    const [isMobile, setIsMobile] = useState(false);

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Notification preferences
    const [notificationPrefs, setNotificationPrefs] = useState({});

    // Privacy settings
    const [privacySettings, setPrivacySettings] = useState({ analytics: true, cookies: true });

    // Devices
    const [devices, setDevices] = useState([]);
    const [devicesLoading, setDevicesLoading] = useState(false);

    // Plan info
    const [planInfo, setPlanInfo] = useState(null);

    // Payment methods
    const [paymentMethods, setPaymentMethods] = useState([]);

    // WhatsApp Bot State
    const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
    const [whatsappQR, setWhatsappQR] = useState(null);
    const [whatsappLoading, setWhatsappLoading] = useState(false);

    // Modals
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Edit profile form
    const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', cpf: '' });

    // Password form
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    // Delete form
    const [deleteForm, setDeleteForm] = useState({ password: '', reason: '' });

    // Saving states
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadAllData();
        // Check if mobile
        if (typeof window !== 'undefined') {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window);
        }
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [profileRes, notifRes, privacyRes, planRes, paymentRes] = await Promise.all([
                settingsAPI.getProfile().catch(() => null),
                settingsAPI.getNotificationPreferences().catch(() => ({ data: {} })),
                settingsAPI.getPrivacySettings().catch(() => ({ data: { analytics: true, cookies: true } })),
                settingsAPI.getPlanInfo().catch(() => ({ data: null })),
                settingsAPI.listPaymentMethods().catch(() => ({ data: [] })),
            ]);

            if (profileRes?.data) {
                setUser(profileRes.data);
                setProfileForm({
                    name: profileRes.data.name || '',
                    email: profileRes.data.email || '',
                    phone: profileRes.data.phone || '',
                    cpf: profileRes.data.cpf || ''
                });
            }

            if (notifRes?.data) setNotificationPrefs(notifRes.data);
            if (privacyRes?.data) setPrivacySettings(privacyRes.data);
            if (planRes?.data) setPlanInfo(planRes.data);
            if (paymentRes?.data) setPaymentMethods(paymentRes.data);

            // Load WhatsApp status
            try {
                const wpStatus = await whatsappAPI.getStatus();
                setWhatsappStatus(wpStatus.data?.status || 'disconnected');
            } catch (e) { }
        } catch (error) {
            console.error("Error loading settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadDevices = async () => {
        setDevicesLoading(true);
        try {
            const res = await settingsAPI.listDevices();
            setDevices(res.data || []);
        } catch (error) {
            console.error("Error loading devices:", error);
        } finally {
            setDevicesLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'devices') {
            loadDevices();
        }
    }, [activeTab]);

    // Handlers
    const handleNotificationToggle = async (type) => {
        const currentValue = notificationPrefs[type]?.enabled ?? true;
        const newPrefs = {
            ...notificationPrefs,
            [type]: { ...notificationPrefs[type], enabled: !currentValue }
        };
        setNotificationPrefs(newPrefs);

        try {
            await settingsAPI.updateNotificationPreferences({ [type]: { enabled: !currentValue } });
        } catch (error) {
            console.error("Error updating notification:", error);
            // Revert on error
            setNotificationPrefs(notificationPrefs);
        }
    };

    const handlePrivacyToggle = async (key) => {
        const newSettings = { ...privacySettings, [key]: !privacySettings[key] };
        setPrivacySettings(newSettings);

        try {
            await settingsAPI.updatePrivacySettings(newSettings);
        } catch (error) {
            console.error("Error updating privacy:", error);
            setPrivacySettings(privacySettings);
        }
    };

    const handleUpdateProfile = async () => {
        setSaving(true);
        try {
            const res = await settingsAPI.updateProfile(profileForm);
            setUser(res.data);
            setShowEditProfileModal(false);
        } catch (error) {
            alert(error.error || 'Erro ao atualizar perfil');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('As senhas não coincidem');
            return;
        }

        setSaving(true);
        try {
            await settingsAPI.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
            setShowPasswordModal(false);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            alert('Senha alterada com sucesso!');
            loadAllData(); // Refresh to get new passwordChangedAt
        } catch (error) {
            alert(error.error || 'Erro ao alterar senha');
        } finally {
            setSaving(false);
        }
    };

    const handleDisconnectDevice = async (deviceId) => {
        try {
            await settingsAPI.revokeDevice(deviceId);
            setDevices(prev => prev.filter(d => d.id !== deviceId));
        } catch (error) {
            alert(error.error || 'Erro ao desconectar dispositivo');
        }
    };

    const handleDeleteAccount = async () => {
        if (!deleteForm.password) {
            alert('Digite sua senha para confirmar');
            return;
        }

        setSaving(true);
        try {
            await settingsAPI.deleteAccount(deleteForm.password, deleteForm.reason);
            alert('Conta marcada para exclusão. Você será deslogado.');
            logout();
        } catch (error) {
            alert(error.error || 'Erro ao excluir conta');
        } finally {
            setSaving(false);
        }
    };

    const handleExportData = async () => {
        try {
            const data = await settingsAPI.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mywallet-dados-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('Erro ao exportar dados');
        }
    };

    // WhatsApp handlers
    const handleWhatsappConnect = async () => {
        setWhatsappLoading(true);
        setWhatsappQR(null);
        try {
            const result = await whatsappAPI.connect();
            if (result.data?.qrCode) {
                setWhatsappQR(result.data.qrCode);
                setWhatsappStatus('awaiting_scan');
            } else if (result.data?.status === 'connected') {
                setWhatsappStatus('connected');
            }
        } catch (error) {
            console.error('Erro ao conectar WhatsApp:', error);
        } finally {
            setWhatsappLoading(false);
        }
    };

    const handleWhatsappDisconnect = async () => {
        setWhatsappLoading(true);
        try {
            await whatsappAPI.disconnect();
            setWhatsappStatus('disconnected');
            setWhatsappQR(null);
        } catch (error) {
            console.error('Erro ao desconectar WhatsApp:', error);
        } finally {
            setWhatsappLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Nunca';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const getPasswordAge = () => {
        if (!user?.passwordChangedAt) return 'Nunca alterada';
        const days = Math.floor((Date.now() - new Date(user.passwordChangedAt)) / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Alterada hoje';
        if (days === 1) return 'Alterada ontem';
        return `Alterada há ${days} dias`;
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'account':
                return (
                    <>
                        {/* Profile */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <h2 className={styles.sectionTitle}>Perfil</h2>
                            <Card className={styles.settingCard}>
                                <div className={styles.profileSection}>
                                    <div className={styles.profileAvatar}>
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className={styles.profileInfo}>
                                        <span className={styles.profileName}>{user?.name || 'Usuário'}</span>
                                        <span className={styles.profileEmail}>{user?.email || 'email@exemplo.com'}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setShowEditProfileModal(true)}>
                                        <FiEdit2 /> Editar
                                    </Button>
                                </div>
                            </Card>
                        </motion.section>

                        {/* Appearance */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <h2 className={styles.sectionTitle}>Aparência</h2>
                            <Card className={styles.settingCard}>
                                <div className={styles.settingHeader}>
                                    <span className={styles.settingLabel}>Tema</span>
                                </div>
                                <div className={styles.themeOptions}>
                                    <button className={`${styles.themeBtn} ${theme === 'light' ? styles.active : ''}`} onClick={() => setTheme('light')}>
                                        <FiSun /><span>Claro</span>
                                    </button>
                                    <button className={`${styles.themeBtn} ${theme === 'dark' ? styles.active : ''}`} onClick={() => setTheme('dark')}>
                                        <FiMoon /><span>Escuro</span>
                                    </button>
                                    <button className={styles.themeBtn} onClick={() => setTheme('system')}>
                                        <FiMonitor /><span>Sistema</span>
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
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <h2 className={styles.sectionTitle}>Notificações</h2>
                            <Card className={styles.settingCard}>
                                {NOTIFICATION_TYPES.map(item => (
                                    <div key={item.key} className={styles.toggleItem}>
                                        <div className={styles.toggleInfo}>
                                            <span className={styles.toggleLabel}>{item.label}</span>
                                            <span className={styles.toggleDesc}>{item.desc}</span>
                                        </div>
                                        <button
                                            className={`${styles.toggle} ${notificationPrefs[item.key]?.enabled !== false ? styles.on : ''}`}
                                            onClick={() => handleNotificationToggle(item.key)}
                                        >
                                            <span className={styles.toggleKnob} />
                                        </button>
                                    </div>
                                ))}
                            </Card>
                        </motion.section>

                        {/* Security */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <h2 className={styles.sectionTitle}>Segurança</h2>
                            <Card className={styles.settingCard}>
                                <div className={styles.securityItem}>
                                    <FiShield className={styles.securityIcon} />
                                    <div className={styles.securityInfo}>
                                        <span className={styles.settingLabel}>Alterar Senha</span>
                                        <span className={styles.settingDesc}>{getPasswordAge()}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setShowPasswordModal(true)}>Alterar</Button>
                                </div>
                            </Card>
                        </motion.section>
                    </>
                );

            case 'privacy':
                return (
                    <>
                        {/* Data Export */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <h2 className={styles.sectionTitle}>Seus Dados (LGPD)</h2>
                            <Card className={styles.settingCard}>
                                <div className={styles.dataItem}>
                                    <FiDownload className={styles.dataIcon} />
                                    <div className={styles.dataInfo}>
                                        <span className={styles.settingLabel}>Exportar Dados</span>
                                        <span className={styles.settingDesc}>Baixe todos os seus dados em formato JSON</span>
                                    </div>
                                    <Button variant="secondary" size="sm" leftIcon={<FiDownload />} onClick={handleExportData}>
                                        Exportar
                                    </Button>
                                </div>
                            </Card>
                        </motion.section>

                        {/* Statement */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <h2 className={styles.sectionTitle}>Extrato Financeiro</h2>
                            <Card className={styles.settingCard}>
                                <div className={styles.dataItem}>
                                    <FiDownload className={styles.dataIcon} />
                                    <div className={styles.dataInfo}>
                                        <span className={styles.settingLabel}>Gerar Extrato</span>
                                        <span className={styles.settingDesc}>Visualize movimentações mês a mês e exporte em PDF</span>
                                    </div>
                                    <Button variant="primary" size="sm" onClick={() => window.location.href = '/settings/statement'}>Acessar</Button>
                                </div>
                            </Card>
                        </motion.section>

                        {/* Privacy Settings */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <h2 className={styles.sectionTitle}>Preferências de Privacidade</h2>
                            <Card className={styles.settingCard}>
                                <div className={styles.toggleItem}>
                                    <div className={styles.toggleInfo}>
                                        <span className={styles.toggleLabel}>Compartilhar dados de uso</span>
                                        <span className={styles.toggleDesc}>Ajude a melhorar o app com estatísticas anônimas</span>
                                    </div>
                                    <button
                                        className={`${styles.toggle} ${privacySettings.analytics ? styles.on : ''}`}
                                        onClick={() => handlePrivacyToggle('analytics')}
                                    >
                                        <span className={styles.toggleKnob} />
                                    </button>
                                </div>
                                <div className={styles.toggleItem}>
                                    <div className={styles.toggleInfo}>
                                        <span className={styles.toggleLabel}>Cookies de terceiros</span>
                                        <span className={styles.toggleDesc}>Permitir cookies para personalização</span>
                                    </div>
                                    <button
                                        className={`${styles.toggle} ${privacySettings.cookies ? styles.on : ''}`}
                                        onClick={() => handlePrivacyToggle('cookies')}
                                    >
                                        <span className={styles.toggleKnob} />
                                    </button>
                                </div>
                            </Card>
                        </motion.section>

                        {/* Delete Account */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <h2 className={styles.sectionTitle}>Zona de Perigo</h2>
                            <Card className={`${styles.settingCard} ${styles.dangerCard}`}>
                                <div className={styles.dataItem}>
                                    <FiTrash2 className={styles.dangerIcon} />
                                    <div className={styles.dataInfo}>
                                        <span className={styles.settingLabel}>Excluir Conta</span>
                                        <span className={styles.settingDesc}>Esta ação é irreversível. Todos os seus dados serão apagados.</span>
                                    </div>
                                    <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>Excluir</Button>
                                </div>
                            </Card>
                        </motion.section>
                    </>
                );

            case 'devices':
                return (
                    <>
                        {/* Connected Devices */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <h2 className={styles.sectionTitle}>Dispositivos Conectados</h2>
                            <p className={styles.sectionDesc}>Gerencie os dispositivos que têm acesso à sua conta</p>

                            {devicesLoading ? (
                                <Card className={styles.settingCard}>
                                    <div className={styles.loading}><FiRefreshCw className={styles.spinner} /> Carregando...</div>
                                </Card>
                            ) : (
                                <div className={styles.devicesList}>
                                    {devices.map(device => (
                                        <Card key={device.id} className={`${styles.deviceCard} ${device.isCurrent ? styles.currentDevice : ''}`}>
                                            <div className={styles.deviceInfo}>
                                                <FiSmartphone className={styles.deviceIcon} />
                                                <div className={styles.deviceDetails}>
                                                    <span className={styles.deviceName}>
                                                        {device.deviceName}
                                                        {device.isCurrent && <span className={styles.currentBadge}>Este dispositivo</span>}
                                                    </span>
                                                    <span className={styles.deviceMeta}>
                                                        {device.browser} • {device.os} • {new Date(device.lastActiveAt).toLocaleString('pt-BR')}
                                                    </span>
                                                </div>
                                            </div>
                                            {!device.isCurrent && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDisconnectDevice(device.id)}
                                                    leftIcon={<FiLogOut />}
                                                >
                                                    Desconectar
                                                </Button>
                                            )}
                                        </Card>
                                    ))}
                                    {devices.length === 0 && (
                                        <Card className={styles.settingCard}>
                                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhum dispositivo encontrado</p>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </motion.section>

                        {/* WhatsApp Bot */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <h2 className={styles.sectionTitle}>Assistente WhatsApp</h2>
                            <Card className={styles.settingCard}>
                                <div className={styles.whatsappSection}>
                                    <FiMessageCircle className={styles.whatsappIcon} />
                                    <div className={styles.whatsappInfo}>
                                        <span className={styles.settingLabel}>MyWallet AI Bot</span>
                                        <span className={styles.settingDesc}>Registre transações por texto ou áudio no WhatsApp</span>
                                        <div className={styles.whatsappStatusRow}>
                                            <span className={`${styles.statusDot} ${styles[whatsappStatus]}`} />
                                            <span className={styles.statusText}>
                                                {whatsappStatus === 'connected' && '🟢 Conectado'}
                                                {whatsappStatus === 'awaiting_scan' && '🟡 Aguardando scan'}
                                                {whatsappStatus === 'disconnected' && '🔴 Desconectado'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.whatsappActions}>
                                        {whatsappStatus === 'disconnected' && (
                                            <Button variant="primary" size="sm" onClick={handleWhatsappConnect} loading={whatsappLoading} leftIcon={<FiLink />}>
                                                Conectar
                                            </Button>
                                        )}
                                        {whatsappStatus === 'connected' && (
                                            <Button variant="ghost" size="sm" onClick={handleWhatsappDisconnect} loading={whatsappLoading}>
                                                Desconectar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {whatsappQR && whatsappStatus === 'awaiting_scan' && (
                                    <div className={styles.qrCodeWrapper}>
                                        <img src={whatsappQR} alt="QR Code WhatsApp" className={styles.qrCode} />
                                        <p className={styles.qrInstruction}>Abra o WhatsApp → Aparelhos conectados → Conectar</p>
                                        <Button variant="ghost" size="sm" onClick={handleWhatsappConnect} leftIcon={<FiRefreshCw />}>
                                            Gerar novo QR
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        </motion.section>

                        {/* Open Finance */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <h2 className={styles.sectionTitle}>Open Finance</h2>
                            <Card className={styles.settingCard}>
                                <div className={styles.openFinanceHeader}>
                                    <FiLink className={styles.linkIcon} />
                                    <div>
                                        <span className={styles.settingLabel}>Conectar Banco</span>
                                        <p className={styles.settingDesc}>Importe seus dados automaticamente via Open Finance Brasil</p>
                                    </div>
                                </div>
                                <Button variant="secondary" leftIcon={<FiLink />}>Conectar Instituição</Button>
                            </Card>
                        </motion.section>

                        {/* AI Offline - Mobile Only */}
                        {isMobile && (
                            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <h2 className={styles.sectionTitle}>Inteligência Artificial Offline</h2>
                                <p className={styles.sectionDesc}>Baixe o modelo de IA para usar reconhecimento de voz sem internet</p>
                                <Card className={styles.settingCard}>
                                    <div className={styles.dataItem}>
                                        <div className={styles.aiIconWrapper} style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: '50%',
                                            background: ai.isModelReady ? 'linear-gradient(135deg, #22c55e, #16a34a)' :
                                                ai.status === 'downloading' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' :
                                                    'linear-gradient(135deg, #64748b, #475569)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: 20
                                        }}>
                                            🎙️
                                        </div>
                                        <div className={styles.dataInfo}>
                                            <span className={styles.settingLabel}>
                                                Modelo Whisper
                                                {ai.isModelReady && <span style={{ color: '#22c55e', marginLeft: 8 }}>✓ Instalado</span>}
                                            </span>
                                            <span className={styles.settingDesc}>
                                                {ai.status === 'downloading' && `Baixando... ${Math.round(ai.downloadProgress * 100)}%`}
                                                {ai.status === 'loading' && 'Carregando modelo...'}
                                                {ai.status === 'ready' && ''}
                                                {ai.status === 'idle' && !ai.isModelReady && 'Não instalado (~50MB)'}
                                                {ai.status === 'error' && 'Erro no download'}
                                            </span>
                                            {ai.status === 'downloading' && (
                                                <div style={{
                                                    marginTop: 8,
                                                    width: '100%',
                                                    height: 6,
                                                    background: 'var(--bg-tertiary)',
                                                    borderRadius: 3,
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${ai.downloadProgress * 100}%`,
                                                        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                                        borderRadius: 3,
                                                        transition: 'width 0.3s ease'
                                                    }} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            {!ai.isModelReady && ai.status !== 'downloading' && ai.status !== 'loading' && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    leftIcon={<FiDownload />}
                                                    onClick={() => ai.triggerDownload?.()}
                                                >
                                                    Baixar
                                                </Button>
                                            )}
                                            {ai.isModelReady && (
                                                <span style={{
                                                    padding: '6px 12px',
                                                    background: 'rgba(34, 197, 94, 0.1)',
                                                    color: '#22c55e',
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                    fontWeight: 600
                                                }}>Ativo</span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.section>
                        )}
                    </>
                );

            case 'plans':
                return (
                    <>
                        {/* Current Plan */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <h2 className={styles.sectionTitle}>Seu Plano Atual</h2>

                            <Card className={styles.planCard}>
                                <div className={styles.planHeader}>
                                    <div className={styles.planBadge}>{PLAN_NAMES[planInfo?.plan] || planInfo?.plan || 'FREE'}</div>
                                    <span className={`${styles.planStatus} ${planInfo?.status === 'ACTIVE' ? styles.active : ''}`}>
                                        {planInfo?.status === 'ACTIVE' ? <><FiCheckCircle /> Ativo</> : <><FiAlertCircle /> Inativo</>}
                                    </span>
                                </div>

                                {planInfo?.plan !== 'FREE' && planInfo?.plan !== 'BETA_TESTER' && planInfo?.plan !== 'OWNER' && (
                                    <div className={styles.planPrice}>
                                        <span className={styles.currency}>R$</span>
                                        <span className={styles.amount}>{(PLAN_PRICES[planInfo?.plan] || 0).toFixed(2).replace('.', ',')}</span>
                                        <span className={styles.period}>{planInfo?.plan === 'ANNUAL' ? '/ano' : planInfo?.plan === 'LIFETIME' ? '' : '/mês'}</span>
                                    </div>
                                )}

                                {planInfo?.expiresAt && (
                                    <div className={styles.planRenewal}>
                                        <FiAlertCircle />
                                        <span>Próxima renovação: <strong>{formatDate(planInfo.expiresAt)}</strong></span>
                                        {planInfo.daysRemaining !== null && (
                                            <span className={styles.daysLeft}>({planInfo.daysRemaining} dias restantes)</span>
                                        )}
                                    </div>
                                )}

                                {planInfo?.plan === 'LIFETIME' && (
                                    <div className={styles.planRenewal} style={{ background: 'var(--success-light)', borderColor: 'var(--success)' }}>
                                        <FiCheckCircle style={{ color: 'var(--success)' }} />
                                        <span style={{ color: 'var(--success)' }}>Acesso vitalício - sem renovação</span>
                                    </div>
                                )}

                                {planInfo?.plan === 'BETA_TESTER' && (
                                    <div className={styles.planRenewal} style={{ background: 'var(--accent-primary-light)' }}>
                                        <FiCheckCircle style={{ color: 'var(--accent-primary)' }} />
                                        <span>Beta Tester - Acesso gratuito durante o beta</span>
                                    </div>
                                )}

                                {planInfo?.plan === 'OWNER' && (
                                    <div className={styles.planRenewal} style={{ background: 'linear-gradient(135deg, gold, orange)', color: '#000' }}>
                                        <FiCheckCircle />
                                        <span><strong>Proprietário - Acesso total ao sistema</strong></span>
                                    </div>
                                )}

                                {planInfo?.features && (
                                    <div className={styles.planFeatures}>
                                        <h4>Recursos:</h4>
                                        <ul>
                                            {planInfo.features.map((feature, index) => (
                                                <li key={index} className={feature.included ? styles.included : styles.notIncluded}>
                                                    {feature.included ? <FiCheckCircle /> : <FiX />}
                                                    {feature.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {planInfo?.plan !== 'OWNER' && planInfo?.plan !== 'LIFETIME' && (
                                    <div className={styles.planActions}>
                                        <Button variant="secondary">Alterar Plano</Button>
                                        {planInfo?.plan !== 'FREE' && <Button variant="ghost">Cancelar Assinatura</Button>}
                                    </div>
                                )}
                            </Card>
                        </motion.section>

                        {/* Payment Method */}
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <h2 className={styles.sectionTitle}>Método de Pagamento</h2>
                            <Card className={styles.settingCard}>
                                {paymentMethods.length > 0 ? (
                                    paymentMethods.map(method => (
                                        <div key={method.id} className={styles.paymentMethod}>
                                            <FiCreditCard className={styles.paymentIcon} />
                                            <div className={styles.paymentInfo}>
                                                <span className={styles.settingLabel}>{method.cardBrand || 'Cartão'}</span>
                                                <span className={styles.settingDesc}>•••• •••• •••• {method.cardLastFour}</span>
                                            </div>
                                            <Button variant="ghost" size="sm">Alterar</Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.paymentMethod}>
                                        <FiCreditCard className={styles.paymentIcon} />
                                        <div className={styles.paymentInfo}>
                                            <span className={styles.settingLabel}>Nenhum cartão cadastrado</span>
                                            <span className={styles.settingDesc}>Adicione um cartão para assinar um plano</span>
                                        </div>
                                        <Button variant="primary" size="sm">Adicionar</Button>
                                    </div>
                                )}
                            </Card>
                        </motion.section>
                    </>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className={styles.pageWrapper}>
                <Header />
                <main className={styles.main}>
                    <div className={styles.container}>
                        <div className={styles.loading}><FiRefreshCw className={styles.spinner} /> Carregando...</div>
                    </div>
                </main>
                <Dock />
            </div>
        );
    }

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

                    {/* Tabs */}
                    <div className={styles.tabsContainer}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className={styles.settingsGrid}>
                        {renderTabContent()}
                    </div>
                </div>
            </main>

            <Dock />

            {/* Edit Profile Modal */}
            <Modal
                isOpen={showEditProfileModal}
                onClose={() => setShowEditProfileModal(false)}
                title="Editar Perfil"
            >
                <div className={styles.modalForm}>
                    <div className={styles.formGroup}>
                        <label>Nome</label>
                        <input
                            type="text"
                            value={profileForm.name}
                            onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={profileForm.email}
                            onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Telefone</label>
                        <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>CPF</label>
                        <input
                            type="text"
                            value={profileForm.cpf}
                            onChange={e => setProfileForm({ ...profileForm, cpf: e.target.value })}
                            placeholder="000.000.000-00"
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <Button variant="ghost" onClick={() => setShowEditProfileModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleUpdateProfile} loading={saving}>
                            <FiSave /> Salvar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                title="Alterar Senha"
            >
                <div className={styles.modalForm}>
                    <div className={styles.formGroup}>
                        <label>Senha Atual</label>
                        <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Nova Senha</label>
                        <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Confirmar Nova Senha</label>
                        <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleChangePassword} loading={saving}>
                            <FiSave /> Alterar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Account Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Excluir Conta"
            >
                <div className={styles.modalForm}>
                    <div className={styles.dangerWarning}>
                        <FiAlertCircle />
                        <p>Esta ação é <strong>irreversível</strong>. Todos os seus dados financeiros, metas, investimentos e configurações serão permanentemente apagados.</p>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Digite sua senha para confirmar</label>
                        <input
                            type="password"
                            value={deleteForm.password}
                            onChange={e => setDeleteForm({ ...deleteForm, password: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Motivo (opcional)</label>
                        <textarea
                            value={deleteForm.reason}
                            onChange={e => setDeleteForm({ ...deleteForm, reason: e.target.value })}
                            placeholder="Por que você está saindo?"
                            rows={3}
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
                        <Button variant="danger" onClick={handleDeleteAccount} loading={saving}>
                            <FiTrash2 /> Excluir Minha Conta
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
