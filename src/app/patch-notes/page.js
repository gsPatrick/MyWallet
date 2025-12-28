'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LandingHeader, LandingFooter } from '@/components/landing';
import { patchNotesService } from '@/services/patchNotes.service';
import styles from './page.module.css';

export default function PatchNotesPage() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const response = await patchNotesService.listPatchNotes();
                setNotes(response.data || []);
            } catch (error) {
                console.error('Failed to fetch patch notes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className={styles.page}>
            <LandingHeader />

            <header className={styles.header}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className={styles.headerTitle}>Notas de Atualização</h1>
                    <p className={styles.headerSubtitle}>
                        Acompanhe a evolução do sistema. Transparência total sobre melhorias, correções e novas funcionalidades.
                    </p>
                </motion.div>
            </header>

            <main className={styles.content}>
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#888', padding: '4rem' }}>
                        Carregando atualizações...
                    </div>
                ) : notes.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', padding: '4rem' }}>
                        Nenhuma nota de atualização encontrada.
                    </div>
                ) : (
                    notes.map((note, index) => (
                        <Link href={`/patch-notes/${note.id}`} key={note.id || index} style={{ textDecoration: 'none' }}>
                            <motion.article
                                className={`${styles.patchCard} ${styles.clickable}`}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className={styles.patchHeader}>
                                    {note.bannerUrl ? (
                                        <img
                                            src={note.bannerUrl}
                                            alt={`Banner versão ${note.version}`}
                                            className={styles.patchImage}
                                        />
                                    ) : (
                                        <div className={styles.patchImage} style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e)' }} />
                                    )}
                                    <div className={styles.patchOverlay}>
                                        <div className={styles.versionBadge}>Versão {note.version}</div>
                                        <h2 className={styles.patchTitle}>{note.title}</h2>
                                        <span className={styles.patchDate}>{formatDate(note.releaseDate)}</span>
                                    </div>
                                </div>

                                <div className={styles.patchBody}>
                                    <div className={styles.updateSection}>
                                        <p className={styles.description}>
                                            {note.description}
                                        </p>
                                        <div className={styles.readMore}>Ler notas completas &rarr;</div>
                                    </div>
                                </div>
                            </motion.article>
                        </Link>
                    ))
                )}
            </main>

            <LandingFooter />
        </div>
    );
}
