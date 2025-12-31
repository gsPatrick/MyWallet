import React from 'react';
import { FiDollarSign, FiCreditCard, FiClock, FiRepeat, FiCheck, FiShoppingBag, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { BsCheckAll, BsBank2 } from 'react-icons/bs';
import { detectBrand } from '@/utils/brandDetection';
import styles from './RichBubble.module.css';

/**
 * RichBubble Component
 * Renders rich visual cards for different types:
 * - EXPENSE/INCOME: Transaction cards
 * - CARD: Credit card invoice
 * - SUBSCRIPTION: Recurring expense
 * - BALANCE/BANKS_LIST: Account balances summary
 * - CARDS_LIST: Credit cards summary
 */
export default function RichBubble({ data, status = 'read', timestamp, theme = 'whatsapp' }) {
    const { type, description, amount, category, cardName, dueDate, nextCharge, confirmationText } = data;

    const brand = detectBrand(description);

    const formatCurrency = (value) => {
        const absValue = Math.abs(value || 0);
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(absValue);
    };

    const getThemeClass = () => {
        switch (theme) {
            case 'light': return styles.themeLight;
            case 'dark': return styles.themeDark;
            default: return styles.themeWhatsapp;
        }
    };

    const getTypeClass = () => {
        switch (type) {
            case 'EXPENSE': return styles.expense;
            case 'INCOME': return styles.income;
            case 'CARD': return styles.card;
            case 'SUBSCRIPTION': return styles.subscription;
            case 'BALANCE':
            case 'BANKS_LIST': return styles.balance;
            case 'CARDS_LIST': return styles.cardsList;
            default: return styles.expense;
        }
    };

    const StatusIcon = () => {
        if (status === 'pending') return <FiClock size={12} />;
        if (status === 'sent') return <FiCheck size={12} />;
        if (status === 'read') return <BsCheckAll size={12} style={{ color: '#34B7F1' }} />;
        return null;
    };

    const formatTime = (ts) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // ========================================
    // BALANCE / BANKS_LIST - Account Summary
    // ========================================
    if (type === 'BALANCE' || type === 'BANKS_LIST') {
        const { banks, totalBalance } = data;
        const isPositive = (totalBalance || 0) >= 0;

        return (
            <div className={`${styles.richBubble} ${styles.summaryCard} ${getThemeClass()} ${status === 'pending' ? styles.pending : ''}`}>
                <div className={styles.summaryHeader}>
                    <BsBank2 size={20} />
                    <span>Saldo das Contas</span>
                </div>
                <div className={styles.summaryTotal}>
                    <span className={styles.summaryLabel}>Total</span>
                    <span className={`${styles.summaryValue} ${isPositive ? styles.positive : styles.negative}`}>
                        {formatCurrency(totalBalance)}
                    </span>
                </div>
                {banks && banks.length > 0 && (
                    <div className={styles.summaryList}>
                        {banks.map((bank, idx) => (
                            <div key={idx} className={styles.summaryItem}>
                                <div className={styles.itemIcon}>
                                    {bank.icon ? (
                                        <img src={bank.icon} alt={bank.name || bank.bankName} className={styles.bankIcon} />
                                    ) : (
                                        <BsBank2 size={14} />
                                    )}
                                </div>
                                <span className={styles.itemName}>{bank.name || bank.bankName}</span>
                                <span className={`${styles.itemValue} ${(bank.balance || 0) >= 0 ? styles.positive : styles.negative}`}>
                                    {formatCurrency(bank.balance)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                <div className={styles.meta}>
                    <span>{formatTime(timestamp)}</span>
                    <StatusIcon />
                </div>
            </div>
        );
    }

    // ========================================
    // CARDS_LIST - Credit Cards Summary
    // ========================================
    if (type === 'CARDS_LIST') {
        const { cards, totalLimit, totalAvailable } = data;

        return (
            <div className={`${styles.richBubble} ${styles.summaryCard} ${styles.cardsTheme} ${getThemeClass()} ${status === 'pending' ? styles.pending : ''}`}>
                <div className={styles.summaryHeader}>
                    <FiCreditCard size={20} />
                    <span>Meus Cartões</span>
                </div>
                {cards && cards.length > 0 && (
                    <div className={styles.summaryList}>
                        {cards.map((card, idx) => {
                            const limit = card.limit || 0;
                            const used = card.used || 0;
                            const available = limit - used;
                            const usagePercent = limit > 0 ? Math.round((used / limit) * 100) : 0;

                            let indicator = '🟢';
                            if (usagePercent > 80) indicator = '🔴';
                            else if (usagePercent > 50) indicator = '🟡';

                            const detectedBrand = detectBrand(card.name || card.bankName || card.brand);
                            const iconUrl = card.bankIcon || detectedBrand?.icon;
                            const brandUrl = card.brandIcon;
                            const cardColor = card.color || '#1E40AF';

                            // Check for lightness to set text color
                            const isLight = (hex) => {
                                const r = parseInt(hex.slice(1, 3), 16);
                                const g = parseInt(hex.slice(3, 5), 16);
                                const b = parseInt(hex.slice(5, 7), 16);
                                return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
                            };
                            const textColor = isLight(cardColor) ? '#1a1a2e' : 'white';

                            return (
                                <div key={idx} className={styles.cardItemWrapper}>
                                    {/* Mini Card Visual */}
                                    <div
                                        className={styles.miniCard}
                                        style={{
                                            background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 100%)`,
                                            color: textColor
                                        }}
                                    >
                                        <div className={styles.miniCardHeader}>
                                            <div className={styles.mnBankLogo}>
                                                {iconUrl ? (
                                                    <img src={iconUrl} alt="Bank" />
                                                ) : (
                                                    <span className={styles.mnBankName}>{card.bankName || card.name}</span>
                                                )}
                                            </div>
                                            <FiCreditCard size={14} style={{ opacity: 0.7 }} />
                                        </div>
                                        <div className={styles.mnCardNumber}>
                                            •••• {card.lastFour}
                                        </div>
                                        <div className={styles.mnCardFooter}>
                                            <span className={styles.mnCardName}>{card.name}</span>
                                            <div className={styles.mnBrandLogo}>
                                                {brandUrl ? (
                                                    <img src={brandUrl} alt={card.brand} />
                                                ) : (
                                                    <span style={{ fontSize: '10px', fontWeight: 800 }}>{card.brand}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Usage Stats Below */}
                                    <div className={styles.cardItemDetails}>
                                        <div className={styles.cardProgress}>
                                            <div
                                                className={styles.cardProgressBar}
                                                style={{
                                                    width: `${Math.min(usagePercent, 100)}%`,
                                                    backgroundColor: usagePercent > 80 ? '#ef4444' : usagePercent > 50 ? '#f59e0b' : '#10b981'
                                                }}
                                            />
                                        </div>
                                        <div className={styles.cardItemStats}>
                                            <span>Usado: {formatCurrency(used)}</span>
                                            <span>Disponível: {formatCurrency(available)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div className={styles.meta}>
                    <span>{formatTime(timestamp)}</span>
                    <StatusIcon />
                </div>
            </div>
        );
    }

    // ========================================
    // CARD - Credit Card Invoice
    // ========================================
    if (type === 'CARD') {
        return (
            <div className={`${styles.richBubble} ${styles.card} ${getThemeClass()} ${status === 'pending' ? styles.pending : ''}`}>
                <div className={styles.cardDetails}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardName}>
                            <FiCreditCard style={{ marginRight: 6 }} />
                            {cardName || 'Cartão'}
                        </span>
                        <div className={styles.cardChip} />
                    </div>
                    <div className={styles.cardInfo}>
                        <div>
                            <span className={styles.cardLabel}>Fatura</span>
                            <div className={styles.cardValue}>{formatCurrency(amount)}</div>
                        </div>
                        <div>
                            <span className={styles.cardLabel}>Vencimento</span>
                            <div className={styles.dueDate}>{dueDate || '--/--'}</div>
                        </div>
                    </div>
                </div>
                <div className={styles.meta}>
                    <span>{formatTime(timestamp)}</span>
                    <StatusIcon />
                </div>
            </div>
        );
    }

    // ========================================
    // MENU - Command List
    // ========================================
    if (type === 'MENU') {
        return (
            <div className={`${styles.richBubble} ${styles.menuCard} ${getThemeClass()} ${status === 'pending' ? styles.pending : ''}`}>
                <div className={styles.summaryHeader}>
                    <BsBank2 size={20} />
                    <span>Menu MyWallet AI</span>
                </div>
                <div className={styles.menuSection}>
                    <h4>📝 Comandos</h4>
                    {(data.commands || []).map((cmd, i) => (
                        <div key={i} className={styles.menuItem}>
                            <strong>{cmd.cmd}</strong>
                            <span>{cmd.desc}</span>
                        </div>
                    ))}
                </div>
                <div className={styles.menuSection}>
                    <h4>💡 Exemplos</h4>
                    {(data.examples || []).map((ex, i) => (
                        <div key={i} className={styles.exampleItem}>"{ex}"</div>
                    ))}
                </div>
                <div className={styles.meta}>
                    <span>{formatTime(timestamp)}</span>
                    <StatusIcon />
                </div>
            </div>
        );
    }

    // ========================================
    // QUERY_RESULT - Financial Report
    // ========================================
    if (type === 'QUERY_RESULT') {
        const { period, totalIncome, totalExpense, balance, transactions } = data;
        const isPositive = balance >= 0;

        const periodLabels = {
            day: 'Hoje',
            week: 'Esta Semana',
            month: 'Este Mês',
            year: 'Este Ano'
        };

        return (
            <div className={`${styles.richBubble} ${styles.reportCard} ${getThemeClass()} ${status === 'pending' ? styles.pending : ''}`}>
                <div className={styles.summaryHeader}>
                    <FiTrendingUp size={20} />
                    <span>Resumo {periodLabels[period] || period}</span>
                </div>
                <div className={styles.reportStats}>
                    <div className={styles.reportRow}>
                        <span>Receitas</span>
                        <span className={styles.positive}>{formatCurrency(totalIncome)}</span>
                    </div>
                    <div className={styles.reportRow}>
                        <span>Despesas</span>
                        <span className={styles.negative}>{formatCurrency(totalExpense)}</span>
                    </div>
                    <div className={`${styles.reportRow} ${styles.totalRow}`}>
                        <span>Saldo</span>
                        <span className={isPositive ? styles.positive : styles.negative}>
                            {formatCurrency(balance)}
                        </span>
                    </div>
                </div>
                {transactions && transactions.length > 0 && (
                    <div className={styles.miniTransList}>
                        {transactions.slice(0, 5).map((t, i) => (
                            <div key={i} className={styles.miniTransItem}>
                                <div className={styles.miniTransIcon}>
                                    {t.type === 'INCOME' ?
                                        <FiTrendingUp className={styles.positive} /> :
                                        <FiTrendingDown className={styles.negative} />
                                    }
                                </div>
                                <div className={styles.miniTransInfo}>
                                    <span className={styles.miniTransDesc}>{t.description}</span>
                                    <span className={styles.miniTransDate}>
                                        {new Date(t.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <span className={t.type === 'INCOME' ? styles.positive : styles.negative}>
                                    {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                <div className={styles.meta}>
                    <span>{formatTime(timestamp)}</span>
                    <StatusIcon />
                </div>
            </div>
        );
    }

    // ========================================
    // INVOICES - List of Invoices
    // ========================================
    if (type === 'INVOICES' || type === 'INVOICE_HISTORY') {
        const list = data.invoices || data.history || [];
        const isHistory = type === 'INVOICE_HISTORY';

        return (
            <div className={`${styles.richBubble} ${styles.invoiceListCard} ${getThemeClass()} ${status === 'pending' ? styles.pending : ''}`}>
                <div className={styles.summaryHeader}>
                    <FiCreditCard size={20} />
                    <span>{isHistory ? 'Histórico de Faturas' : 'Faturas Atuais'}</span>
                </div>
                <div className={styles.invoiceList}>
                    {list.map((item, i) => {
                        // Handle both flattened invoices structure and history structure
                        const invoices = item.invoices || [item];
                        const cardName = item.cardName;

                        return (
                            <div key={i} className={styles.invoiceGroup}>
                                {cardName && <div className={styles.groupHeader}>{cardName}</div>}
                                {invoices.map((inv, j) => {
                                    const total = inv.remaining !== undefined ? inv.total : inv.total;
                                    const statusLabel = inv.status === 'PAID' ? 'Paga' :
                                        inv.status === 'PARTIAL' ? 'Parcial' :
                                            inv.status === 'OVERDUE' ? 'Vencida' : 'Aberta';

                                    const statusColor = inv.status === 'PAID' ? styles.positive :
                                        inv.status === 'OVERDUE' ? styles.negative :
                                            styles.warning;

                                    return (
                                        <div key={j} className={styles.invoiceItem}>
                                            <div className={styles.invoiceInfo}>
                                                <span className={styles.invoiceMonth}>
                                                    {inv.month ? `${inv.month}/${inv.year}` : 'Atual'}
                                                </span>
                                                <span className={`${styles.invoiceStatus} ${statusColor}`}>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                            <div className={styles.invoiceValues}>
                                                <span className={styles.invoiceTotal}>
                                                    {formatCurrency(total)}
                                                </span>
                                                {inv.remaining > 0 && (
                                                    <span className={styles.invoiceRemaining}>
                                                        Restante: {formatCurrency(inv.remaining)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
                <div className={styles.meta}>
                    <span>{formatTime(timestamp)}</span>
                    <StatusIcon />
                </div>
            </div>
        );
    }

    // ========================================
    // INVOICE_PAYMENT - Payment Receipt
    // ========================================
    if (type === 'INVOICE_PAYMENT') {
        return (
            <div className={`${styles.richBubble} ${styles.receiptCard} ${getThemeClass()} ${status === 'pending' ? styles.pending : ''}`}>
                <div className={styles.receiptHeader}>
                    <div className={styles.checkIcon}>
                        <FiCheck size={24} />
                    </div>
                    <span>Pagamento Confirmado</span>
                </div>
                <div className={styles.receiptBody}>
                    <div className={styles.receiptRow}>
                        <span>Cartão</span>
                        <strong>{data.cardName}</strong>
                    </div>
                    <div className={styles.receiptRow}>
                        <span>Valor Pago</span>
                        <strong className={styles.positive}>{formatCurrency(data.amount)}</strong>
                    </div>
                    {data.remaining > 0 ? (
                        <div className={styles.receiptRow}>
                            <span>Restante</span>
                            <strong className={styles.negative}>{formatCurrency(data.remaining)}</strong>
                        </div>
                    ) : (
                        <div className={styles.congratsMessage}>
                            🎉 Fatura quitada!
                        </div>
                    )}
                </div>
                <div className={styles.meta}>
                    <span>{formatTime(timestamp)}</span>
                    <StatusIcon />
                </div>
            </div>
        );
    }

    // ========================================
    // SUBSCRIPTION - Recurring Expense
    // ========================================
    if (type === 'SUBSCRIPTION') {
        return (
            <div className={`${styles.richBubble} ${styles.subscription} ${getThemeClass()} ${status === 'pending' ? styles.pending : ''}`}>
                <div className={styles.cardContent}>
                    <div className={styles.brandIconWrapper} style={brand?.color ? { borderColor: brand.color } : {}}>
                        {brand?.icon ? (
                            <img src={brand.icon} alt={brand.name} className={styles.brandIcon} />
                        ) : (
                            <FiRepeat className={styles.fallbackIcon} />
                        )}
                    </div>
                    <div className={styles.mainContent}>
                        <div className={styles.description}>{brand?.name || description}</div>
                        <div className={styles.nextCharge}>
                            <FiRepeat size={10} className={styles.recurrenceIcon} />
                            Próxima: {nextCharge || 'Mensal'}
                        </div>
                    </div>
                    <div className={styles.valueWrapper}>
                        <div className={`${styles.value} ${styles.valueNegative}`}>
                            - {formatCurrency(amount)}
                        </div>
                    </div>
                </div>
                <div className={styles.meta}>
                    <span>{formatTime(timestamp)}</span>
                    <StatusIcon />
                </div>
            </div>
        );
    }

    // ========================================
    // EXPENSE or INCOME - Transaction Card
    // ========================================
    const isIncome = type === 'INCOME';

    return (
        <div className={`${styles.richBubble} ${getTypeClass()} ${getThemeClass()} ${status === 'pending' ? styles.pending : ''}`}>
            {confirmationText && (
                <div className={styles.confirmationBanner}>
                    {confirmationText}
                </div>
            )}
            <div className={styles.cardContent}>
                <div className={styles.brandIconWrapper} style={brand?.color ? { backgroundColor: `${brand.color}30` } : {}}>
                    {brand?.icon ? (
                        <img src={brand.icon} alt={brand.name} className={styles.brandIcon} />
                    ) : isIncome ? (
                        <FiDollarSign className={styles.fallbackIcon} />
                    ) : (
                        <FiShoppingBag className={styles.fallbackIcon} />
                    )}
                </div>
                <div className={styles.mainContent}>
                    <div className={styles.description}>{brand?.name || description}</div>
                    {(category || brand?.category) && (
                        <div className={styles.category}>{category || brand?.category}</div>
                    )}
                </div>
                <div className={styles.valueWrapper}>
                    <div className={`${styles.value} ${isIncome ? styles.valuePositive : styles.valueNegative}`}>
                        {isIncome ? '+' : '-'} {formatCurrency(amount)}
                    </div>
                </div>
            </div>
            <div className={styles.meta}>
                <span>{formatTime(timestamp)}</span>
                <StatusIcon />
            </div>
        </div>
    );
}

/**
 * Simple text parser to extract transaction data from user message
 */
export const parseMessageToTransaction = (text) => {
    const incomePatterns = [
        /recebi\s+(?:r\$\s*)?(\d+(?:[.,]\d{2})?)/i,
        /ganhei\s+(?:r\$\s*)?(\d+(?:[.,]\d{2})?)/i,
        /entrou\s+(?:r\$\s*)?(\d+(?:[.,]\d{2})?)/i,
        /(?:r\$\s*)?(\d+(?:[.,]\d{2})?)\s+(?:do|de|pelo)\s+(?:freela|freelance|trabalho|salário|salario)/i
    ];

    for (const pattern of incomePatterns) {
        const match = text.match(pattern);
        if (match) {
            const amount = parseFloat(match[1].replace(',', '.'));
            return {
                type: 'INCOME',
                description: extractDescription(text) || 'Receita',
                amount,
                category: 'Receita'
            };
        }
    }

    const expensePatterns = [
        /gastei\s+(?:r\$\s*)?(\d+(?:[.,]\d{2})?)/i,
        /paguei\s+(?:r\$\s*)?(\d+(?:[.,]\d{2})?)/i,
        /comprei\s+.+\s+(?:por\s+)?(?:r\$\s*)?(\d+(?:[.,]\d{2})?)/i,
        /(?:r\$\s*)?(\d+(?:[.,]\d{2})?)\s+(?:no|na|em|de)\s+/i
    ];

    for (const pattern of expensePatterns) {
        const match = text.match(pattern);
        if (match) {
            const amount = parseFloat(match[1].replace(',', '.'));
            return {
                type: 'EXPENSE',
                description: extractDescription(text) || 'Despesa',
                amount,
                category: null
            };
        }
    }

    return null;
};

const extractDescription = (text) => {
    const places = ['uber', 'ifood', 'netflix', 'spotify', 'amazon', 'mercado', 'farmácia', 'gasolina', 'restaurante', 'supermercado', 'freela', 'freelance', 'salário'];

    for (const place of places) {
        if (text.toLowerCase().includes(place)) {
            return place.charAt(0).toUpperCase() + place.slice(1);
        }
    }

    const prepositionMatch = text.match(/(?:no|na|em|de|do|pelo|pela)\s+([a-záéíóúãõç]+)/i);
    if (prepositionMatch) {
        return prepositionMatch[1].charAt(0).toUpperCase() + prepositionMatch[1].slice(1);
    }

    return null;
};
