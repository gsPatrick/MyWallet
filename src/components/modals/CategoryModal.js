'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { budgetsAPI } from '@/services/api';
import categoriesService from '@/services/categoriesService';
import { FiFolder } from 'react-icons/fi';
import styles from './CategoryModal.module.css';

export default function CategoryModal({ isOpen, onClose, onSuccess, type = 'EXPENSE' }) {
    const [name, setName] = useState('');
    const [budgetAllocationId, setBudgetAllocationId] = useState('');
    const [allocations, setAllocations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadAllocations();
            setName('');
            setBudgetAllocationId('');
        }
    }, [isOpen]);

    const loadAllocations = async () => {
        try {
            const res = await budgetsAPI.getCurrentAllocations();
            setAllocations(res.data?.allocations || []);
        } catch (error) {
            console.error("Error loading allocations:", error);
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            const res = await categoriesService.create({
                name: name.trim(),
                type,
                icon: 'FiFolder',
                color: '#6366f1',
                budgetAllocationId: budgetAllocationId || null
            });

            // Check if response has data property correctly
            const newCat = res.data || res;

            if (onSuccess) {
                onSuccess(newCat);
            }
            onClose();
        } catch (error) {
            alert("Erro ao criar categoria: " + (error.response?.data?.error || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Nova Categoria"
            size="sm"
        >
            <div className={styles.form}>
                <Input
                    label="Nome da Categoria"
                    placeholder="Ex: Entretenimento"
                    leftIcon={<FiFolder />}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    autoFocus
                />

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Vincular ao Orçamento (Opcional)</label>
                    {allocations.length > 0 ? (
                        <>
                            <select
                                className={styles.select}
                                value={budgetAllocationId}
                                onChange={(e) => setBudgetAllocationId(e.target.value)}
                            >
                                <option value="">Nenhum (Gasto Livre)</option>
                                {allocations.map(alloc => (
                                    <option key={alloc.id} value={alloc.id}>
                                        {alloc.name} ({alloc.percentage}%)
                                    </option>
                                ))}
                            </select>
                            <span className={styles.helperText}>
                                Despesas nesta categoria serão computadas no orçamento selecionado.
                            </span>
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <span className={styles.helperText}>
                                Nenhum orçamento ativo encontrado. Crie orçamentos para vincular categorias.
                            </span>
                        </div>
                    )}
                </div>

                <div className={styles.actions}>
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                    <Button onClick={handleCreate} disabled={!name.trim() || isLoading}>
                        {isLoading ? 'Criando...' : 'Criar Categoria'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
