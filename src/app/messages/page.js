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
            // Ordenar por data (do backend já vem ordenado desc, mas para chat queremos asc para visualização de stack)
            // Se o backend retorna DESC (mais novo primeiro), precisamos inverter para mostrar no chat (mais antigo em cima)
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

        const tempId = Date.now(); // Optimistic update ID
        const text = newMessage;
        setNewMessage('');

        /* Optimistic Update */
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
                title: 'Nova mensagem', // Título genérico
                type: 'SUPPORT' // Tipo padrão
            });

            // Substitui a mensagem otimista pela real
            setMessages(prev => prev.map(msg => msg.id === tempId ? createdMessage : msg));

        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            // Reverter em caso de erro (removendo a mensagem otimista)
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
                    <motion.div
                                <div
                        key={msg.id}
                        className={`${styles.message} ${msg.sender === 'user' ? styles.userMessage : styles.botMessage}`}
                    >
                        <div className={styles.messageBubble}>
                            <p>{msg.text}</p>
                            <span className={styles.messageTime}>{msg.time}</span>
                        </div>
                    </div>
                            ))}
                </div>

                {/* Composer */}
                <div className={styles.composer}>
                    <button className={styles.attachBtn}><FiPaperclip /></button>
                    <input
                        type="text"
                        placeholder="Digite sua mensagem..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        className={styles.messageInput}
                    />
                    <button className={styles.emojiBtn}><FiSmile /></button>
                    <button
                        className={styles.sendBtn}
                        onClick={handleSend}
                        disabled={!message.trim()}
                    >
                        <FiSend />
                    </button>
                </div>
            </motion.div>
        </div>
            </main >

        <Dock />
        </div >
    );
}
