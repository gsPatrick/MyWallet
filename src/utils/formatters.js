// Format currency in BRL
export function formatCurrency(value, showSign = false) {
    const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Math.abs(value));

    if (showSign && value !== 0) {
        return value >= 0 ? `+${formatted}` : `-${formatted}`;
    }
    return value < 0 ? `-${formatted}` : formatted;
}

// Format percentage
export function formatPercent(value, decimals = 2, showSign = false) {
    const formatted = `${Math.abs(value).toFixed(decimals)}%`;
    if (showSign && value !== 0) {
        return value >= 0 ? `+${formatted}` : `-${formatted}`;
    }
    return value < 0 ? `-${formatted}` : formatted;
}

// Format number with thousands separator
export function formatNumber(value, decimals = 0) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

// Format date
export function formatDate(date, format = 'short') {
    const d = new Date(date);

    if (format === 'short') {
        return d.toLocaleDateString('pt-BR');
    }
    if (format === 'long') {
        return d.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
    if (format === 'relative') {
        const now = new Date();
        const diffDays = Math.floor((d - now) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Amanhã';
        if (diffDays === -1) return 'Ontem';
        if (diffDays > 0 && diffDays <= 7) return `Em ${diffDays} dias`;
        if (diffDays < 0 && diffDays >= -7) return `Há ${Math.abs(diffDays)} dias`;
        return d.toLocaleDateString('pt-BR');
    }
    return d.toLocaleDateString('pt-BR');
}

// Truncate text
export function truncate(text, length = 50) {
    if (!text || text.length <= length) return text;
    return text.slice(0, length) + '...';
}

// Get initials from name
export function getInitials(name) {
    if (!name) return '??';
    return name
        .split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

// Get color for asset type
export function getAssetTypeColor(type) {
    const colors = {
        STOCK: '#6366f1',
        FII: '#10b981',
        ETF: '#f59e0b',
        BDR: '#ec4899',
        RENDA_FIXA: '#3b82f6',
        CRYPTO: '#8b5cf6',
        OTHER: '#6b7280',
    };
    return colors[type] || colors.OTHER;
}

// Get color for transaction type
export function getTransactionTypeColor(type) {
    const colors = {
        INCOME: '#10b981',
        EXPENSE: '#ef4444',
        TRANSFER: '#6366f1',
        CREDIT: '#10b981',
        DEBIT: '#ef4444',
    };
    return colors[type] || '#6b7280';
}

// Get status color
export function getStatusColor(status) {
    const colors = {
        ACTIVE: '#10b981',
        COMPLETED: '#6366f1',
        ON_TRACK: '#10b981',
        OVER_BUDGET: '#ef4444',
        PENDING: '#f59e0b',
        CANCELLED: '#6b7280',
    };
    return colors[status] || '#6b7280';
}
