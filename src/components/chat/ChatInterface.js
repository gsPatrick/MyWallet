import React, { useState, useEffect, useRef } from 'react';
import { FiArrowLeft, FiSend, FiMic, FiClock, FiCheck, FiMoreVertical, FiSun, FiMoon } from 'react-icons/fi';
import { BsCheckAll, BsWhatsapp } from 'react-icons/bs';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { addToQueue } from '@/services/offline/queue';
import { saveChatMessage, getChatHistory, updateChatMessageStatus } from '@/services/offline/db';
import { handleOfflineCommand, cacheUserData } from '@/services/offline/cache';
import RichBubble, { parseMessageToTransaction } from './RichBubble';
import VoiceMessage from './VoiceMessage';
import styles from './ChatInterface.module.css';
import { generateId } from '../../utils/generateId';

// API URL
const API_URL = 'https://geral-mywallet-api.r954jc.easypanel.host';

// Theme options
const THEMES = {
    SYSTEM: 'system',
    WHATSAPP: 'whatsapp',
    LIGHT: 'light',
    DARK: 'dark'
};

export default function ChatInterface({ onClose }) {
    const isOnline = useOfflineStatus();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [theme, setTheme] = useState(THEMES.WHATSAPP);
    const messagesEndRef = useRef(null);
    const menuRef = useRef(null);

    // Load history and theme on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('chat_theme') || THEMES.WHATSAPP;
        setTheme(savedTheme);

        const loadHistory = async () => {
            const history = await getChatHistory();
            if (history && history.length > 0) {
                setMessages(history);
            } else {
                const welcomeMessage = {
                    id: 'init-1',
                    text: 'Olá! Sou seu assistente financeiro MyWallet. 💰\n\nVocê pode me dizer coisas como:\n• "Gastei 50 no Uber"\n• "Recebi 500 do freela"\n• "Paguei 150 de Netflix"\n\nDigite MENU para ver todos comandos! 📊',
                    sender: 'bot',
                    timestamp: Date.now(),
                    status: 'read'
                };
                setMessages([welcomeMessage]);
                await saveChatMessage(welcomeMessage);
            }
        };
        loadHistory();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Change theme
    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('chat_theme', newTheme);
        setShowMenu(false);
    };

    // Get effective theme (resolve SYSTEM to actual theme)
    const getEffectiveTheme = () => {
        if (theme === THEMES.SYSTEM) {
            // Check MyWallet system theme from localStorage or body class
            const mywalletTheme = localStorage.getItem('theme') || 'dark';
            return mywalletTheme === 'dark' ? THEMES.DARK : THEMES.LIGHT;
        }
        return theme;
    };

    // Get theme-specific class
    const getThemeClass = () => {
        const effectiveTheme = getEffectiveTheme();
        switch (effectiveTheme) {
            case THEMES.LIGHT: return styles.themeLight;
            case THEMES.DARK: return styles.themeDark;
            case THEMES.WHATSAPP: return styles.themeWhatsapp;
            default: return styles.themeWhatsapp;
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const text = inputValue.trim();
        setInputValue('');

        const newMessage = {
            id: generateId(),
            text,
            sender: 'user',
            timestamp: Date.now(),
            status: isOnline ? 'sent' : 'pending'
        };

        setMessages(prev => [...prev, newMessage]);
        await saveChatMessage(newMessage);

        if (isOnline) {
            try {
                await processMessageOnline(newMessage);
            } catch (error) {
                console.error("Failed to send online, falling back to queue", error);
                handleOfflineQueue(newMessage);
            }
        } else {
            handleOfflineQueue(newMessage);
        }
    };

    const handleOfflineQueue = async (message) => {
        await updateChatMessageStatus(message.id, 'pending');

        const parsedTransaction = parseMessageToTransaction(message.text);

        if (parsedTransaction) {
            const pendingRichResponse = {
                id: generateId(),
                sender: 'bot',
                timestamp: Date.now(),
                status: 'pending',
                isRich: true,
                richData: parsedTransaction
            };

            setMessages(prev => [...prev, pendingRichResponse]);
            await saveChatMessage(pendingRichResponse);
        }

        await addToQueue({
            url: '/api/whatsapp/process-text',
            method: 'POST',
            body: { text: message.text, messageId: message.id },
            type: 'CHAT'
        });
    };

    const processMessageOnline = async (message) => {
        try {
            const response = await fetch(`${API_URL}/api/whatsapp/process-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('investpro_token')}`
                },
                body: JSON.stringify({ text: message.text })
            });

            const data = await response.json();

            await updateChatMessageStatus(message.id, 'read');
            setMessages(prev => prev.map(m => m.id === message.id ? { ...m, status: 'read' } : m));

            if (data.success && data.response) {
                const resp = data.response;

                if (resp.type === 'TRANSACTIONS' && resp.transactions?.length > 0) {
                    for (const tx of resp.transactions) {
                        const richResponse = {
                            id: generateId(),
                            sender: 'bot',
                            timestamp: Date.now(),
                            status: 'read',
                            isRich: true,
                            richData: {
                                type: tx.type,
                                description: tx.description,
                                amount: tx.amount,
                                category: tx.bankName,
                                confirmationText: `✅ ${tx.type === 'INCOME' ? 'Receita' : 'Despesa'} #${tx.shortId} registrada!`
                            }
                        };
                        setMessages(prev => [...prev, richResponse]);
                        await saveChatMessage(richResponse);
                    }
                } else if (resp.type === 'BALANCE' || resp.type === 'BANKS_LIST') {
                    // Cache banks data for offline use
                    if (resp.banks) {
                        cacheUserData({ banks: resp.banks.map(b => ({ ...b, bankName: b.name, balance: b.balance })) });
                    }

                    // Render as Rich Bubble
                    const richResponse = {
                        id: generateId(),
                        sender: 'bot',
                        timestamp: Date.now(),
                        status: 'read',
                        isRich: true,
                        richData: {
                            type: 'BALANCE',
                            banks: resp.banks,
                            totalBalance: resp.totalBalance
                        }
                    };
                    setMessages(prev => [...prev, richResponse]);
                    await saveChatMessage(richResponse);
                } else if (resp.type === 'CARDS_LIST') {
                    // Cache cards data for offline use
                    if (resp.cards) {
                        cacheUserData({ cards: resp.cards });
                    }

                    // Render as Rich Bubble
                    const richResponse = {
                        id: generateId(),
                        sender: 'bot',
                        timestamp: Date.now(),
                        status: 'read',
                        isRich: true,
                        richData: {
                            type: 'CARDS_LIST',
                            cards: resp.cards,
                            totalLimit: resp.totalLimit,
                            totalAvailable: resp.totalAvailable
                        }
                    };
                    setMessages(prev => [...prev, richResponse]);
                    await saveChatMessage(richResponse);
                } else if (['QUERY_RESULT', 'INVOICE_PAYMENT', 'INVOICE_HISTORY', 'MENU', 'INVOICES'].includes(resp.type)) {
                    // Render as Rich Bubble
                    const richResponse = {
                        id: generateId(),
                        sender: 'bot',
                        timestamp: Date.now(),
                        status: 'read',
                        isRich: true,
                        richData: resp
                    };
                    setMessages(prev => [...prev, richResponse]);
                    await saveChatMessage(richResponse);
                    await saveChatMessage(richResponse);
                } else if (resp.type === 'SYSTEM' || resp.text) {
                    const botResponse = {
                        id: generateId(),
                        text: resp.text,
                        sender: 'bot',
                        timestamp: Date.now(),
                        status: 'read'
                    };
                    setMessages(prev => [...prev, botResponse]);
                    await saveChatMessage(botResponse);
                } else {
                    const botResponse = {
                        id: generateId(),
                        text: `Recebi sua mensagem! Digite MENU para ver opções.`,
                        sender: 'bot',
                        timestamp: Date.now(),
                        status: 'read'
                    };
                    setMessages(prev => [...prev, botResponse]);
                    await saveChatMessage(botResponse);
                }
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('API Error:', error);

            await updateChatMessageStatus(message.id, 'read');
            setMessages(prev => prev.map(m => m.id === message.id ? { ...m, status: 'read' } : m));

            // Try to handle command locally with cached data
            const offlineResponse = handleOfflineCommand(message.text);

            if (offlineResponse) {
                if (offlineResponse.isRich && offlineResponse.richData) {
                    // Render as Rich Bubble
                    const richResponse = {
                        id: generateId(),
                        sender: 'bot',
                        timestamp: Date.now(),
                        status: 'read',
                        isRich: true,
                        richData: offlineResponse.richData
                    };
                    setMessages(prev => [...prev, richResponse]);
                    await saveChatMessage(richResponse);
                } else {
                    // Render as text
                    const botResponse = {
                        id: generateId(),
                        text: offlineResponse.text,
                        sender: 'bot',
                        timestamp: Date.now(),
                        status: 'read'
                    };
                    setMessages(prev => [...prev, botResponse]);
                    await saveChatMessage(botResponse);
                }
            } else {
                // Try local parsing for transactions
                const parsedTransaction = parseMessageToTransaction(message.text);

                if (parsedTransaction) {
                    const richResponse = {
                        id: generateId(),
                        sender: 'bot',
                        timestamp: Date.now(),
                        status: 'read',
                        isRich: true,
                        richData: {
                            ...parsedTransaction,
                            confirmationText: `✅ ${parsedTransaction.type === 'INCOME' ? 'Receita' : 'Despesa'} registrada (offline)!`
                        }
                    };
                    setMessages(prev => [...prev, richResponse]);
                    await saveChatMessage(richResponse);

                    // Add to queue for sync when online
                    await addToQueue({
                        url: '/api/whatsapp/process-text',
                        method: 'POST',
                        body: { text: message.text, messageId: message.id },
                        type: 'CHAT'
                    });
                } else {
                    const botResponse = {
                        id: generateId(),
                        text: `Recebi sua mensagem! 📝\n\nPara registrar uma transação, tente algo como:\n• "Gastei 50 no Uber"\n• "Recebi 200 do cliente"\n\nDigite MENU para ver todos comandos.`,
                        sender: 'bot',
                        timestamp: Date.now(),
                        status: 'read'
                    };
                    setMessages(prev => [...prev, botResponse]);
                    await saveChatMessage(botResponse);
                }
            }
        }
    };

    const StatusIcon = ({ status }) => {
        if (status === 'pending') return <FiClock size={12} />;
        if (status === 'sent') return <FiCheck size={12} />;
        if (status === 'read') return <BsCheckAll size={12} style={{ color: '#34B7F1' }} />;
        return null;
    };

    const renderMessage = (msg) => {
        if (msg.isRich && msg.richData) {
            return (
                <div key={msg.id} className={styles.richBubbleWrapper}>
                    <RichBubble
                        data={msg.richData}
                        status={msg.status}
                        timestamp={msg.timestamp}
                        theme={theme}
                    />
                </div>
            );
        }

        return (
            <div
                key={msg.id}
                className={`${styles.messageBubble} ${msg.sender === 'user' ? styles.sent : styles.received}`}
            >
                {msg.media || msg.audioUrl ? (
                    <VoiceMessage audioUrl={msg.audioUrl || (typeof msg.media === 'string' ? msg.media : URL.createObjectURL(msg.media))} />
                ) : (
                    msg.text
                )}
                <div className={styles.messageMeta}>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.sender === 'user' && <StatusIcon status={msg.status} />}
                </div>
            </div>
        );
    };

    return (
        <div className={`${styles.chatContainer} ${getThemeClass()}`}>
            {/* Header */}
            <div className={styles.header}>
                <button onClick={onClose} className={styles.backButton}>
                    <FiArrowLeft size={24} />
                </button>

                {/* Logo */}
                <div className={styles.logoWrapper}>
                    <img
                        src="/logo-mywallet.png"
                        alt="MyWallet"
                        className={styles.logo}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>

                <div className={styles.headerInfo}>
                    <span className={styles.headerName}>MyWallet AI</span>
                    <span className={styles.headerStatus}>
                        {isOnline ? 'Online' : 'Aguardando rede...'}
                    </span>
                </div>

                {/* Settings Menu */}
                <div className={styles.menuContainer} ref={menuRef}>
                    <button
                        className={styles.menuButton}
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <FiMoreVertical size={20} />
                    </button>

                    {showMenu && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>Tema do Chat</div>
                            <button
                                className={`${styles.dropdownItem} ${theme === THEMES.SYSTEM ? styles.active : ''}`}
                                onClick={() => handleThemeChange(THEMES.SYSTEM)}
                            >
                                <FiSun size={16} />
                                <span>Seguir MyWallet</span>
                            </button>
                            <button
                                className={`${styles.dropdownItem} ${theme === THEMES.WHATSAPP ? styles.active : ''}`}
                                onClick={() => handleThemeChange(THEMES.WHATSAPP)}
                            >
                                <BsWhatsapp size={16} />
                                <span>WhatsApp</span>
                            </button>
                            <button
                                className={`${styles.dropdownItem} ${theme === THEMES.LIGHT ? styles.active : ''}`}
                                onClick={() => handleThemeChange(THEMES.LIGHT)}
                            >
                                <FiSun size={16} />
                                <span>Tema Claro</span>
                            </button>
                            <button
                                className={`${styles.dropdownItem} ${theme === THEMES.DARK ? styles.active : ''}`}
                                onClick={() => handleThemeChange(THEMES.DARK)}
                            >
                                <FiMoon size={16} />
                                <span>Tema Escuro</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesArea}>
                {messages.map(msg => renderMessage(msg))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={styles.inputArea}>
                <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Digite uma mensagem..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />

                {inputValue ? (
                    <button className={styles.actionButton} onClick={handleSendMessage}>
                        <FiSend size={20} />
                    </button>
                ) : (
                    <button
                        className={`${styles.actionButton} ${isRecording ? styles.micActive : ''}`}
                        onMouseDown={() => setIsRecording(true)}
                        onMouseUp={() => setIsRecording(false)}
                        onTouchStart={() => setIsRecording(true)}
                        onTouchEnd={() => setIsRecording(false)}
                    >
                        <FiMic size={20} />
                    </button>
                )}
            </div>
        </div>
    );
}
