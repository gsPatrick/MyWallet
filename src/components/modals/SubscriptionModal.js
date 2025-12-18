'use client';

import { useState, useEffect, useMemo } from 'react';
import { FiTag, FiDollarSign, FiCalendar, FiImage, FiSearch, FiX, FiCreditCard } from 'react-icons/fi';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import subscriptionData from '@/data/subscriptionIcons.json';
import styles from './SubscriptionModal.module.css';

const defaultForm = {
    name: '',
    amount: '',
    category: 'OTHER',
    frequency: 'MONTHLY',
    nextBillingDate: '',
    icon: '',
    color: '#6366F1',
    cardId: '',
};

export default function SubscriptionModal({
    isOpen,
    onClose,
    onSave,
    editingSub = null,
    isLoading = false,
    cards = [] // Array of available cards for linking
}) {
    const [form, setForm] = useState(defaultForm);
    const [showIconGallery, setShowIconGallery] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');

    // Get subscriptions from JSON
    const subscriptionsLibrary = useMemo(() => {
        return Object.entries(subscriptionData.subscriptions || {}).map(([key, value]) => ({
            key,
            ...value,
        }));
    }, []);

    const categories = subscriptionData.categories || [];

    // Filter subscriptions by search and category
    const filteredSubscriptions = useMemo(() => {
        return subscriptionsLibrary.filter(sub => {
            const matchesSearch = sub.name.toLowerCase().includes(iconSearch.toLowerCase());
            const matchesCategory = selectedCategory === 'ALL' || sub.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [subscriptionsLibrary, iconSearch, selectedCategory]);

    useEffect(() => {
        if (editingSub) {
            setForm({
                name: editingSub.name || '',
                amount: editingSub.amount?.toString() || '',
                category: editingSub.category || 'OTHER',
                frequency: editingSub.frequency || 'MONTHLY',
                nextBillingDate: editingSub.nextBillingDate || '',
                icon: editingSub.icon || '',
                color: editingSub.color || '#6366F1',
                cardId: editingSub.cardId || '',
            });
        } else {
            setForm(defaultForm);
        }
    }, [editingSub, isOpen]);

    const handleSelectFromLibrary = (sub) => {
        setForm(prev => ({
            ...prev,
            name: sub.name,
            icon: sub.icon,
            color: sub.color,
            category: sub.category,
            amount: sub.defaultAmount?.toString() || prev.amount,
        }));
        setShowIconGallery(false);
    };

    const handleSetBillingDay = (day) => {
        if (!day || day < 1 || day > 31) return;
        const today = new Date();
        const currentDay = today.getDate();
        let nextDate = new Date(today.getFullYear(), today.getMonth(), day);

        if (day < currentDay) {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }

        setForm(prev => ({
            ...prev,
            nextBillingDate: nextDate.toISOString().split('T')[0]
        }));
    };

    const handleStartToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setForm(prev => ({ ...prev, nextBillingDate: today }));
    };

    const handleSave = () => {
        const payload = {
            name: form.name,
            amount: parseFloat(form.amount) || 0,
            category: form.category,
            frequency: form.frequency,
            startDate: form.nextBillingDate, // Backend expects startDate
            icon: form.icon,
            color: form.color,
            cardId: form.cardId || null,
        };
        onSave?.(payload, editingSub?.id);
    };

    return (
        <>
            <Modal
                isOpen={isOpen && !showIconGallery}
                onClose={onClose}
                title={editingSub ? 'Editar Assinatura' : 'Nova Assinatura'}
                size="sm"
            >
                <div className={styles.modalForm}>
                    {/* Icon Preview & Select */}
                    <div className={styles.iconSection}>
                        <div
                            className={styles.iconPreview}
                            style={{ borderColor: form.color }}
                            onClick={() => setShowIconGallery(true)}
                        >
                            {form.icon ? (
                                <img src={form.icon} alt={form.name} className={styles.iconImage} />
                            ) : (
                                <FiImage className={styles.iconPlaceholder} />
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowIconGallery(true)}
                        >
                            Escolher Ícone
                        </Button>
                    </div>

                    <Input
                        label="Nome"
                        placeholder="Ex: Netflix"
                        leftIcon={<FiTag />}
                        value={form.name}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                        fullWidth
                    />

                    <Input
                        label="Valor"
                        placeholder="29.90"
                        leftIcon={<FiDollarSign />}
                        type="number"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                        fullWidth
                    />

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Categoria</label>
                        <select
                            className={styles.selectInput}
                            value={form.category}
                            onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {cards.length > 0 && (
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>
                                <FiCreditCard style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                Vincular ao Cartão (opcional)
                            </label>
                            <select
                                className={styles.selectInput}
                                value={form.cardId}
                                onChange={(e) => setForm(prev => ({ ...prev, cardId: e.target.value }))}
                            >
                                <option value="">Sem cartão vinculado</option>
                                {cards.map(card => (
                                    <option key={card.id} value={card.id}>
                                        {card.name} •••• {card.lastFourDigits}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Frequência</label>
                        <select
                            className={styles.selectInput}
                            value={form.frequency}
                            onChange={(e) => setForm(prev => ({ ...prev, frequency: e.target.value }))}
                        >
                            <option value="WEEKLY">Semanal</option>
                            <option value="MONTHLY">Mensal</option>
                            <option value="QUARTERLY">Trimestral</option>
                            <option value="SEMI_ANNUAL">Semestral</option>
                            <option value="YEARLY">Anual</option>
                        </select>
                    </div>

                    <div className={styles.formRow}>
                        <Input
                            label="Dia de Cobrança"
                            type="number"
                            placeholder="Dia (1-31)"
                            min="1"
                            max="31"
                            onChange={(e) => handleSetBillingDay(parseInt(e.target.value))}
                        />
                        <div className={styles.buttonAligned}>
                            <Button size="sm" variant="outline" onClick={handleStartToday}>
                                Começar Hoje
                            </Button>
                        </div>
                    </div>

                    <Input
                        label="Próxima Cobrança"
                        type="date"
                        leftIcon={<FiCalendar />}
                        value={form.nextBillingDate}
                        onChange={(e) => setForm(prev => ({ ...prev, nextBillingDate: e.target.value }))}
                        fullWidth
                    />

                    <div className={styles.modalActions}>
                        <Button variant="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading || !form.name}>
                            {isLoading ? 'Salvando...' : editingSub ? 'Salvar' : 'Criar'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Icon Gallery Modal */}
            <Modal
                isOpen={showIconGallery}
                onClose={() => setShowIconGallery(false)}
                title="Escolher Assinatura"
                size="lg"
            >
                <div className={styles.galleryContent}>
                    {/* Search */}
                    <div className={styles.gallerySearch}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar assinatura..."
                            value={iconSearch}
                            onChange={(e) => setIconSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                        {iconSearch && (
                            <button
                                className={styles.clearSearch}
                                onClick={() => setIconSearch('')}
                            >
                                <FiX />
                            </button>
                        )}
                    </div>

                    {/* Category Filter */}
                    <div className={styles.categoryTabs}>
                        <button
                            className={`${styles.categoryTab} ${selectedCategory === 'ALL' ? styles.active : ''}`}
                            onClick={() => setSelectedCategory('ALL')}
                        >
                            Todos
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`${styles.categoryTab} ${selectedCategory === cat.id ? styles.active : ''}`}
                                onClick={() => setSelectedCategory(cat.id)}
                                style={{ '--cat-color': cat.color }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Subscriptions Grid */}
                    <div className={styles.subscriptionsGrid}>
                        {filteredSubscriptions.map(sub => (
                            <button
                                key={sub.key}
                                className={styles.subscriptionCard}
                                onClick={() => handleSelectFromLibrary(sub)}
                                style={{ '--sub-color': sub.color }}
                            >
                                <div className={styles.subIconWrapper}>
                                    {sub.icon ? (
                                        <img src={sub.icon} alt={sub.name} className={styles.subIcon} />
                                    ) : (
                                        <div
                                            className={styles.subIconFallback}
                                            style={{ background: sub.color }}
                                        >
                                            {sub.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <span className={styles.subName}>{sub.name}</span>
                                <span className={styles.subPrice}>
                                    R$ {sub.defaultAmount?.toFixed(2) || '0,00'}
                                </span>
                            </button>
                        ))}

                        {filteredSubscriptions.length === 0 && (
                            <div className={styles.noResults}>
                                <p>Nenhuma assinatura encontrada</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowIconGallery(false)}
                                >
                                    Criar manualmente
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className={styles.galleryActions}>
                        <Button variant="secondary" onClick={() => setShowIconGallery(false)}>
                            Cancelar
                        </Button>
                        <Button variant="outline" onClick={() => setShowIconGallery(false)}>
                            Criar sem ícone
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
