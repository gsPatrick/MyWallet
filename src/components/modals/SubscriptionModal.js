'use client';

import { useState, useEffect, useMemo } from 'react';
import { FiTag, FiDollarSign, FiCalendar, FiImage, FiSearch, FiX, FiCreditCard, FiPlus } from 'react-icons/fi';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import CategoryModal from '@/components/modals/CategoryModal';
import categoriesService from '@/services/categoriesService';
import subscriptionData from '@/data/subscriptionIcons.json';
import { detectBrand } from '@/utils/brandDetection';
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
    manuallySelected: false, // Flag to track if user manually selected icon from gallery
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

    // Dynamic Categories
    const [userCategories, setUserCategories] = useState([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // Get subscriptions from JSON
    const subscriptionsLibrary = useMemo(() => {
        return Object.entries(subscriptionData.subscriptions || {}).map(([key, value]) => ({
            key,
            ...value,
        }));
    }, []);



    // Load user categories
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await categoriesService.list();
                setUserCategories(res.data || []);
            } catch (error) {
                console.error("Error loading categories:", error);
            }
        };
        loadCategories();
    }, []);

    // 🎯 Real-time Brand Detection - Detects brand as user types
    useEffect(() => {
        if (!form.name || form.name.length < 3) return;

        // Only auto-detect if user didn't manually select from gallery
        if (!form.manuallySelected) {
            const detected = detectBrand(form.name);
            if (detected && detected.icon) {
                // Find in subscriptions library for additional data
                const subData = subscriptionsLibrary.find(s => s.key === detected.brandKey);
                setForm(prev => ({
                    ...prev,
                    icon: detected.icon,
                    color: subData?.color || detected.color || prev.color,
                    category: subData?.category || prev.category,
                    amount: subData?.defaultAmount?.toString() || prev.amount,
                }));
            }
        }
    }, [form.name, form.manuallySelected, subscriptionsLibrary]);

    const defaultCategories = subscriptionData.categories || [];

    // Combine for display in main modal (not gallery filter)
    const allCategoriesOptions = [
        { label: 'Padrão', options: defaultCategories },
        { label: 'Minhas Categorias', options: userCategories }
    ];

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
            manuallySelected: true, // Prevent auto-detection from overriding
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
        console.log('🔵 [SUBSCRIPTION MODAL] handleSave called');
        console.log('🔵 [SUBSCRIPTION MODAL] form state:', form);
        console.log('🔵 [SUBSCRIPTION MODAL] form.cardId:', form.cardId, '| Type:', typeof form.cardId);
        console.log('🔵 [SUBSCRIPTION MODAL] cards prop received:', cards);

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

        console.log('🔵 [SUBSCRIPTION MODAL] Final payload to send:', payload);
        onSave?.(payload, editingSub?.id);
    };

    const handleCategoryCreated = (newCat) => {
        if (newCat) {
            setUserCategories(prev => [...prev, newCat]);
            setForm(prev => ({ ...prev, category: newCat.id || newCat.name })); // Use ID if available, else name
        }
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className={styles.inputLabel}>Categoria</label>
                            <button
                                type="button"
                                className={styles.addCategoryBtn}
                                onClick={() => setShowCategoryModal(true)}
                                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}
                            >
                                <FiPlus style={{ marginRight: 2 }} /> Criar
                            </button>
                        </div>
                        <select
                            className={styles.selectInput}
                            value={form.category}
                            onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                        >
                            <optgroup label="Padrão">
                                {defaultCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </optgroup>
                            {userCategories.length > 0 && (
                                <optgroup label="Minhas Categorias">
                                    {userCategories.map(cat => (
                                        <option key={cat.id} value={cat.id || cat.name}>{cat.name}</option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                    </div>

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
                            <Button
                                size="sm"
                                variant={form.nextBillingDate === new Date().toISOString().split('T')[0] ? 'primary' : 'outline'}
                                onClick={handleStartToday}
                            >
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

            {/* Category Creation Modal */}
            <CategoryModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                onSuccess={handleCategoryCreated}
                type="EXPENSE"
            />

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
                        {defaultCategories.map(cat => (
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
