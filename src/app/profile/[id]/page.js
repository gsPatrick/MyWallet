'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    FiMail, FiCalendar, FiEdit2, FiAward, FiTrendingUp, FiTarget,
    FiDollarSign, FiPieChart, FiStar, FiCheck, FiChevronRight, FiZap
} from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
    Avatar,
    MedalCard,
    AchievementAnimation,
    FeaturedMedals,
    FeaturedMedalsSelector,
    MedalDetailModal
} from '@/components/gamification';
import { useAuth } from '@/contexts/AuthContext';
import gamificationService from '@/services/gamificationService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import styles from './page.module.css';

export default function ProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [medals, setMedals] = useState([]);
    const [medalQueue, setMedalQueue] = useState([]);
    const [currentMedal, setCurrentMedal] = useState(null);
    const [showAnimation, setShowAnimation] = useState(false);
    const [showMedalSelector, setShowMedalSelector] = useState(false);
    const [selectedMedalDetail, setSelectedMedalDetail] = useState(null);
    const [showMedalDetail, setShowMedalDetail] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    // Show next medal from queue when current is closed
    useEffect(() => {
        if (!showAnimation && medalQueue.length > 0) {
            const [nextMedal, ...rest] = medalQueue;
            setCurrentMedal(nextMedal);
            setMedalQueue(rest);
            setShowAnimation(true);
        }
    }, [showAnimation, medalQueue]);

    const loadProfile = async () => {
        try {
            // Try to register activity for streak
            try {
                await gamificationService.registerActivity();
            } catch (e) {
                console.warn('Could not register activity:', e);
            }

            // Try to check for new medals - queue ALL new medals
            try {
                const newMedalsResult = await gamificationService.checkMedals();
                if (newMedalsResult?.success && newMedalsResult?.data?.newMedals?.length > 0) {
                    // Queue all new medals to show one by one
                    setMedalQueue(newMedalsResult.data.newMedals);
                }
            } catch (e) {
                console.warn('Could not check medals:', e);
            }

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

    const handleCloseAnimation = async () => {
        setShowAnimation(false);
        if (currentMedal?.id) {
            try {
                await gamificationService.markMedalNotified(currentMedal.id);
            } catch (e) {
                console.warn('Could not mark medal as notified:', e);
            }
        }
        setCurrentMedal(null);
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
                                <div className={styles.levelBadge}>
                                    <FiZap /> {level}
                                </div>
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
                                    {medals.length > 0 ? (
                                        medals.map(medal => (
                                            <MedalCard
                                                key={medal.id || medal.code}
                                                medal={medal}
                                                isComplete={medal.isComplete}
                                                progress={medal.progress || 0}
                                                isLocked={!medal.isComplete && !medal.progress}
                                                size="small"
                                                onClick={() => router.push('/medals')}
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
                    </div>
                </div>
            </main>

            <Dock />

            {/* Achievement Animation - shows medals from queue one by one */}
            {currentMedal && (
                <AchievementAnimation
                    medal={currentMedal}
                    isVisible={showAnimation}
                    onClose={handleCloseAnimation}
                    autoClose={false}
                />
            )}

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
        </div>
    );
}
