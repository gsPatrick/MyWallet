'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiSend, FiUser, FiClock, FiCheck, FiCheckCircle, FiLoader } from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Dock from '@/components/layout/Dock';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { messagesAPI } from '@/services/api';
import styles from './page.module.css';

export default function MessagesPage() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        loadMessages();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        setIsLoading(true);
        try {
            const data = await messagesAPI.list();
            setMessages(data.reverse());
        } catch (error) {
            console.error("Erro ao carregar mensagens:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const tempId = Date.now();
        const text = newMessage;
        setNewMessage('');

        const optimisticMessage = {
            id: tempId,
            text: text,
            sender: 'USER',
            createdAt: new Date().toISOString(),
            isRead: false,
            pending: true
        };
        setMessages(prev => [...prev, optimisticMessage]);

        try {
            const createdMessage = await messagesAPI.create({
                text: text,
                title: 'Nova mensagem',
                type: 'SUPPORT'
            });
            setMessages(prev => prev.map(msg => msg.id === tempId ? createdMessage : msg));
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            alert("Erro ao enviar mensagem.");
        }
    };

    const handleMarkAsRead = async (id, isRead) => {
        if (isRead) return;
        try {
            await messagesAPI.markAsRead(id);
            setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, isRead: true } : msg));
        } catch (error) {
            console.error("Erro ao marcar como lida:", error);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={styles.pageWrapper}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    <Card className={styles.chatCard}>
                        <div className={styles.chatHeader}>
                            <FiMessageSquare />
                            <h2>Mensagens</h2>
                        </div>

                        <div className={styles.messagesContainer}>
                            {isLoading ? (
                                <div className={styles.loading}>
                                    <FiLoader className={styles.spinner} />
                                    <span>Carregando mensagens...</span>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <FiMessageSquare />
                                    <p>Nenhuma mensagem ainda</p>
                                    <span>Envie uma mensagem para começar</span>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            className={`${styles.message} ${msg.sender === 'USER' ? styles.userMessage : styles.botMessage}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => handleMarkAsRead(msg.id, msg.isRead)}
                                        >
                                            <div className={styles.messageBubble}>
                                                <p>{msg.text}</p>
                                                <div className={styles.messageFooter}>
                                                    <span className={styles.messageTime}>
                                                        <FiClock /> {formatTime(msg.createdAt)}
                                                    </span>
                                                    {msg.sender === 'USER' && (
                                                        <span className={styles.messageStatus}>
                                                            {msg.pending ? <FiLoader className={styles.spinnerSmall} /> :
                                                                msg.isRead ? <FiCheckCircle /> : <FiCheck />}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className={styles.composer} onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                placeholder="Digite sua mensagem..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className={styles.messageInput}
                            />
                            <button
                                type="submit"
                                className={styles.sendBtn}
                                disabled={!newMessage.trim()}
                            >
                                <FiSend />
                            </button>
                        </form>
                    </Card>
                </div>
            </main>

            <Dock />
        </div>
    );
}
