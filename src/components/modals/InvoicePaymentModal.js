'use client';

/**
 * InvoicePaymentModal
 * ========================================
 * Modal for paying card invoices with options:
 * - Full payment
 * - Partial payment (custom amount)
 * - Minimum payment (15%)
 * - Advance payment
 */

import { useState, useEffect } from 'react';
import styles from './InvoicePaymentModal.module.css';
import { payInvoice, getStatusInfo, formatInvoicePeriod } from '@/services/invoiceService';

const InvoicePaymentModal = ({ invoice, onClose, onPaymentComplete }) => {
    const [paymentType, setPaymentType] = useState('FULL');
    const [customAmount, setCustomAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!invoice) return null;

    const totalAmount = parseFloat(invoice.totalAmount) || 0;
    const paidAmount = parseFloat(invoice.paidAmount) || 0;
    const remainingAmount = totalAmount - paidAmount;
    const minimumAmount = parseFloat(invoice.minimumPayment) || remainingAmount * 0.15;
    const statusInfo = getStatusInfo(invoice.status);

    // Calculate payment amount based on type
    const getPaymentAmount = () => {
        switch (paymentType) {
            case 'FULL':
                return remainingAmount;
            case 'MINIMUM':
                return Math.min(minimumAmount, remainingAmount);
            case 'PARTIAL':
            case 'ADVANCE':
                return parseFloat(customAmount.replace(',', '.')) || 0;
            default:
                return remainingAmount;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const amount = getPaymentAmount();

        if (amount <= 0) {
            setError('Valor do pagamento deve ser maior que zero');
            setLoading(false);
            return;
        }

        if (amount > remainingAmount) {
            setError('Valor do pagamento não pode ser maior que o restante');
            setLoading(false);
            return;
        }

        try {
            const result = await payInvoice(invoice.id, {
                amount,
                paymentType,
                paymentMethod,
                notes: notes.trim() || undefined
            });

            if (onPaymentComplete) {
                onPaymentComplete(result);
            }
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao registrar pagamento');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const paymentMethods = [
        { value: 'PIX', label: 'PIX', icon: '📱' },
        { value: 'BOLETO', label: 'Boleto', icon: '📄' },
        { value: 'DEBITO', label: 'Débito', icon: '💳' },
        { value: 'TRANSFERENCIA', label: 'Transferência', icon: '🏦' },
        { value: 'DINHEIRO', label: 'Dinheiro', icon: '💵' },
        { value: 'OUTRO', label: 'Outro', icon: '📋' }
    ];

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerInfo}>
                        <h2>Pagar Fatura</h2>
                        <span className={styles.period}>
                            {formatInvoicePeriod(invoice.referenceMonth, invoice.referenceYear)}
                        </span>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className={styles.invoiceSummary}>
                    <div className={styles.cardInfo}>
                        <span className={styles.cardIcon}>💳</span>
                        <span className={styles.cardName}>
                            {invoice.card?.name || invoice.card?.bankName || 'Cartão'}
                        </span>
                        <span
                            className={styles.status}
                            style={{ backgroundColor: statusInfo.color }}
                        >
                            {statusInfo.emoji} {statusInfo.label}
                        </span>
                    </div>

                    <div className={styles.amounts}>
                        <div className={styles.amountRow}>
                            <span>Total da Fatura</span>
                            <span className={styles.amountValue}>{formatCurrency(totalAmount)}</span>
                        </div>
                        {paidAmount > 0 && (
                            <div className={styles.amountRow}>
                                <span>Já Pago</span>
                                <span className={styles.amountValuePaid}>- {formatCurrency(paidAmount)}</span>
                            </div>
                        )}
                        <div className={`${styles.amountRow} ${styles.amountRowTotal}`}>
                            <span>Restante</span>
                            <span className={styles.amountValueRemaining}>{formatCurrency(remainingAmount)}</span>
                        </div>
                    </div>

                    {invoice.dueDate && (
                        <div className={styles.dueDate}>
                            📅 Vencimento: <strong>{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</strong>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.section}>
                        <label className={styles.sectionLabel}>Tipo de Pagamento</label>
                        <div className={styles.paymentTypeGrid}>
                            <button
                                type="button"
                                className={`${styles.paymentTypeButton} ${paymentType === 'FULL' ? styles.active : ''}`}
                                onClick={() => setPaymentType('FULL')}
                            >
                                <span className={styles.paymentTypeIcon}>💯</span>
                                <span className={styles.paymentTypeLabel}>Total</span>
                                <span className={styles.paymentTypeAmount}>{formatCurrency(remainingAmount)}</span>
                            </button>

                            <button
                                type="button"
                                className={`${styles.paymentTypeButton} ${paymentType === 'MINIMUM' ? styles.active : ''}`}
                                onClick={() => setPaymentType('MINIMUM')}
                            >
                                <span className={styles.paymentTypeIcon}>📉</span>
                                <span className={styles.paymentTypeLabel}>Mínimo</span>
                                <span className={styles.paymentTypeAmount}>{formatCurrency(Math.min(minimumAmount, remainingAmount))}</span>
                            </button>

                            <button
                                type="button"
                                className={`${styles.paymentTypeButton} ${paymentType === 'PARTIAL' ? styles.active : ''}`}
                                onClick={() => setPaymentType('PARTIAL')}
                            >
                                <span className={styles.paymentTypeIcon}>✏️</span>
                                <span className={styles.paymentTypeLabel}>Parcial</span>
                                <span className={styles.paymentTypeAmount}>Valor customizado</span>
                            </button>

                            {invoice.status === 'OPEN' && (
                                <button
                                    type="button"
                                    className={`${styles.paymentTypeButton} ${paymentType === 'ADVANCE' ? styles.active : ''}`}
                                    onClick={() => setPaymentType('ADVANCE')}
                                >
                                    <span className={styles.paymentTypeIcon}>⏩</span>
                                    <span className={styles.paymentTypeLabel}>Antecipar</span>
                                    <span className={styles.paymentTypeAmount}>Valor customizado</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {(paymentType === 'PARTIAL' || paymentType === 'ADVANCE') && (
                        <div className={styles.section}>
                            <label className={styles.sectionLabel}>Valor do Pagamento</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.currencyPrefix}>R$</span>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="0,00"
                                    value={customAmount}
                                    onChange={(e) => {
                                        // Allow only numbers and comma/dot
                                        const value = e.target.value.replace(/[^0-9.,]/g, '');
                                        setCustomAmount(value);
                                    }}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    <div className={styles.section}>
                        <label className={styles.sectionLabel}>Método de Pagamento</label>
                        <div className={styles.paymentMethodGrid}>
                            {paymentMethods.map((method) => (
                                <button
                                    key={method.value}
                                    type="button"
                                    className={`${styles.methodButton} ${paymentMethod === method.value ? styles.active : ''}`}
                                    onClick={() => setPaymentMethod(method.value)}
                                >
                                    <span>{method.icon}</span>
                                    <span>{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <label className={styles.sectionLabel}>Observações (opcional)</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Ex: Pago via app Nubank"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {error && (
                        <div className={styles.error}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div className={styles.footer}>
                        <div className={styles.paymentSummary}>
                            <span>Valor a pagar:</span>
                            <span className={styles.paymentTotal}>
                                {formatCurrency(getPaymentAmount())}
                            </span>
                        </div>

                        <div className={styles.actions}>
                            <button
                                type="button"
                                className={styles.cancelButton}
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={loading || getPaymentAmount() <= 0}
                            >
                                {loading ? 'Processando...' : 'Confirmar Pagamento'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvoicePaymentModal;
