'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationContext = createContext({
    notifications: [],
    addNotification: () => { },
    removeNotification: () => { },
});

let notificationId = 0;

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
        const id = ++notificationId;

        setNotifications(prev => [...prev, { id, type, title, message }]);

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
            <NotificationContainer notifications={notifications} onRemove={removeNotification} />
        </NotificationContext.Provider>
    );
}

function NotificationContainer({ notifications, onRemove }) {
    return (
        <div style={{
            position: 'fixed',
            top: 'calc(var(--header-height) + var(--spacing-md))',
            right: 'var(--spacing-md)',
            zIndex: 'var(--z-toast)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-sm)',
            pointerEvents: 'none',
        }}>
            <AnimatePresence>
                {notifications.map(notification => (
                    <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 20 }}
                        style={{
                            background: 'var(--bg-glass-strong)',
                            backdropFilter: 'var(--backdrop-blur)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--spacing-md)',
                            minWidth: '300px',
                            maxWidth: '400px',
                            boxShadow: 'var(--shadow-lg)',
                            pointerEvents: 'auto',
                            cursor: 'pointer',
                            borderLeft: `4px solid ${getTypeColor(notification.type)}`,
                        }}
                        onClick={() => onRemove(notification.id)}
                    >
                        {notification.title && (
                            <div style={{
                                fontWeight: 600,
                                marginBottom: 'var(--spacing-xs)',
                                color: 'var(--text-primary)',
                            }}>
                                {notification.title}
                            </div>
                        )}
                        <div style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                        }}>
                            {notification.message}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

function getTypeColor(type) {
    switch (type) {
        case 'success': return 'var(--accent-success)';
        case 'warning': return 'var(--accent-warning)';
        case 'error': return 'var(--accent-danger)';
        default: return 'var(--accent-info)';
    }
}

export const useNotification = () => useContext(NotificationContext);
