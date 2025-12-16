'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiAward, FiCheckCircle, FiLock } from 'react-icons/fi';
import MedalCard from './MedalCard';
import styles from './MedalBook.module.css';

const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'patrimony', label: 'Patrimônio' },
    { id: 'investment', label: 'Investimento' },
    { id: 'saving', label: 'Economia' },
    { id: 'consistency', label: 'Consistência' },
    { id: 'social', label: 'Social' },
    { id: 'milestone', label: 'Marcos' }
];

const filters = [
    { id: 'all', label: 'Todas', icon: FiAward },
    { id: 'complete', label: 'Conquistadas', icon: FiCheckCircle },
    { id: 'locked', label: 'Bloqueadas', icon: FiLock }
];

export default function MedalBook({
    medals = [],
    onMedalClick
}) {
    const [category, setCategory] = useState('all');
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    // Stats
    const stats = useMemo(() => {
        const total = medals.length;
        const complete = medals.filter(m => m.isComplete).length;
        const inProgress = medals.filter(m => !m.isComplete && m.progress > 0).length;
        const locked = total - complete - inProgress;
        return { total, complete, inProgress, locked };
    }, [medals]);

    // Filtered medals
    const filteredMedals = useMemo(() => {
        return medals.filter(medal => {
            // Category filter
            if (category !== 'all' && medal.category !== category) return false;

            // Status filter
            if (filter === 'complete' && !medal.isComplete) return false;
            if (filter === 'locked' && medal.isComplete) return false;

            // Search
            if (search) {
                const searchLower = search.toLowerCase();
                if (!medal.name.toLowerCase().includes(searchLower) &&
                    !medal.description.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }

            return true;
        });
    }, [medals, category, filter, search]);

    return (
        <div className={styles.book}>
            {/* Stats */}
            <div className={styles.stats}>
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.complete}</span>
                    <span className={styles.statLabel}>Conquistadas</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.inProgress}</span>
                    <span className={styles.statLabel}>Em Progresso</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.total}</span>
                    <span className={styles.statLabel}>Total</span>
                </div>
            </div>

            {/* Search */}
            <div className={styles.searchWrapper}>
                <FiSearch className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Buscar medalhas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {/* Categories */}
            <div className={styles.categories}>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        className={`${styles.categoryBtn} ${category === cat.id ? styles.active : ''}`}
                        onClick={() => setCategory(cat.id)}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                {filters.map((f) => (
                    <button
                        key={f.id}
                        className={`${styles.filterBtn} ${filter === f.id ? styles.active : ''}`}
                        onClick={() => setFilter(f.id)}
                    >
                        <f.icon />
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Medals Grid */}
            <div className={styles.medalsGrid}>
                <AnimatePresence mode="popLayout">
                    {filteredMedals.length > 0 ? (
                        filteredMedals.map((medal, index) => (
                            <motion.div
                                key={medal.id || medal.code}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <MedalCard
                                    medal={medal}
                                    isComplete={medal.isComplete}
                                    progress={medal.progress || 0}
                                    isLocked={!medal.isComplete && medal.progress === 0}
                                    onClick={() => onMedalClick?.(medal)}
                                />
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            className={styles.emptyState}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <FiAward className={styles.emptyIcon} />
                            <p>Nenhuma medalha encontrada</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
