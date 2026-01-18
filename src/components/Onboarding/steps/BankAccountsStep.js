import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiUpload, FiTrash2, FiBriefcase, FiCreditCard, FiCheck } from 'react-icons/fi';

const formatCurrencyDisplay = (value) => {
    if (!value) return 'R$ 0,00';
    // Simple formatter if not passed from prop, or replicate logic
    const num = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(num) ? 0 : num);
};
import Button from '@/components/ui/Button';
import BankAccountModal from '@/components/modals/BankAccountModal';
import ImportStep from './ImportStep';
import styles from '../OnboardingConfig.module.css';

export default function BankAccountsStep({
    accounts,
    setAccounts,
    onImportSuccess,
    onNext,
    onBack,
    loading,
    title = "Suas Contas Bancárias",
    subtitle = "Centralize suas contas. Adicione quantas quiser.",
    onSetDefault // Optional: function(id or index)
}) {
    const [viewMode, setViewMode] = useState('list'); // 'list', 'import'
    const [showManualModal, setShowManualModal] = useState(false);

    // Manual Creation Handler
    const handleSaveManual = (accountData) => {
        setAccounts(prev => {
            // If first account, make it default if not specified
            const isFirst = prev.length === 0;
            return [...prev, { ...accountData, isDefault: accountData.isDefault || isFirst }];
        });
        setShowManualModal(false);
    };

    // Import Handler
    const handleImportFinish = (result) => {
        // result = { bankAccount, detectedSubscriptions, success }
        if (result.success) {
            setAccounts(prev => {
                const isFirst = prev.length === 0;
                return [...prev, { ...result.bankAccount, isDefault: isFirst }];
            });
            if (result.detectedSubscriptions?.length > 0) {
                onImportSuccess && onImportSuccess(result.detectedSubscriptions);
            }
        }
        setViewMode('list');
    };

    const handleRemoveAccount = (index) => {
        setAccounts(prev => {
            const updated = prev.filter((_, i) => i !== index);
            // If removed default, make first default
            if (prev[index]?.isDefault && updated.length > 0) {
                updated[0].isDefault = true;
            }
            return updated;
        });
    };

    return (
        <div style={{ width: '100%' }}>
            <AnimatePresence mode="wait">
                {viewMode === 'list' ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <div className={styles.iconWrapper}>
                            <FiBriefcase />
                        </div>
                        <h2>{title}</h2>
                        <p className={styles.description}>
                            {subtitle}
                        </p>

                        {/* Accounts List */}
                        {accounts.length > 0 ? (
                            <div className={styles.itemsList}>
                                {accounts.map((acc, idx) => (
                                    <div key={idx} className={styles.listItem}>
                                        <div
                                            className={styles.cardColor}
                                            style={{ background: acc.color || '#333' }}
                                        />
                                        <div className={styles.itemInfo}>
                                            <strong>{acc.nickname || acc.name}</strong>
                                            <span>
                                                {acc.bankName} • {formatCurrencyDisplay(acc.balance?.toString())}
                                                {acc.isDefault && ' (Padrão)'}
                                            </span>
                                        </div>
                                        {/* Tag for Investment */}
                                        {acc.type === 'INVESTMENT' && (
                                            <span style={{
                                                fontSize: '0.7rem',
                                                background: 'rgba(14, 165, 233, 0.2)',
                                                color: '#0ea5e9',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                marginLeft: '8px'
                                            }}>Inv</span>
                                        )}
                                        <div className={styles.itemActions}>
                                            {onSetDefault && !acc.isDefault && (
                                                <button
                                                    onClick={() => onSetDefault(idx)}
                                                    title="Definir como padrão"
                                                    style={{ marginRight: '8px', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', border: 'none', borderRadius: '4px', padding: '6px', cursor: 'pointer' }}
                                                >
                                                    <FiCheck />
                                                </button>
                                            )}
                                            <button onClick={() => handleRemoveAccount(idx)} className={styles.danger}>
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                padding: '2rem',
                                border: '2px dashed #333',
                                borderRadius: '12px',
                                marginBottom: '2rem',
                                color: '#666',
                                textAlign: 'center'
                            }}>
                                Nenhuma conta adicionada
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <Button
                                variant="secondary"
                                icon={FiPlus}
                                onClick={() => setShowManualModal(true)}
                            >
                                Manual
                            </Button>
                            <Button
                                variant="primary"
                                icon={FiUpload}
                                onClick={() => setViewMode('import')}
                            >
                                Importar (OFX)
                            </Button>
                        </div>

                        {/* Navigation */}
                        <div className={styles.navigation}>
                            <button className={styles.backBtn} onClick={onBack}>
                                Voltar
                            </button>
                            <Button onClick={onNext} disabled={loading}>
                                Continuar
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="import"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {/* Reusing ImportStep logic but wrapping it */}
                        <ImportStep
                            onNext={() => { }} // Not used here, handled by internal confirm
                            onSkip={() => setViewMode('list')} // "Cancel" button
                            onConfirmHelper={handleImportFinish} // Custom callback for successful import
                            isSubComponent={true} // Prop to adjust styling/buttons
                        />

                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}
                            >
                                Cancelar e voltar para lista
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Manual Modal */}
            <BankAccountModal
                isOpen={showManualModal}
                onClose={() => setShowManualModal(false)}
                onSave={handleSaveManual}
                editingAccount={null}
            />
        </div>
    );
}
