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
        // LOG DIAGNÓSTICO
        console.log("[AudioAssistant] Component mounted or updated.");
        console.log("[AudioAssistant] User exists?", !!user);
        console.log("[AudioAssistant] Audio enabled?", user?.audioAssistantEnabled);

        // Se não estiver logado ou não tiver a opção ativada, desabilita
        if (!user || !user.audioAssistantEnabled) {
            console.log("[AudioAssistant] Desativado pelo usuário ou não autenticado. Parando...");
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("[AudioAssistant] Speech Recognition API não é suportada por este navegador!");
            alert("Atenção: Seu navegador não suporta reconhecimento de voz (tente Chrome ou Edge).");
            return;
        }

        console.log("[AudioAssistant] Instanciando SpeechRecognition...");
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'pt-BR';
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            console.log("🎙️ [AudioAssistant] Speech API startado e escutando em background...");
        };

        recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript.trim().toLowerCase();
            
            console.log("🎙️ [AudioAssistant] Transcrição detectada:", transcript);

            if (wakeWordDetected.current) {
                console.log("[AudioAssistant] Processando comando direto...");
                // Se já detectou a wake word e está aguardando o comando
                processCommand(transcript);
                wakeWordDetected.current = false;
                setIsListening(false);
                clearTimeout(timeoutRef.current);
            } else {
                // Verifica se o texto contém as palavras de ativação
                if (transcript.includes('my wallet') || transcript.includes('mai wallet') || transcript.includes('mywallet')) {
                    console.log("🔊 [AudioAssistant] Wake word detectada! Entrando no modo de escuta ativa...");
                    wakeWordDetected.current = true;
                    setIsListening(true);
                    
                    // Tocar um som de "beep"
                    playBeep();
                    
                    // Se não falar nada em 5 segundos, cancela o estado
                    timeoutRef.current = setTimeout(() => {
                        console.log("⏰ [AudioAssistant] Tempo esgotado (5s) para dizer o comando.");
                        wakeWordDetected.current = false;
                        setIsListening(false);
                    }, 5000);
                }
            }
        };

        recognition.onerror = (event) => {
            console.error("[AudioAssistant] Erro no reconhecimento:", event.error, event);
            // Ignorar erro de no-speech e tentar recomeçar
            if (event.error !== 'no-speech') {
                wakeWordDetected.current = false;
                setIsListening(false);
            }
        };

        recognition.onend = () => {
            console.log("[AudioAssistant] onend chamado. A API de voz parou de escutar.");
            // Reinicia imediatamente para continuar escutando no background
            if (user && user.audioAssistantEnabled) {
                try {
                    console.log("[AudioAssistant] Tentando reiniciar...");
                    recognition.start();
                } catch (e) {
                    console.error("[AudioAssistant] Falha ao reiniciar (provavelmente já está rodando):", e);
                }
            }
        };

        const startAssistant = async () => {
            console.log("[AudioAssistant] Chamando getUserMedia para forçar permissão do microfone...");
            try {
                // Solicitar permissão de áudio explicitamente para o navegador mostrar o popup
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log("[AudioAssistant] getUserMedia SUCESSO! stream ativo:", stream.active);
                try {
                    recognition.start();
                    console.log("[AudioAssistant] recognition.start() chamado com sucesso!");
                } catch(e) {
                    console.warn("[AudioAssistant] start() ignorado (já rodando):", e.message);
                }
            } catch (err) {
                console.error("❌ [AudioAssistant] getUserMedia falhou - Permissão do microfone negada ou erro HTTPS:", err);
                alert(`Erro de Microfone: ${err.message || 'Permissão negada'}. Verifique se você está acessando por HTTPS ou Localhost.`);
            }
        };

        startAssistant();

        return () => {
            console.log("[AudioAssistant] Limpando effects...");
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

    if (!user?.audioAssistantEnabled) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.container} onClick={() => {
                // Ao clicar manualmente, tenta iniciar ou pedir permissão
                if (!isListening) {
                    setIsListening(true);
                    wakeWordDetected.current = true;
                    setFeedback({ type: 'info', message: 'Pode falar seu comando agora...' });
                    try { recognitionRef.current?.start(); } catch(e) {}
                    
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    timeoutRef.current = setTimeout(() => {
                        wakeWordDetected.current = false;
                        setIsListening(false);
                        setFeedback(null);
                    }, 5000);
                }
            }}>
                {/* Ícone fixo mostrando que o assistente está ativado */}
                <div className={`${styles.pulsingMic} ${isListening ? styles.activeMic : styles.idleMic}`}>
                    🎙️
                </div>

                {isListening && !isProcessing && (
                    <div className={styles.listeningState}>
                        <span>Ouvindo comando...</span>
                    </div>
                )}
                {isProcessing && (
                    <div className={styles.processingState}>
                        <div className={styles.spinner}></div>
                        <span>{feedback?.message || 'Processando...'}</span>
                    </div>
                )}
                {feedback && !isProcessing && !isListening && (
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
