'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { patchNotesService } from '@/services/patchNotes.service';
import styles from './CommunityUpdates.module.css';

export default function CommunityUpdates() {
    const [updates, setUpdates] = useState([]);

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                // Fetch only top 3 for landing page
                const response = await patchNotesService.listPatchNotes(1, 3);
                setUpdates(response.data || []);
            } catch (error) {
                console.error('Failed to fetch community updates:', error);
            }
        };

        fetchUpdates();
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (updates.length === 0) return null;

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <motion.h2
                        className={styles.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        Atualizações da Comunidade
                    </motion.h2>
                    <motion.p
                        className={styles.subtitle}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        Fique por dentro das últimas melhorias e novidades que estamos trazendo para o InvestPro.
                    </motion.p>
                </div>

                <div className={styles.cardGrid}>
                    {updates.map((update, index) => (
                        <Link href="/patch-notes" key={update.id || index} style={{ textDecoration: 'none' }}>
                            <motion.article
                                className={styles.card}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                            >
                                <div className={styles.cardImageWrapper}>
                                    {update.bannerUrl ? (
                                        <img src={update.bannerUrl} alt={update.title} className={styles.cardImage} />
                                    ) : (
                                        <div className={styles.cardImage} style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e)' }} />
                                    )}
                                </div>
                                <div className={styles.cardBody}>
                                    <span className={styles.versionTag}>v{update.version}</span>
                                    <h3 className={styles.cardTitle}>{update.title}</h3>
                                    <span className={styles.cardDate}>{formatDate(update.releaseDate)}</span>
                                    <p className={styles.cardDescription}>{update.description}</p>
                                </div>
                            </motion.article>
                        </Link>
                    ))}
                </div>

                <div className={styles.viewAllContainer}>
                    <Link href="/patch-notes" className={styles.viewAllBtn}>
                        Ver Todas as Atualizações
                    </Link>
                </div>
            </div>
        </section>
    );
}
