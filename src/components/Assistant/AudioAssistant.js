'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './AudioAssistant.module.css';

export default function AudioAssistant() {
    const { user, token } = useAuth();
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type, message }
    
    const recognitionRef = useRef(null);
    const timeoutRef = useRef(null);
    const wakeWordDetected = useRef(false);

    useEffect(() => {
        // Se não estiver logado ou não tiver a opção ativada, desabilita
        if (!user || !user.audioAssistantEnabled) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API não é suportada por este navegador.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'pt-BR';
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            console.log("🎙️ Audio Assistant escutando em background...");
        };

        recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript.trim().toLowerCase();
            
            console.log("🎙️ Transcrição detectada:", transcript);

            if (wakeWordDetected.current) {
                // Se já detectou a wake word e está aguardando o comando
                processCommand(transcript);
                wakeWordDetected.current = false;
                setIsListening(false);
                clearTimeout(timeoutRef.current);
            } else {
                // Verifica se o texto contém as palavras de ativação
                if (transcript.includes('my wallet') || transcript.includes('mai wallet') || transcript.includes('mywallet')) {
                    console.log("🔊 Wake word detectada! Escutando comando...");
                    wakeWordDetected.current = true;
                    setIsListening(true);
                    
                    // Tocar um som de "beep"
                    playBeep();
                    
                    // Se não falar nada em 5 segundos, cancela o estado
                    timeoutRef.current = setTimeout(() => {
                        console.log("⏰ Tempo esgotado para o comando.");
                        wakeWordDetected.current = false;
                        setIsListening(false);
                    }, 5000);
                }
            }
        };

        recognition.onerror = (event) => {
            // Ignorar erro de no-speech e tentar recomeçar
            if (event.error !== 'no-speech') {
                wakeWordDetected.current = false;
                setIsListening(false);
            }
        };

        recognition.onend = () => {
            // Reinicia imediatamente para continuar escutando no background
            if (user && user.audioAssistantEnabled) {
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Falha ao reiniciar reconhecimento:", e);
                }
            }
        };

        try {
            recognition.start();
        } catch (e) {
            console.error("Falha ao iniciar reconhecimento:", e);
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null; // Prevenir loop
                recognitionRef.current.stop();
            }
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [user, user?.audioAssistantEnabled]);

    const playBeep = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota A5
            
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.error("Não foi possível tocar o beep", e);
        }
    };

    const processCommand = async (commandText) => {
        setIsProcessing(true);
        setFeedback({ type: 'info', message: 'Comando: ' + commandText });
        
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const reqToken = token || localStorage.getItem('mywallet_token');
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
                setFeedback({ type: 'success', message: result.reply || 'Comando processado com sucesso!' });
            } else {
                setFeedback({ type: 'error', message: result.error || 'Erro ao processar o comando.' });
            }
            
            // Ocultar feedback após 4 segundos
            setTimeout(() => setFeedback(null), 4000);
            
        } catch (error) {
            console.error('Erro ao enviar comando:', error);
            setFeedback({ type: 'error', message: 'Falha de conexão com o assistente.' });
            setTimeout(() => setFeedback(null), 4000);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isListening && !isProcessing && !feedback) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                {isListening && (
                    <div className={styles.listeningState}>
                        <div className={styles.pulsingMic}>🎙️</div>
                        <span>Ouvindo comando...</span>
                    </div>
                )}
                {isProcessing && (
                    <div className={styles.processingState}>
                        <div className={styles.spinner}></div>
                        <span>{feedback?.message || 'Processando...'}</span>
                    </div>
                )}
                {feedback && !isProcessing && (
                    <div className={`${styles.feedbackState} ${styles[feedback.type]}`}>
                        {feedback.type === 'success' && '✅ '}
                        {feedback.type === 'error' && '❌ '}
                        {feedback.type === 'info' && '🤖 '}
                        <span>{feedback.message}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
