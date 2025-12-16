import { FiPlus } from 'react-icons/fi';
import styles from '../../app/investments/page.module.css';

export function GhostPositionRow({ onClick }) {
    return (
        <div
            className={`${styles.positionRow} ${styles.ghostRow}`}
            onClick={onClick}
            style={{ cursor: 'pointer', border: '1px dashed var(--border-light)', background: 'transparent', justifyContent: 'center', gap: '8px' }}
        >
            <FiPlus style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Adicionar Ativo Manualmente</span>
        </div>
    );
}

export function GhostMarketCard({ onClick }) {
    return (
        <div
            className={`${styles.marketCard} ${styles.ghostCard}`}
            onClick={onClick}
            style={{ cursor: 'pointer', border: '2px dashed var(--border-light)', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', minHeight: '160px' }}
        >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiPlus style={{ fontSize: '1.5rem', color: 'var(--text-tertiary)' }} />
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Novo Ativo</span>
        </div>
    );
}

export function GhostOperationItem({ onClick }) {
    return (
        <div
            className={`${styles.operationItem} ${styles.ghostRow}`}
            onClick={onClick}
            style={{ cursor: 'pointer', border: '1px dashed var(--border-light)', background: 'transparent', justifyContent: 'center', gap: '8px' }}
        >
            <FiPlus style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Registrar Nova Operação</span>
        </div>
    );
}
