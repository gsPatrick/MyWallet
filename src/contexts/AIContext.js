'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

/**
 * AI Context - Global Background Preloading for Whisper Model
 * 
 * This context manages the Whisper worker lifecycle and provides:
 * - First access check: Shows setup screen if model not downloaded
 * - Manual download trigger: User must explicitly click to download
 * - Persistent skip preference: Stored in localStorage
 */

const STORAGE_KEYS = {
    MODEL_DOWNLOADED: 'mywallet_ai_model_downloaded',
    SETUP_SKIPPED: 'mywallet_ai_setup_skipped'
};

const AIContext = createContext({
    status: 'idle', // 'idle' | 'downloading' | 'ready' | 'processing' | 'error'
    downloadProgress: 0,
    error: null,
    isModelReady: false,
    showSetupScreen: false,
    startRecording: async () => { },
    stopRecording: async () => { },
    cancelRecording: () => { },
    triggerDownload: () => { },
    skipSetup: () => { },
    transcript: '',
});

export function AIProvider({ children }) {
    const [status, setStatus] = useState('idle');
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [transcript, setTranscript] = useState('');
    const [hasShownToast, setHasShownToast] = useState(false);
    const [showSetupScreen, setShowSetupScreen] = useState(false);
    const [userSkippedSetup, setUserSkippedSetup] = useState(false);

    const workerRef = useRef(null);
    const audioContextRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioChunksRef = useRef([]);
    const processorRef = useRef(null);

    // Check localStorage on mount for previous state
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const modelDownloaded = localStorage.getItem(STORAGE_KEYS.MODEL_DOWNLOADED) === 'true';
        const setupSkipped = localStorage.getItem(STORAGE_KEYS.SETUP_SKIPPED) === 'true';

        setUserSkippedSetup(setupSkipped);

        // Check if device is mobile (AI voice model only makes sense for mobile)
        const isMobile = window.matchMedia('(max-width: 768px)').matches ||
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0;

        // If model was previously downloaded, it should still be in browser cache
        // We'll verify this when worker responds to 'check' command
        // Only show setup screen on MOBILE devices
        if (!modelDownloaded && !setupSkipped && isMobile) {
            // First access on mobile: show setup screen
            setShowSetupScreen(true);
        }
    }, []);

    // Initialize worker on mount
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
                    setShowSetupScreen(false);
                    // Mark as downloaded in localStorage
                    localStorage.setItem(STORAGE_KEYS.MODEL_DOWNLOADED, 'true');
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
                    if (loaded) {
                        setStatus('ready');
                        setShowSetupScreen(false);
                        localStorage.setItem(STORAGE_KEYS.MODEL_DOWNLOADED, 'true');
                    }
                    break;
            }
        };

        // Check if model is already cached in IndexedDB/browser cache
        // Pass the flag so worker can auto-load from cache if previously downloaded
        const wasDownloaded = localStorage.getItem(STORAGE_KEYS.MODEL_DOWNLOADED) === 'true';
        workerRef.current.postMessage({ type: 'check', wasDownloaded });

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    /**
     * Manually trigger model download (called from UI button)
     */
    const triggerDownload = useCallback(() => {
        // Use navigator.onLine for simple check (no external hook dependency)
        if (typeof window !== 'undefined' && !navigator.onLine) {
            showToast('❌ Você precisa estar online para baixar o modelo.', 'error');
            return;
        }

        setShowSetupScreen(false);
        showToast('📥 Baixando IA de voz...', 'info');
        workerRef.current?.postMessage({ type: 'load' });
    }, []);

    /**
     * Skip setup and use text-only mode
     */
    const skipSetup = useCallback(() => {
        setUserSkippedSetup(true);
        setShowSetupScreen(false);
        localStorage.setItem(STORAGE_KEYS.SETUP_SKIPPED, 'true');
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
        showSetupScreen,
        startRecording,
        stopRecording,
        cancelRecording,
        triggerDownload,
        skipSetup,
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
