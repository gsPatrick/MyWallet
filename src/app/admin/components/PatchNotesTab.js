'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiList } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { patchNotesService } from '@/services/patchNotes.service';
import styles from '../page.module.css'; // Reuse admin styles

export default function PatchNotesTab() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [formData, setFormData] = useState({
        version: '',
        title: '',
        description: '',
        bannerUrl: '',
        releaseDate: new Date().toISOString().split('T')[0],
        updates: []
    });

    // Updates management in form
    const [newUpdate, setNewUpdate] = useState({ type: 'new', content: '' });

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        setLoading(true);
        try {
            const data = await patchNotesService.listPatchNotes(1, 100); // Load all/many
            setNotes(data.data || []);
        } catch (error) {
            console.error('Error loading patch notes:', error);
            alert('Erro ao carregar notas de atualização');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (editingNote) {
                await patchNotesService.updatePatchNote(editingNote.id, formData);
                alert('Atualizado com sucesso!');
            } else {
                await patchNotesService.createPatchNote(formData);
                alert('Criado com sucesso!');
            }
            setShowModal(false);
            resetForm();
            loadNotes();
        } catch (error) {
            console.error('Error saving:', error);
            alert('Erro ao salvar. Verifique se a versão já existe.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta nota?')) return;
        try {
            await patchNotesService.deletePatchNote(id);
            loadNotes();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Erro ao excluir');
        }
    };

    const resetForm = () => {
        setEditingNote(null);
        setFormData({
            version: '',
            title: '',
            description: '',
            bannerUrl: '',
            releaseDate: new Date().toISOString().split('T')[0],
            updates: []
        });
        setNewUpdate({ type: 'new', content: '' });
    };

    const openEdit = (note) => {
        setEditingNote(note);
        setFormData({
            ...note,
            releaseDate: new Date(note.releaseDate).toISOString().split('T')[0]
        });
        setShowModal(true);
    };

    // Helper to add update item to list
    const addUpdateItem = () => {
        if (!newUpdate.content) return;
        setFormData(prev => ({
            ...prev,
            updates: [...prev.updates, newUpdate]
        }));
        setNewUpdate({ type: 'new', content: '' });
    };

    const removeUpdateItem = (index) => {
        setFormData(prev => ({
            ...prev,
            updates: prev.updates.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className={styles.usersSection}> {/* Reusing container style */}
            <div className={styles.usersHeader}>
                <h2>Gestão de Patch Notes</h2>
                <Button onClick={() => { resetForm(); setShowModal(true); }}>
                    <FiPlus /> Nova Nota
                </Button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.usersTable}>
                    <thead>
                        <tr>
                            <th>Versão</th>
                            <th>Título</th>
                            <th>Data</th>
                            <th>Items</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className={styles.loadingCell}>Carregando...</td></tr>
                        ) : notes.map(note => (
                            <tr key={note.id}>
                                <td><span className={styles.planBadge}>{note.version}</span></td>
                                <td>{note.title}</td>
                                <td>{new Date(note.releaseDate).toLocaleDateString('pt-BR')}</td>
                                <td>{note.updates?.length || 0}</td>
                                <td>
                                    <div className={styles.actions}>
                                        <button className={styles.grantBtn} onClick={() => openEdit(note)} title="Editar">
                                            <FiEdit2 />
                                        </button>
                                        <button className={styles.revokeBtn} onClick={() => handleDelete(note.id)} title="Excluir">
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit/Create Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingNote ? "Editar Nota" : "Nova Nota de Atualização"}
                size="lg"
            >
                <div className={styles.modalContent} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Versão (ex: 1.01)</label>
                            <input
                                value={formData.version}
                                onChange={e => setFormData({ ...formData, version: e.target.value })}
                                placeholder="1.0.0"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Data</label>
                            <input
                                type="date"
                                value={formData.releaseDate}
                                onChange={e => setFormData({ ...formData, releaseDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Título</label>
                        <input
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Título da atualização"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Descrição</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Banner URL (Opcional)</label>
                        <input
                            value={formData.bannerUrl}
                            onChange={e => setFormData({ ...formData, bannerUrl: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Itens da Atualização</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <select
                                value={newUpdate.type}
                                onChange={e => setNewUpdate({ ...newUpdate, type: e.target.value })}
                                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                            >
                                <option value="new">Novo</option>
                                <option value="fix">Correção</option>
                                <option value="change">Mudança</option>
                            </select>
                            <input
                                value={newUpdate.content}
                                onChange={e => setNewUpdate({ ...newUpdate, content: e.target.value })}
                                placeholder="Descreva o item..."
                                style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                onKeyDown={e => e.key === 'Enter' && addUpdateItem()}
                            />
                            <Button size="sm" onClick={addUpdateItem}><FiPlus /></Button>
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {formData.updates.map((item, idx) => (
                                <li key={idx} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.5rem',
                                    background: '#f8fafc',
                                    marginBottom: '0.25rem',
                                    borderRadius: '4px'
                                }}>
                                    <span>
                                        <strong style={{
                                            marginRight: '8px',
                                            color: item.type === 'new' ? '#10b981' : item.type === 'fix' ? '#ef4444' : '#3b82f6'
                                        }}>
                                            [{item.type.toUpperCase()}]
                                        </strong>
                                        {item.content}
                                    </span>
                                    <button
                                        onClick={() => removeUpdateItem(idx)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                    >
                                        <FiTrash2 />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={styles.modalActions}>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button onClick={handleSave}>Salvar Nota</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
