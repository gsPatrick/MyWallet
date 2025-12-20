'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    FiMail, FiCalendar, FiEdit2, FiAward, FiTrendingUp, FiTarget,
    FiDollarSign, FiPieChart, FiStar, FiCheck, FiChevronRight, FiZap, FiPlus, FiX
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
    Avatar,
    MedalCard,
    FeaturedMedals,
    FeaturedMedalsSelector,
    MedalDetailModal
} from '@/components/gamification';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import gamificationService from '@/services/gamificationService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import styles from './page.module.css';

export default function ProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const ownerMedalImage = theme === 'light' ? '/images/medalhadonofundobranco.png' : '/images/medalhadonofundoescuro.png';
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [medals, setMedals] = useState([]);
    const [showMedalSelector, setShowMedalSelector] = useState(false);
    const [selectedMedalDetail, setSelectedMedalDetail] = useState(null);
    const [showMedalDetail, setShowMedalDetail] = useState(false);
    const [showJourneySelector, setShowJourneySelector] = useState(false);
    const [selectedJourneyMedalKey, setSelectedJourneyMedalKey] = useState(null);

    useEffect(() => {
        loadProfile();
        // Load saved journey medal from localStorage
        const saved = localStorage.getItem('selectedJourneyMedal');
        if (saved) setSelectedJourneyMedalKey(Number(saved));
    }, []);

    const loadProfile = async () => {
        try {
            // Try to get profile
            try {
                const profileResult = await gamificationService.getProfile();
                if (profileResult?.success) {
                    setProfile(profileResult.data);
                }
            } catch (e) {
                console.warn('Could not load profile:', e);
            }

            // Try to get stats
            try {
                const statsResult = await gamificationService.getStats();
                if (statsResult?.success) {
                    setStats(statsResult.data);
                }
            } catch (e) {
                console.warn('Could not load stats:', e);
            }

            // Try to get ALL medals (for featured selection and display)
            try {
                const medalsResult = await gamificationService.getMedals();
                if (medalsResult?.success && medalsResult?.data) {
                    const sortedMedals = medalsResult.data.sort((a, b) => {
                        if (a.isComplete && !b.isComplete) return -1;
                        if (!a.isComplete && b.isComplete) return 1;
                        return a.order - b.order;
                    });
                    setMedals(sortedMedals);
                }
            } catch (e) {
                console.warn('Could not load medals:', e);
            }
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveFeaturedMedals = async (medalIds) => {
        try {
            await gamificationService.updateFeaturedMedals(medalIds);
            // Reload profile to get updated featured medals
            const profileResult = await gamificationService.getProfile();
            if (profileResult?.success) {
                setProfile(profileResult.data);
            }
        } catch (e) {
            console.error('Could not save featured medals:', e);
        }
    };

    const handleMedalClick = (medal) => {
        setSelectedMedalDetail(medal);
        setShowMedalDetail(true);
    };

    // Level tier colors (every 10 levels)
    const getLevelColor = (level) => {
        const tier = Math.floor((level - 1) / 10);
        const tierColors = [
            '#22c55e', // 1-10: Green (Iniciante)
            '#3b82f6', // 11-20: Blue (Aprendiz)
            '#8b5cf6', // 21-30: Purple (Intermediário)
            '#ec4899', // 31-40: Pink (Avançado)
            '#f97316', // 41-50: Orange (Expert)
            '#eab308', // 51-60: Yellow (Mestre)
            '#ef4444', // 61-70: Red (Grão-Mestre)
            '#14b8a6', // 71-80: Teal (Elite)
            '#f59e0b', // 81-90: Amber (Lenda)
            '#a855f7', // 91-100: Violet (Imortal)
        ];
        return tierColors[Math.min(tier, 9)];
    };

    // Level Medals Data (same as LevelUpModal)
    // Level Medals Data (enhanced)
    const levelMedals = {
        10: { name: 'Bronze', emoji: '🥉', color: '#CD7F32', rarity: 'bronze', description: 'Alcance o Nível 10' },
        20: { name: 'Prata', emoji: '🥈', color: '#C0C0C0', rarity: 'silver', description: 'Alcance o Nível 20' },
        25: { name: 'Ouro', emoji: '🥇', color: '#FFD700', rarity: 'gold', description: 'Alcance o Nível 25' },
        50: { name: 'Platina', emoji: '💎', color: '#E5E4E2', rarity: 'platinum', description: 'Alcance o Nível 50' },
        70: { name: 'Diamante', emoji: '💠', color: '#B9F2FF', rarity: 'diamond', description: 'Alcance o Nível 70' },
        100: { name: 'Mestre Supremo', emoji: '👑', color: '#FF6B35', rarity: 'diamond', description: 'Alcance o Nível 100' },
        9998: { name: 'Beta Tester', emoji: '⚡', color: '#50C878', rarity: 'emerald', description: 'Participante da fase Beta' }, // Emerald
        9999: { name: 'MyWallet Founder', emoji: '👑', color: '#E0115F', rarity: 'ruby', description: 'Criador do Sistema' } // Ruby
    };

    // Determine which journey medals are unlocked for this user
    const getUnlockedJourneyMedals = () => {
        const email = profile?.user?.email || user?.email;
        const created = profile?.user?.createdAt || user?.createdAt;
        const level = profile?.level || 1;
        const unlocked = [];

        // Check each medal
        Object.entries(levelMedals).forEach(([key, medal]) => {
            const lvl = Number(key);
            let isUnlocked = false;

            if (lvl === 9999) {
                // Ruby / Owner
                isUnlocked = email === 'patrick@gmail.com' || email === 'patrick123@gmail.com';
            } else if (lvl === 9998) {
                // Emerald / Beta
                const isLeo = email?.toLowerCase() === 'leonardo@gmail.com';
                const isBetaDate = created && new Date(created) < new Date('2025-02-01');
                isUnlocked = isLeo || isBetaDate;
            } else {
                // Standard level check
                isUnlocked = level >= lvl;
            }

            if (isUnlocked) {
                unlocked.push({ key: lvl, ...medal });
            }
        });

        return unlocked;
    };

    const handleSelectJourneyMedal = (medalKey) => {
        setSelectedJourneyMedalKey(medalKey);
        localStorage.setItem('selectedJourneyMedal', String(medalKey));
        setShowJourneySelector(false);
    };

    const handleRemoveJourneyMedal = () => {
        setSelectedJourneyMedalKey(null);
        localStorage.removeItem('selectedJourneyMedal');
        setShowJourneySelector(false);
    };

    const selectedJourneyMedal = selectedJourneyMedalKey ? levelMedals[selectedJourneyMedalKey] : null;

    if (loading) {
        return (
            <div className={styles.pageWrapper}>
                <Header />
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                </div>
                <Dock />
            </div>
        );
    }

    const xpProgress = profile?.xpProgress || 0;
    const level = profile?.level || 1;
    const levelColor = getLevelColor(level);

    return (
        <div className={styles.pageWrapper}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Profile Header */}
                    <motion.div
                        className={styles.profileHeader}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className={styles.avatarSection}>
                            <div className={styles.avatarWrapper}>
                                <Avatar
                                    skinTone={profile?.avatarSkinTone || 'pardo'}
                                    gender={profile?.avatarGender || 'masculino'}
                                    size="xlarge"
                                />
                                <div
                                    className={styles.levelBadge}
                                    style={{ background: levelColor }}
                                >
                                    {level}

                                </div>
                                {selectedJourneyMedal ? (
                                    <div
                                        className={`${styles.profileMedalBadge} ${styles.hasMedal}`}
                                        style={{
                                            background: selectedJourneyMedal.rarity === 'ruby' ? 'transparent' : selectedJourneyMedal.color,
                                            boxShadow: selectedJourneyMedal.rarity === 'ruby' ? 'none' : `0 4px 12px ${selectedJourneyMedal.color}60`
                                        }}
                                        title={`Medalha: ${selectedJourneyMedal.name} (Clique para alterar)`}
                                        onClick={() => setShowJourneySelector(true)}
                                    >
                                        {selectedJourneyMedal.rarity === 'ruby' ? (
                                            <img src={ownerMedalImage} className={styles.ownerMedal} alt="Founder" />
                                        ) : (
                                            selectedJourneyMedal.emoji
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        className={styles.profileMedalBadge}
                                        title="Escolher Medalha de Jornada"
                                        onClick={() => setShowJourneySelector(true)}
                                    >
                                        <FiPlus />
                                    </div>
                                )}
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                leftIcon={<FiEdit2 />}
                                onClick={() => router.push('/profile/edit')}
                            >
                                Editar
                            </Button>
                        </div>
                        <div className={styles.userInfo}>
                            <h1 className={styles.userName}>{profile?.user?.name || user?.name || 'Usuário'}</h1>
                            <div className={styles.userMeta}>
                                <span><FiMail /> {profile?.user?.email || user?.email || 'email@example.com'}</span>
                                <span><FiCalendar /> Membro desde {formatDate(profile?.user?.createdAt || user?.createdAt, 'long')}</span>
                            </div>

                            {/* XP Bar */}
                            <div className={styles.xpSection}>
                                <div className={styles.xpHeader}>
                                    <span>Nível {level}</span>
                                    <span>{profile?.xp || 0} / {profile?.xpForNextLevel || 100} XP</span>
                                </div>
                                <div className={styles.xpBar}>
                                    <motion.div
                                        className={styles.xpFill}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${xpProgress}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>

                            {/* Featured Medals */}
                            <FeaturedMedals
                                medals={profile?.featuredMedals || []}
                                allMedals={medals}
                                onEdit={() => setShowMedalSelector(true)}
                            />
                        </div>
                    </motion.div>

                    <div className={styles.profileGrid}>
                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className={styles.statsCard}>
                                <h2 className={styles.cardTitle}><FiTrendingUp /> Estatísticas</h2>
                                <div className={styles.statsGrid}>
                                    <div className={styles.statItem}>
                                        <span className={styles.statValue}>{formatCurrency(stats?.totalPatrimony || 0)}</span>
                                        <span className={styles.statLabel}>Patrimônio Total</span>
                                    </div>
                                    <div className={styles.statItem}>
                                        <span className={`${styles.statValue} ${stats?.totalProfitability > 0 ? styles.profit : styles.loss}`}>
                                            {stats?.totalProfitability > 0 ? '+' : ''}{stats?.totalProfitability?.toFixed(2) || 0}%
                                        </span>
                                        <span className={styles.statLabel}>Rentabilidade</span>
                                    </div>
                                    <div className={styles.statItem}>
                                        <span className={styles.statValue}>{stats?.totalAssets || 0}</span>
                                        <span className={styles.statLabel}>Ativos</span>
                                    </div>
                                    <div className={styles.statItem}>
                                        <span className={styles.statValue}>{profile?.streak || 0} 🔥</span>
                                        <span className={styles.statLabel}>Streak</span>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Achievements */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className={styles.achievementsCard}>
                                <div className={styles.cardHeader}>
                                    <h2 className={styles.cardTitle}><FiAward /> Medalhas</h2>
                                    <button
                                        className={styles.viewAllBtn}
                                        onClick={() => router.push('/medals')}
                                    >
                                        Ver todas <FiChevronRight />
                                    </button>
                                </div>
                                <div className={styles.achievementsList}>
                                    {medals.filter(m => m.isComplete).length > 0 ? (
                                        medals.filter(m => m.isComplete).map(medal => (
                                            <MedalCard
                                                key={medal.id || medal.code}
                                                medal={medal}
                                                isComplete={true}
                                                progress={100}
                                                size="small"
                                                onClick={() => handleMedalClick(medal)}
                                            />
                                        ))
                                    ) : (
                                        <p className={styles.emptyMedals}>
                                            Nenhuma medalha ainda. Continue usando o app para conquistar!
                                        </p>
                                    )}
                                </div>
                            </Card>
                        </motion.div>

                        {/* Level Journey */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className={styles.achievementsCard}>
                                <div className={styles.cardHeader}>
                                    <h2 className={styles.cardTitle}><FiTarget /> Jornada de Nível</h2>
                                </div>
                                <div className={styles.achievementsList}>
                                    {Object.entries(levelMedals).sort((a, b) => Number(a[0]) - Number(b[0])).map(([lvlStr, medal]) => {
                                        const lvl = Number(lvlStr);
                                        let isUnlocked = false;
                                        let progress = 0;

                                        // Special Medals Logic
                                        if (lvl === 9999) { // Ruby / Owner
                                            const email = profile?.user?.email || user?.email;
                                            isUnlocked = email === 'patrick@gmail.com' || email === 'patrick123@gmail.com';
                                            progress = isUnlocked ? 100 : 0;
                                        } else if (lvl === 9998) { // Emerald / Beta
                                            const created = profile?.user?.createdAt || user?.createdAt;
                                            const email = profile?.user?.email || user?.email;
                                            const isLeo = email?.toLowerCase() === 'leonardo@gmail.com';
                                            const isBetaDate = created && new Date(created) < new Date('2025-02-01');

                                            isUnlocked = isLeo || isBetaDate;
                                            progress = isUnlocked ? 100 : 0;
                                        } else {
                                            // Standard Level Logic
                                            isUnlocked = level >= lvl;
                                            if (isUnlocked) {
                                                progress = 100;
                                            } else {
                                                progress = Math.min((level / lvl) * 100, 100);
                                            }
                                        }

                                        let iconComponent;
                                        if (lvl === 9999) {
                                            iconComponent = <img src={ownerMedalImage} className={styles.ownerMedal} alt="Founder" />;
                                        } else {
                                            iconComponent = <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{medal.emoji}</span>;
                                        }

                                        return (
                                            <MedalCard
                                                key={lvl}
                                                medal={{ ...medal, icon: iconComponent }}
                                                isComplete={isUnlocked}
                                                isLocked={!isUnlocked}
                                                progress={progress}
                                                size="small"
                                            />
                                        );
                                    })}
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Dock />

            {/* Featured Medals Selector */}
            <FeaturedMedalsSelector
                isVisible={showMedalSelector}
                onClose={() => setShowMedalSelector(false)}
                allMedals={medals}
                selectedMedals={profile?.featuredMedals || []}
                onSave={handleSaveFeaturedMedals}
            />

            {/* Medal Detail Modal */}
            <MedalDetailModal
                medal={selectedMedalDetail}
                isVisible={showMedalDetail}
                onClose={() => setShowMedalDetail(false)}
            />

            {/* Journey Medal Selector Modal */}
            {showJourneySelector && (
                <div className={styles.modalOverlay} onClick={() => setShowJourneySelector(false)}>
                    <motion.div
                        className={styles.journeySelectorModal}
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <div className={styles.modalHeader}>
                            <h3>Escolher Medalha de Jornada</h3>
                            <button className={styles.closeBtn} onClick={() => setShowJourneySelector(false)}>
                                <FiX />
                            </button>
                        </div>
                        <p className={styles.modalSubtitle}>
                            Selecione uma medalha desbloqueada para exibir no seu perfil
                        </p>
                        <div className={styles.journeyMedalsGrid}>
                            {getUnlockedJourneyMedals().length > 0 ? (
                                getUnlockedJourneyMedals().map((medal) => (
                                    <motion.div
                                        key={medal.key}
                                        className={`${styles.journeyMedalOption} ${selectedJourneyMedalKey === medal.key ? styles.selected : ''}`}
                                        onClick={() => handleSelectJourneyMedal(medal.key)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <div
                                            className={styles.journeyMedalIcon}
                                            style={{ background: medal.color }}
                                        >
                                            {medal.rarity === 'ruby' ? (
                                                <img src={ownerMedalImage} alt="Founder" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            ) : (
                                                medal.emoji
                                            )}
                                        </div>
                                        <span className={styles.journeyMedalName}>{medal.name}</span>
                                        {selectedJourneyMedalKey === medal.key && (
                                            <div className={styles.selectedCheck}><FiCheck /></div>
                                        )}
                                    </motion.div>
                                ))
                            ) : (
                                <p className={styles.noMedals}>Você ainda não desbloqueou nenhuma medalha de jornada.</p>
                            )}
                        </div>
                        {selectedJourneyMedalKey && (
                            <button className={styles.removeMedalBtn} onClick={handleRemoveJourneyMedal}>
                                Remover Medalha Selecionada
                            </button>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
}
