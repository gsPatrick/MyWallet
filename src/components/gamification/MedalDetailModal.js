'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FiAward, FiX, FiCalendar, FiStar } from 'react-icons/fi';
import styles from './MedalDetailModal.module.css';

const rarityColors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF',
    ruby: '#E0115F',
    emerald: '#50C878',
    legendary: '#FF6B35'
};

const rarityLabels = {
    bronze: 'Bronze',
    silver: 'Prata',
    gold: 'Ouro',
    platinum: 'Platina',
    diamond: 'Diamante',
    ruby: 'Ruby',
    emerald: 'Esmeralda',
    legendary: 'Lendário'
};

const medalPhrases = {
    first_access: '🎉 Todo grande investidor começa com o primeiro passo!',
    week_streak: '💪 Constância é o segredo do sucesso financeiro!',
    month_user: '📅 Um mês firme! Você está construindo um futuro sólido.',
    year_user: '🏆 Um ano de jornada financeira. Você é um veterano!',
    five_years: '⭐ Cinco anos de dedicação. Você é uma lenda!',
    ten_years: '👑 Uma década de excelência. Você é imortal!',
    system_owner: '🚀 O visionário que deu vida ao MyWallet!',
    first_user: '🚩 O pioneiro que acreditou desde o início!',
    beta_tester: '⚡ Obrigado por nos ajudar a construir algo incrível!',
    '10k_club': '💰 R$ 10.000 é só o começo da sua fortuna!',
    '50k_club': '📈 Com R$ 50.000 você já está à frente de muitos!',
    '100k_club': '🎯 Seis dígitos! Você está no caminho certo!',
    '500k_club': '💎 Meio milhão! Você é praticamente um magnata!',
    millionaire: '🤑 UM MILHÃO! Você conquistou o sonho de muitos!',
    first_investment: '📊 O primeiro de muitos investimentos!',
    diversified_5: '🌐 Diversificação é a chave para reduzir riscos!',
    diversified_10: '🔥 10 ativos! Você domina a arte de diversificar!',
    streak_7: '🔥 7 dias! Mantenha o fogo aceso!',
    streak_30: '💫 30 dias de disciplina pura!',
    streak_100: '⚡ 100 dias! Você é imbatível!',
    first_goal: '🎯 Quem tem metas, chega mais longe!',
    goal_complete: '✅ Meta concluída! O sabor da conquista!',
    goal_master: '🏅 5 metas! Você é um mestre em alcançar objetivos!'
};

const formatDate = (date) => {
    if (!date) return 'Não conquistada';
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

export default function MedalDetailModal({ medal, isVisible, onClose }) {
    if (!medal) return null;

    const { name, description, rarity, xpReward, code, isComplete, unlockedAt, progress } = medal;
    const phrase = medalPhrases[code] || '🏅 Uma conquista especial no seu portfólio!';

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className={styles.modal}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className={styles.closeBtn} onClick={onClose}>
                            <FiX />
                        </button>

                        {/* Medal Icon */}
                        <div
                            className={`${styles.medalIcon} ${!isComplete ? styles.locked : ''}`}
                            style={{ '--color': rarityColors[rarity] }}
                        >
                            <FiAward />
                        </div>

                        {/* Medal Name */}
                        <h2 className={styles.name}>{name}</h2>

                        {/* Rarity Badge */}
                        <div
                            className={styles.rarity}
                            style={{ background: rarityColors[rarity] }}
                        >
                            {rarityLabels[rarity]}
                        </div>

                        {/* Description */}
                        <p className={styles.description}>{description}</p>

                        {/* Phrase */}
                        <p className={styles.phrase}>{phrase}</p>

                        {/* Status */}
                        {isComplete ? (
                            <div className={styles.acquired}>
                                <FiCalendar />
                                <span>Conquistada em {formatDate(unlockedAt)}</span>
                            </div>
                        ) : (
                            <div className={styles.progress}>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${progress || 0}%` }}
                                    />
                                </div>
                                <span>{Math.round(progress || 0)}% concluído</span>
                            </div>
                        )}

                        {/* XP Reward */}
                        <div className={styles.xp}>
                            <FiStar />
                            <span>+{xpReward} XP</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
