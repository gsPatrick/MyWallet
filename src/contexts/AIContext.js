'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

/**
 * AI Context - Global Background Preloading for Whisper Model
 * 
 * This context initializes the Whisper worker on app mount, allowing the model
 * to download in the background while the user navigates other pages.
 */

const AIContext = createContext({
    status: 'idle', // 'idle' | 'downloading' | 'ready' | 'processing' | 'error'
    downloadProgress: 0,
    error: null,
    isModelReady: false,
    startRecording: async () => { },
    stopRecording: async () => { },
    cancelRecording: () => { },
    transcript: '',
});

export function AIProvider({ children }) {
    const [status, setStatus] = useState('idle');
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [transcript, setTranscript] = useState('');
    const [hasShownToast, setHasShownToast] = useState(false);

    const workerRef = useRef(null);
    const audioContextRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioChunksRef = useRef([]);
    const processorRef = useRef(null);

    // Initialize worker and start preloading on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Create worker
        workerRef.current = new Worker(
            new URL('../workers/whisper.worker.js', import.meta.url),
            { type: 'module' }
        );

        // Handle worker messages
        workerRef.current.onmessage = (event) => {
            const { type, percent, text, error: workerError, loaded } = event.data;

            switch (type) {
                case 'progress':
                    setStatus('downloading');
                    setDownloadProgress(percent);
                    break;
                case 'ready':
                    setStatus('ready');
                    setDownloadProgress(100);
                    // Show completion toast
                    if (!hasShownToast) {
                        showToast('✅ IA de voz pronta para uso offline!', 'success');
                        setHasShownToast(true);
                    }
                    break;
                case 'processing':
                    setStatus('processing');
                    break;
                case 'result':
                    setTranscript(text);
                    setStatus('ready');
                    break;
                case 'error':
                    setError(workerError);
                    setStatus('error');
                    break;
                case 'status':
                    if (loaded) setStatus('ready');
                    break;
            }
        };

        // Check if model is already cached, then start preloading
        workerRef.current.postMessage({ type: 'check' });

        // Start preloading immediately
        setTimeout(() => {
            if (status === 'idle') {
                console.log('[AIContext] Starting background model preload...');
                showToast('📥 Baixando IA de voz em 2º plano...', 'info');
                workerRef.current?.postMessage({ type: 'load' });
            }
        }, 2000); // Wait 2s after app mount to not block initial render

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    // Simple toast implementation (can be replaced with react-hot-toast)
    const showToast = (message, type = 'info') => {
        if (typeof window === 'undefined') return;

        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            z-index: 9999999;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease;
        `;
        toast.textContent = message;

        // Add animation keyframes
        if (!document.getElementById('toast-keyframes')) {
            const style = document.createElement('style');
            style.id = 'toast-keyframes';
            style.textContent = `
                @keyframes slideUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    };

    /**
     * Start recording audio from microphone
     */
    const startRecording = useCallback(async () => {
        if (status !== 'ready') {
            console.warn('[AIContext] Cannot record - model not ready');
            return false;
        }

        try {
            setError(null);
            setTranscript('');
            audioChunksRef.current = [];

            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            mediaStreamRef.current = stream;

            // Create AudioContext for processing
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000
            });

            const source = audioContextRef.current.createMediaStreamSource(stream);

            // Create ScriptProcessor to capture raw audio
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            processorRef.current.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                audioChunksRef.current.push(new Float32Array(inputData));
            };

            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            setStatus('recording');
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    }, [status]);

    /**
     * Stop recording and transcribe
     */
    const stopRecording = useCallback(async () => {
        // Stop all tracks
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        // Disconnect processor
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            await audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Concatenate all audio chunks
        const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
        const audioData = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunksRef.current) {
            audioData.set(chunk, offset);
            offset += chunk.length;
        }

        // If we have audio data, send to worker for transcription
        if (audioData.length > 0) {
            setStatus('processing');
            workerRef.current?.postMessage({ type: 'transcribe', data: audioData });
        } else {
            setStatus('ready');
        }
    }, []);

    /**
     * Cancel recording without transcribing
     */
    const cancelRecording = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        audioChunksRef.current = [];
        setStatus('ready');
        setTranscript('');
    }, []);

    const value = {
        status,
        downloadProgress,
        error,
        isModelReady: status === 'ready' || status === 'recording' || status === 'processing',
        startRecording,
        stopRecording,
        cancelRecording,
        transcript,
    };

    return (
        <AIContext.Provider value={value}>
            {children}
        </AIContext.Provider>
    );
}

export const useAI = () => useContext(AIContext);

export default AIContext;
