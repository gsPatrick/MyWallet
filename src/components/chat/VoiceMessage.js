import React, { useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause } from 'react-icons/fi';
import styles from './VoiceMessage.module.css';

const VoiceMessage = ({ audioUrl, duration }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(duration || 0);
    const audioRef = useRef(null);

    // Initial random bars for waveform visualization
    const [bars] = useState(() => Array.from({ length: 30 }, () => Math.random() * 80 + 20));

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => {
            if (!duration) setTotalDuration(audio.duration);
        };
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [duration]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (time) => {
        if (!time) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className={styles.voiceMessage}>
            <button className={styles.playButton} onClick={togglePlay}>
                {isPlaying ? <FiPause size={18} /> : <FiPlay size={18} style={{ marginLeft: '2px' }} />}
            </button>

            <div className={styles.waveformContainer}>
                <div className={`${styles.visualizer} ${isPlaying ? styles.playing : ''}`}>
                    {bars.map((height, i) => (
                        <div
                            key={i}
                            className={styles.bar}
                            style={{
                                height: isPlaying ? undefined : `${height}%`,
                                // If not playing, use static height based on "progress" roughly?
                                // Actually, for minimalist look, just static random waveform looks good
                                // When playing, CSS animation takes over
                            }}
                        />
                    ))}
                </div>
                <div className={styles.meta}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(totalDuration)}</span>
                </div>
            </div>

            <audio ref={audioRef} src={audioUrl} style={{ display: 'none' }} />
        </div>
    );
};

export default VoiceMessage;
