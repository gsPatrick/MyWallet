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

        // DISABLED: Automatic setup screen for AI voice model
        // We now force privacy/text-only mode by default for stability
        setShowSetupScreen(false);
    }, []);

    // Initialize worker on mount - DISABLED per user request (remove AI voice UI)
    useEffect(() => {
        // AI Voice feature disabled.
        // We do not initialize the worker to save resources and prevent messages.
        setStatus('idle');
    }, []);

    /**
     * Manually trigger model download (called from UI button)
     */
    const triggerDownload = useCallback(() => {
        setShowSetupScreen(false);
        // Silently ignore or just log
        console.log('[AIContext] Voice feature disabled.');
    }, []);

    /**
     * Skip setup and use text-only mode
     */
    const skipSetup = useCallback(() => {
        setUserSkippedSetup(true);
        setShowSetupScreen(false);
        localStorage.setItem(STORAGE_KEYS.SETUP_SKIPPED, 'true');
    }, []);

    // Toast disabled globally for AI
    const showToast = (message, type = 'info') => {
        // console.log('[AI Toast]', message); 
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

            // Clean up any existing stream before requesting new one
            if (mediaStreamRef.current) {
                console.log('[AIContext] Cleaning up existing stream before new request');
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }

            // Close any existing audio context
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                try {
                    await audioContextRef.current.close();
                } catch (e) {
                    console.warn('[AIContext] Error closing audio context:', e);
                }
                audioContextRef.current = null;
            }

            // Get microphone access with retry logic
            const audioConstraints = {
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            };

            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
            } catch (firstError) {
                console.warn('[AIContext] First getUserMedia attempt failed, retrying in 100ms:', firstError);
                // Wait 100ms and retry
                await new Promise(resolve => setTimeout(resolve, 100));
                stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
            }

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
            console.error('[AIContext] Failed to start recording:', err);
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
