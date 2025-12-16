'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
    theme: 'dark',
    accentColor: '#6366f1',
    setTheme: () => { },
    setAccentColor: () => { },
    toggleTheme: () => { },
});

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('dark');
    const [accentColor, setAccentColor] = useState('#6366f1');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('investpro-theme') || 'dark';
        const savedAccent = localStorage.getItem('investpro-accent') || '#6366f1';
        setTheme(savedTheme);
        setAccentColor(savedAccent);
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.documentElement.style.setProperty('--accent-primary', savedAccent);
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('investpro-theme', theme);
            document.documentElement.setAttribute('data-theme', theme);
        }
    }, [theme, mounted]);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('investpro-accent', accentColor);
            document.documentElement.style.setProperty('--accent-primary', accentColor);
        }
    }, [accentColor, mounted]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const value = {
        theme,
        accentColor,
        setTheme,
        setAccentColor,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
