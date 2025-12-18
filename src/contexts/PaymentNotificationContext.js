'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiDollarSign, FiAlertCircle, FiCheck } from 'react-icons/fi';
import api from '@/services/api';
import { useAuth } from './AuthContext';
import styles from './PaymentNotification.module.css';

const PaymentNotificationContext = createContext({});

function NotificationPopup({ notification, onDismiss, onMarkRead }) {
    const isIncome = notification.type?.includes('INCOME');

    return (
        <motion.div
            className={`${styles.popup} ${isIncome ? styles.income : styles.expense}`}
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
        >
            <div className={styles.iconWrapper}>
                {isIncome ? <FiDollarSign /> : <FiAlertCircle />}
            </div>
            <div className={styles.content}>
                <h4 className={styles.title}>{notification.title}</h4>
                <p className={styles.message}>{notification.message}</p>
            </div>
            <div className={styles.actions}>
                <button
                    className={styles.markReadBtn}
                    onClick={() => onMarkRead(notification.id)}
                    title="Marcar como lido"
                >
                    <FiCheck />
                </button>
                <button
                    className={styles.dismissBtn}
                    onClick={() => onDismiss(notification.id)}
                    title="Dispensar"
                >
                    <FiX />
                </button>
            </div>
        </motion.div>
    );
}

export function PaymentNotificationProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [currentNotification, setCurrentNotification] = useState(null);

    // Check for pending notifications on app load
    useEffect(() => {
        if (isAuthenticated) {
            checkNotifications();
        }
    }, [isAuthenticated]);

    // Show next notification when current is dismissed
    useEffect(() => {
        if (!currentNotification && notifications.length > 0) {
            const [next, ...rest] = notifications;
            setCurrentNotification(next);
            setNotifications(rest);

            // Mark as displayed
            markDisplayed(next.id);
        }
    }, [currentNotification, notifications]);

    const checkNotifications = async () => {
        try {
            // First check and create any pending notifications
            await api.post('/notifications/check');

            // Then get pending notifications to display
            const response = await api.get('/notifications/pending');
            if (response.data?.length > 0) {
                setNotifications(response.data);
            }
        } catch (error) {
            console.warn('Could not check notifications:', error);
        }
    };

    const markDisplayed = async (id) => {
        try {
            await api.put(`/notifications/${id}/displayed`);
        } catch (error) {
            console.warn('Could not mark notification displayed:', error);
        }
    };

    const handleDismiss = async (id) => {
        try {
            await api.put(`/notifications/${id}/displayed`);
        } catch (error) {
            console.warn('Could not dismiss notification:', error);
        }
        setCurrentNotification(null);
    };

    const handleMarkRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
        } catch (error) {
            console.warn('Could not mark notification read:', error);
        }
        setCurrentNotification(null);
    };

    const triggerNotificationCheck = useCallback(async () => {
        await checkNotifications();
    }, []);

    return (
        <PaymentNotificationContext.Provider value={{
            triggerNotificationCheck,
            hasNotifications: notifications.length > 0 || currentNotification !== null
        }}>
            {children}

            {/* Notification Popups Container */}
            <div className={styles.container}>
                <AnimatePresence>
                    {currentNotification && (
                        <NotificationPopup
                            key={currentNotification.id}
                            notification={currentNotification}
                            onDismiss={handleDismiss}
                            onMarkRead={handleMarkRead}
                        />
                    )}
                </AnimatePresence>
            </div>
        </PaymentNotificationContext.Provider>
    );
}

export const usePaymentNotifications = () => useContext(PaymentNotificationContext);
