'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook for offline speech recognition using Whisper
 * 
 * Status flow:
 * - 'idle': Ready to start
 * - 'downloading': Model is being downloaded
 * - 'ready': Model loaded, ready to record
 * - 'recording': Currently recording audio
 * - 'processing': Transcribing audio locally
 */
export function useOfflineSpeech() {
    const [status, setStatus] = useState('idle'); // 'idle' | 'downloading' | 'ready' | 'recording' | 'processing'
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [transcript, setTranscript] = useState('');

    const workerRef = useRef(null);
    const audioContextRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioChunksRef = useRef([]);
    const processorRef = useRef(null);

    // Initialize worker
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
                    setStatus('idle');
                    break;
                case 'status':
                    if (loaded) setStatus('ready');
                    break;
            }
        };

        // Check if model is already loaded
        workerRef.current.postMessage({ type: 'check' });

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    /**
     * Load the Whisper model (call this before recording if you want to pre-load)
     */
    const loadModel = useCallback(() => {
        if (status === 'ready' || status === 'downloading') return;

        setStatus('downloading');
        setDownloadProgress(0);
        workerRef.current?.postMessage({ type: 'load' });
    }, [status]);

    /**
     * Start recording audio from microphone
     */
    const startRecording = useCallback(async () => {
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
        } catch (err) {
            setError(err.message);
            setStatus('idle');
        }
    }, []);

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

    /**
     * Check if model is loaded
     */
    const isModelLoaded = status === 'ready' || status === 'recording' || status === 'processing';

    return {
        status,
        downloadProgress,
        transcript,
        error,
        isModelLoaded,
        loadModel,
        startRecording,
        stopRecording,
        cancelRecording,
    };
}

export default useOfflineSpeech;
