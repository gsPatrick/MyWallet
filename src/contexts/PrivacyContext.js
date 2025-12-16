'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const PrivacyContext = createContext();

export function PrivacyProvider({ children }) {
    const [hideData, setHideData] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('investpro_hide_data');
        if (saved === 'true') {
            setHideData(true);
        }
    }, []);

    const toggleHideData = () => {
        setHideData(prev => {
            const newValue = !prev;
            localStorage.setItem('investpro_hide_data', String(newValue));
            return newValue;
        });
    };

    // Function to mask financial values
    const maskValue = (value) => {
        if (hideData) {
            return '••••••';
        }
        return value;
    };

    return (
        <PrivacyContext.Provider value={{ hideData, toggleHideData, maskValue }}>
            {children}
        </PrivacyContext.Provider>
    );
}

export function usePrivacy() {
    const context = useContext(PrivacyContext);
    if (!context) {
        throw new Error('usePrivacy must be used within a PrivacyProvider');
    }
    return context;
}
