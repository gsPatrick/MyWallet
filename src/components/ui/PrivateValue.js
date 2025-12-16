'use client';

import { usePrivacy } from '@/contexts/PrivacyContext';

// Component to display currency with privacy masking
export function PrivateCurrency({ value, showSign = false, className = '' }) {
    const { hideData } = usePrivacy();

    if (hideData) {
        return <span className={className}>••••••</span>;
    }

    const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Math.abs(value || 0));

    let displayValue = formatted;
    if (showSign && value !== 0) {
        displayValue = value >= 0 ? `+${formatted}` : `-${formatted}`;
    } else {
        displayValue = value < 0 ? `-${formatted}` : formatted;
    }

    return <span className={className}>{displayValue}</span>;
}

// Component to display percentage with privacy masking
export function PrivatePercent({ value, decimals = 2, showSign = false, className = '' }) {
    const { hideData } = usePrivacy();

    if (hideData) {
        return <span className={className}>••••%</span>;
    }

    const formatted = `${Math.abs(value || 0).toFixed(decimals)}%`;
    let displayValue = formatted;
    if (showSign && value !== 0) {
        displayValue = value >= 0 ? `+${formatted}` : `-${formatted}`;
    } else {
        displayValue = value < 0 ? `-${formatted}` : formatted;
    }

    return <span className={className}>{displayValue}</span>;
}

// Component to display any private value with masking
export function PrivateValue({ children, mask = '••••••', className = '' }) {
    const { hideData } = usePrivacy();

    if (hideData) {
        return <span className={className}>{mask}</span>;
    }

    return <span className={className}>{children}</span>;
}

// Hook to get formatted currency with privacy
export function usePrivateCurrency() {
    const { hideData } = usePrivacy();

    const formatCurrency = (value, showSign = false) => {
        if (hideData) return '••••••';

        const formatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(Math.abs(value || 0));

        if (showSign && value !== 0) {
            return value >= 0 ? `+${formatted}` : `-${formatted}`;
        }
        return value < 0 ? `-${formatted}` : formatted;
    };

    const formatPercent = (value, decimals = 2, showSign = false) => {
        if (hideData) return '••••%';

        const formatted = `${Math.abs(value || 0).toFixed(decimals)}%`;
        if (showSign && value !== 0) {
            return value >= 0 ? `+${formatted}` : `-${formatted}`;
        }
        return value < 0 ? `-${formatted}` : formatted;
    };

    return { formatCurrency, formatPercent, hideData };
}
