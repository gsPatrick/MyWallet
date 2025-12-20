'use client';

import { FiClock } from 'react-icons/fi';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function FutureFeatureModal({ isOpen, onClose, title = "Em Breve" }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '24px 0'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    color: '#6366f1'
                }}>
                    <FiClock size={32} />
                </div>

                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: 'var(--text-primary)'
                }}>
                    Funcionalidade em Desenvolvimento
                </h3>

                <p style={{
                    color: 'var(--text-secondary)',
                    marginBottom: '24px',
                    lineHeight: '1.5'
                }}>
                    Função a ser implementada no futuro
                </p>

                <Button onClick={onClose} fullWidth>
                    Entendi
                </Button>
            </div>
        </Modal>
    );
}
