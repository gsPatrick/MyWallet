'use client';

/**
 * BrokerModal
 * Modal for adding/editing investment brokers
 */

import { useState, useEffect } from 'react';
import { FiX, FiTrendingUp, FiCheck } from 'react-icons/fi';
import BROKERS_LIST from '@/data/brokers.json';
import styles from './BrokerModal.module.css';

export default function BrokerModal({ isOpen, onClose, onSave, broker = null }) {
    const [selectedBroker, setSelectedBroker] = useState(null);
    const [customName, setCustomName] = useState('');
    const [investmentFocus, setInvestmentFocus] = useState('');

    useEffect(() => {
        if (broker) {
            // Editing existing
            const found = BROKERS_LIST.find(b => b.code === broker.code);
            setSelectedBroker(found || null);
            setCustomName(broker.customName || broker.name || '');
            setInvestmentFocus(broker.investmentFocus || '');
        } else {
            // Adding new
            setSelectedBroker(null);
            setCustomName('');
            setInvestmentFocus('');
        }
    }, [broker, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedBroker) return;

        onSave({
            code: selectedBroker.code,
            name: selectedBroker.name,
            customName: customName || selectedBroker.name,
            logoUrl: selectedBroker.logoUrl,
            color: selectedBroker.color,
            investmentFocus: investmentFocus,
            type: selectedBroker.type
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>{broker ? 'Editar Corretora' : 'Adicionar Corretora'}</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Broker Selection Grid */}
                    <div className={styles.field}>
                        <label>Selecione a corretora</label>
                        <div className={styles.brokersGrid}>
                            {BROKERS_LIST.map(b => (
                                <button
                                    key={b.code}
                                    type="button"
                                    className={`${styles.brokerCard} ${selectedBroker?.code === b.code ? styles.selected : ''}`}
                                    onClick={() => {
                                        setSelectedBroker(b);
                                        if (!customName) setCustomName(b.name);
                                    }}
                                >
                                    {b.logoUrl ? (
                                        <img src={b.logoUrl} alt={b.name} className={styles.brokerLogo} />
                                    ) : (
                                        <FiTrendingUp className={styles.brokerIcon} style={{ color: b.color }} />
                                    )}
                                    <span>{b.name}</span>
                                    {selectedBroker?.code === b.code && (
                                        <FiCheck className={styles.checkIcon} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Name (optional) */}
                    {selectedBroker && (
                        <>
                            <div className={styles.field}>
                                <label>Apelido (opcional)</label>
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={e => setCustomName(e.target.value)}
                                    placeholder={selectedBroker.name}
                                />
                            </div>

                            <div className={styles.field}>
                                <label>Foco de investimento (opcional)</label>
                                <input
                                    type="text"
                                    value={investmentFocus}
                                    onChange={e => setInvestmentFocus(e.target.value)}
                                    placeholder="Ex: Ações, FIIs, Renda Fixa..."
                                />
                            </div>
                        </>
                    )}

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={styles.saveBtn}
                            disabled={!selectedBroker}
                        >
                            {broker ? 'Salvar' : 'Adicionar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
