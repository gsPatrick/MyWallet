'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSave, FiLock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { AvatarSelector } from '@/components/gamification';
import gamificationService from '@/services/gamificationService';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

export default function ProfileEditPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        avatarSkinTone: 'pardo',
        avatarGender: 'masculino'
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await gamificationService.getProfile();
            if (response.success) {
                setProfile(response.data);
                setFormData({
                    name: response.data.user?.name || '',
                    email: response.data.user?.email || '',
                    avatarSkinTone: response.data.avatarSkinTone || 'pardo',
                    avatarGender: response.data.avatarGender || 'masculino'
                });
            }
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = ({ skinTone, gender }) => {
        setFormData(prev => ({
            ...prev,
            avatarSkinTone: skinTone,
            avatarGender: gender
        }));
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await gamificationService.updateProfile({
                name: formData.name,
                avatarSkinTone: formData.avatarSkinTone,
                avatarGender: formData.avatarGender
            });

            if (response.success) {
                setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não coincidem' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await gamificationService.changePassword(
                passwordData.currentPassword,
                passwordData.newPassword
            );

            if (response.success) {
                setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao alterar senha' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.back()}>
                        <FiArrowLeft /> Voltar
                    </button>
                    <h1 className={styles.title}>Editar Perfil</h1>
                </div>

                {/* Message */}
                {message.text && (
                    <motion.div
                        className={`${styles.message} ${styles[message.type]}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {message.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
                        {message.text}
                    </motion.div>
                )}

                {/* Avatar Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Avatar</h2>
                    <AvatarSelector
                        value={{ skinTone: formData.avatarSkinTone, gender: formData.avatarGender }}
                        onChange={handleAvatarChange}
                    />
                </section>

                {/* Profile Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Dados Pessoais</h2>

                    <div className={styles.form}>
                        <Input
                            label="Nome"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Seu nome"
                        />
                        <Input
                            label="Email"
                            value={formData.email}
                            disabled
                            placeholder="Seu email"
                        />
                        <p className={styles.emailNote}>O email não pode ser alterado</p>
                    </div>

                    <Button
                        onClick={handleSaveProfile}
                        loading={saving}
                        className={styles.saveBtn}
                    >
                        <FiSave /> Salvar Alterações
                    </Button>
                </section>

                {/* Password Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <FiLock /> Alterar Senha
                    </h2>

                    <div className={styles.form}>
                        <Input
                            type="password"
                            label="Senha Atual"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="Digite sua senha atual"
                        />
                        <Input
                            type="password"
                            label="Nova Senha"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Digite a nova senha"
                        />
                        <Input
                            type="password"
                            label="Confirmar Nova Senha"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirme a nova senha"
                        />
                    </div>

                    <Button
                        onClick={handleChangePassword}
                        loading={saving}
                        variant="secondary"
                        className={styles.saveBtn}
                    >
                        <FiLock /> Alterar Senha
                    </Button>
                </section>
            </div>
        </div>
    );
}
