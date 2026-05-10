'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const PrivacyContext = createContext();

export function PrivacyProvider({ children }) {
    const [hideData, setHideData] = useState(false);
    const [unlockedBanks, setUnlockedBanks] = useState([]);

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

    const unlockBank = (bankId) => {
        setUnlockedBanks(prev => [...new Set([...prev, String(bankId)])]);
    };

    const isBankUnlocked = (bankId) => {
        return unlockedBanks.includes(String(bankId));
    };

    // Function to mask financial values
    const maskValue = (value) => {
        if (hideData) {
            return '••••••';
        }
        return value;
    };

    return (
        <PrivacyContext.Provider value={{ 
            hideData, 
            toggleHideData, 
            maskValue, 
            unlockBank, 
            isBankUnlocked 
        }}>
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
