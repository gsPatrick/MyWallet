'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { FiMic, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import styles from './AudioAssistantModal.module.css';

export default function AudioAssistantModal({ isOpen, onClose }) {
    const { token } = useAuth();
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type, message }
    const [transcriptPart, setTranscriptPart] = useState('');
    
    const recognitionRef = useRef(null);
    const timeoutRef = useRef(null);

    // Stop listening when unmounted or closed
    useEffect(() => {
        if (!isOpen) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            setFeedback(null);
            setTranscriptPart('');
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setFeedback({ type: 'error', message: 'Seu navegador não suporta reconhecimento de voz.' });
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Só escuta uma frase
        recognition.interimResults = true; // Mostra resultados enquanto fala
        recognition.lang = 'pt-BR';
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            setIsListening(true);
            setFeedback(null);
            setTranscriptPart('Pode falar...');
        };

        recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            
            setTranscriptPart(transcript);

            // Quando terminar a fala (isFinal == true)
            if (event.results[current].isFinal) {
                setIsListening(false);
                processCommand(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error("[AudioAssistant] Erro no reconhecimento:", event.error);
            if (event.error !== 'no-speech') {
                setIsListening(false);
                setFeedback({ type: 'error', message: 'Erro ao escutar: ' + event.error });
            } else {
                setTranscriptPart('Não ouvi nada. Tente falar novamente.');
                setIsListening(false);
                setTimeout(() => {
                    if (isOpen && !isProcessing) {
                        try { recognition.start(); } catch(e){}
                    }
                }, 2000);
            }
        };

        recognition.onend = () => {
            // Se parou de escutar e não está processando nem teve erro, pode ser que ele terminou de falar ou cancelou
            if (isListening) setIsListening(false);
        };

        const startAssistant = async () => {
            try {
                // Solicitar permissão de áudio explicitamente
                await navigator.mediaDevices.getUserMedia({ audio: true });
                recognition.start();
            } catch (err) {
                console.error("Permissão do microfone negada:", err);
                setFeedback({ type: 'error', message: 'Permissão do microfone negada pelo navegador.' });
                setIsListening(false);
            }
        };

        startAssistant();

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isOpen]);

    const playBeep = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {}
    };

    const processCommand = async (commandText) => {
        setIsProcessing(true);
        setFeedback({ type: 'info', message: 'Processando: "' + commandText + '"' });
        
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const reqToken = token || localStorage.getItem('investpro_token') || localStorage.getItem('mywallet_token');
            const response = await fetch(`${API_URL}/whatsapp/process-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${reqToken}`
                },
                body: JSON.stringify({ message: commandText })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                playBeep();
                setFeedback({ type: 'success', message: result.reply || 'Comando processado com sucesso!' });
                
                // Fecha sozinho depois de 3 segundos se for sucesso
                timeoutRef.current = setTimeout(() => {
                    onClose();
                }, 3000);
            } else {
                setFeedback({ type: 'error', message: result.error || 'Erro ao processar o comando.' });
            }
            
        } catch (error) {
            console.error('Erro ao enviar comando:', error);
            setFeedback({ type: 'error', message: 'Falha de conexão com a IA.' });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className={styles.backdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className={styles.modal}
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                    >
                        <button className={styles.closeBtn} onClick={onClose}>
                            <FiX />
                        </button>

                        <div className={styles.content}>
                            <h2>Assistente de Voz</h2>
                            
                            <div className={styles.micContainer}>
                                <div className={`${styles.micCircle} ${isListening ? styles.listening : ''}`}>
                                    <FiMic className={styles.micIcon} />
                                </div>
                                {isListening && (
                                    <div className={styles.rippleContainer}>
                                        <div className={styles.ripple}></div>
                                        <div className={styles.ripple2}></div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.statusArea}>
                                {isListening && (
                                    <p className={styles.transcript}>{transcriptPart}</p>
                                )}
                                
                                {isProcessing && (
                                    <div className={styles.processing}>
                                        <div className={styles.spinner}></div>
                                        <p>Analisando comando...</p>
                                    </div>
                                )}

                                {feedback && !isProcessing && (
                                    <motion.div 
                                        className={`${styles.feedback} ${styles[feedback.type]}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {feedback.type === 'success' && <FiCheckCircle />}
                                        {feedback.type === 'error' && <FiAlertCircle />}
                                        <p>{feedback.message}</p>
                                    </motion.div>
                                )}
                            </div>

                            {!isListening && !isProcessing && feedback?.type !== 'success' && (
                                <button 
                                    className={styles.retryBtn}
                                    onClick={() => {
                                        setFeedback(null);
                                        setTranscriptPart('');
                                        try { recognitionRef.current?.start(); } catch(e){}
                                    }}
                                >
                                    Falar novamente
                                </button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
