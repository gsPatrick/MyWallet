/**
 * Whisper Web Worker for Offline Speech Transcription
 * Uses @xenova/transformers with Whisper Tiny model
 */

// Dynamic import to avoid static analysis issues
let pipeline = null;

// Singleton pattern - model loaded once
let transcriber = null;
let isLoading = false;

/**
 * Initialize the Whisper pipeline
 */
async function loadModel(progressCallback) {
    if (transcriber) {
        return transcriber;
    }
    if (isLoading) {
        return null;
    }

    isLoading = true;

    try {
        // Dynamic import of transformers
        if (!pipeline) {
            const transformers = await import('@xenova/transformers');
            pipeline = transformers.pipeline;
        }

        transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
            progress_callback: function (progress) {
                if (progress.status === 'progress') {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    progressCallback({ type: 'progress', percent: percent });
                }
            }
        });

        progressCallback({ type: 'ready' });
        return transcriber;
    } catch (error) {
        progressCallback({ type: 'error', error: error.message });
        isLoading = false;
        throw error;
    }
}

/**
 * Transcribe audio data
 * @param {Float32Array} audioData - Raw audio samples at 16kHz
 */
async function transcribe(audioData) {
    if (!transcriber) {
        throw new Error('Model not loaded');
    }

    const result = await transcriber(audioData, {
        language: 'portuguese',
        task: 'transcribe'
    });

    return result.text;
}

// Message handler
self.onmessage = async function (event) {
    const type = event.data.type;
    const data = event.data.data;

    if (type === 'load') {
        try {
            await loadModel(function (progress) {
                self.postMessage(progress);
            });
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message });
        }
    } else if (type === 'transcribe') {
        try {
            self.postMessage({ type: 'processing' });
            const text = await transcribe(data);
            self.postMessage({ type: 'result', text: text });
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message });
        }
    } else if (type === 'check') {
        self.postMessage({
            type: 'status',
            loaded: transcriber !== null,
            loading: isLoading
        });
    }
};
