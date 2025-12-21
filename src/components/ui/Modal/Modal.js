'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertCircle, FiCheckCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import styles from './Modal.module.css';

const iconMap = {
    info: FiInfo,
    success: FiCheckCircle,
    warning: FiAlertTriangle,
    error: FiAlertCircle,
};

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    type = 'default', // default, alert, confirm
    variant = 'info', // info, success, warning, error
    size = 'md', // sm, md, lg, xl, full
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    actions,
}) {
    const handleEscape = useCallback((e) => {
        if (e.key === 'Escape' && closeOnEscape) {
            onClose();
        }
    }, [onClose, closeOnEscape]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleEscape]);

    const Icon = iconMap[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={styles.modalWrapper}>
                    {/* Backdrop */}
                    <motion.div
                        className={styles.backdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeOnBackdrop ? onClose : undefined}
                    />

                    {/* Modal */}
                    <motion.div
                        className={`${styles.modal} ${styles[size]}`}
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className={styles.header}>
                                <div className={styles.titleWrapper}>
                                    {type === 'alert' && Icon && (
                                        <div className={`${styles.iconWrapper} ${styles[variant]}`}>
                                            <Icon />
                                        </div>
                                    )}
                                    {title && <h2 id="modal-title" className={styles.title}>{title}</h2>}
                                </div>
                                {showCloseButton && (
                                    <motion.button
                                        className={styles.closeBtn}
                                        onClick={onClose}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        aria-label="Fechar"
                                    >
                                        <FiX />
                                    </motion.button>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className={styles.content}>
                            {children}
                        </div>

                        {/* Actions */}
                        {actions && (
                            <div className={styles.actions}>
                                {actions}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// Prebuilt Modal Types
export function AlertModal({ isOpen, onClose, title, message, variant = 'info', confirmText = 'OK' }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            type="alert"
            variant={variant}
            size="sm"
            actions={
                <button className={styles.primaryBtn} onClick={onClose}>
                    {confirmText}
                </button>
            }
        >
            <p className={styles.message}>{message}</p>
        </Modal>
    );
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'warning',
    loading = false,
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            type="alert"
            variant={variant}
            size="sm"
            closeOnBackdrop={!loading}
            closeOnEscape={!loading}
            actions={
                <>
                    <button className={styles.secondaryBtn} onClick={onClose} disabled={loading}>
                        {cancelText}
                    </button>
                    <button className={styles.primaryBtn} onClick={onConfirm} disabled={loading}>
                        {loading ? 'Aguarde...' : confirmText}
                    </button>
                </>
            }
        >
            <p className={styles.message}>{message}</p>
        </Modal>
    );
}
