'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LandingHeader, LandingFooter } from '@/components/landing';
import { patchNotesService } from '@/services/patchNotes.service';
import { BiArrowBack } from 'react-icons/bi';
import styles from './page.module.css';

export default function PatchNoteDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNote = async () => {
            if (!id) return;
            try {
                const data = await patchNotesService.getPatchNoteById(id);
                setNote(data);
            } catch (error) {
                console.error('Failed to fetch patch note:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNote();
    }, [id]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <LandingHeader />
                <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: '#888' }}>Carregando...</p>
                </div>
                <LandingFooter />
            </div>
        );
    }

    if (!note) {
        return (
            <div className={styles.page}>
                <LandingHeader />
                <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: '#888' }}>Nota de atualização não encontrada.</p>
                </div>
                <LandingFooter />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <LandingHeader />

            <div className={styles.header}>
                <div className={styles.headerBackground}>
                    {note.bannerUrl ? (
                        <img src={note.bannerUrl} alt={note.title} className={styles.headerImage} />
                    ) : (
                        <div className={styles.headerImage} style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e)' }} />
                    )}
                </div>
                <div className={styles.headerOverlay}></div>

                <div className={styles.headerContent}>
                    <motion.button
                        onClick={() => router.push('/patch-notes')}
                        className={styles.backButton}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <BiArrowBack /> Voltar para lista
                    </motion.button>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className={styles.versionBadge}>Versão {note.version}</span>
                        <h1 className={styles.title}>{note.title}</h1>
                        <span className={styles.date}>{formatDate(note.releaseDate)}</span>
                    </motion.div>
                </div>
            </div>

            <main className={styles.content}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    <motion.button
                        onClick={() => router.push('/patch-notes')}
                        className={styles.backButton}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <BiArrowBack /> Voltar para lista
                    </motion.button>

                    <p className={styles.description}>
                        {note.description}
                    </p>

                    <div className={styles.updatesContainer}>
                        <h3 className={styles.sectionTitle}>Mudanças nesta versão</h3>
                        <ul className={styles.updateList}>
                            {note.updates && note.updates.map((update, idx) => (
                                <li key={idx} className={`${styles.updateItem} ${styles[`type${update.type.charAt(0).toUpperCase() + update.type.slice(1)}`] || ''}`}>
                                    <span className={styles.dot}></span>
                                    <span className={styles.updateContent}>
                                        {update.type === 'new' && <strong style={{ color: '#00ff88', marginRight: '8px' }}>[NOVO]</strong>}
                                        {update.type === 'fix' && <strong style={{ color: '#ff4d4d', marginRight: '8px' }}>[CORREÇÃO]</strong>}
                                        {update.type === 'change' && <strong style={{ color: '#3b82f6', marginRight: '8px' }}>[MUDANÇA]</strong>}
                                        {update.content}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            </main>

            <LandingFooter />
        </div>
    );
}
