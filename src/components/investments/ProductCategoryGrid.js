'use client';

import { motion } from 'framer-motion';
import {
    FiTrendingUp, FiHome, FiBarChart2, FiBriefcase,
    FiDollarSign, FiGlobe, FiShield, FiBox
} from 'react-icons/fi';
import styles from './ProductCategoryGrid.module.css';

const PRODUCT_CATEGORIES = [
    { id: 'STOCK', name: 'Ações', icon: FiTrendingUp, description: 'Renda variável B3', color: '#3b82f6' },
    { id: 'FII', name: 'FIIs', icon: FiHome, description: 'Fundos imobiliários', color: '#10b981' },
    { id: 'ETF', name: 'ETFs', icon: FiBarChart2, description: 'Fundos de índice', color: '#f59e0b' },
    { id: 'BDR', name: 'BDRs', icon: FiGlobe, description: 'Ativos internacionais', color: '#ec4899' },
    { id: 'RENDA_FIXA', name: 'Renda Fixa', icon: FiShield, description: 'CDB, LCI, LCA', color: '#8b5cf6' },
    { id: 'CRYPTO', name: 'Crypto', icon: FiDollarSign, description: 'Criptomoedas', color: '#facc15' },
];

export default function ProductCategoryGrid({ onEnterCategory }) {
    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Explorar Produtos</h3>
            <div className={styles.grid}>
                {PRODUCT_CATEGORIES.map((cat, index) => {
                    const Icon = cat.icon;

                    return (
                        <motion.button
                            key={cat.id}
                            className={styles.card}
                            onClick={() => onEnterCategory(cat.id)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ '--category-color': cat.color }}
                        >
                            <div className={styles.iconWrapper} style={{ background: `${cat.color}20` }}>
                                <Icon style={{ color: cat.color }} />
                            </div>
                            <div className={styles.cardContent}>
                                <span className={styles.cardName}>{cat.name}</span>
                                <span className={styles.cardDesc}>{cat.description}</span>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
