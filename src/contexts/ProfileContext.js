'use client';

/**
 * ProfileContext
 * ========================================
 * MULTI-CONTEXT PROFILE MANAGEMENT
 * ========================================
 * 
 * - Lista de perfis do usuário
 * - Perfil ativo atual
 * - Troca de contexto (switch)
 * - Persistência no localStorage
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { profilesAPI } from '@/services/api';

const ProfileContext = createContext({
    profiles: [],
    currentProfile: null,
    loading: true,
    hasProfiles: false,
    loadProfiles: () => { },
    switchProfile: () => { },
    refreshProfiles: () => { },
});

export function ProfileProvider({ children }) {
    const [profiles, setProfiles] = useState([]);
    const [currentProfile, setCurrentProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasProfiles, setHasProfiles] = useState(false);

    // Carregar perfis do backend
    const loadProfiles = useCallback(async () => {
        try {
            setLoading(true);

            // Verificar se há perfis
            const checkRes = await profilesAPI.check();
            setHasProfiles(checkRes?.hasProfiles || false);

            if (checkRes?.hasProfiles) {
                // Buscar lista de perfis
                const listRes = await profilesAPI.list();
                const profilesList = listRes?.profiles || [];
                setProfiles(profilesList);

                // Verificar se há perfil salvo no localStorage
                const savedProfileId = typeof window !== 'undefined'
                    ? localStorage.getItem('investpro_profile_id')
                    : null;

                if (savedProfileId) {
                    const savedProfile = profilesList.find(p => p.id === savedProfileId);
                    if (savedProfile) {
                        setCurrentProfile(savedProfile);
                    } else {
                        // Perfil salvo não existe mais, usar default
                        const defaultProfile = profilesList.find(p => p.isDefault) || profilesList[0];
                        setCurrentProfile(defaultProfile);
                        if (defaultProfile && typeof window !== 'undefined') {
                            localStorage.setItem('investpro_profile_id', defaultProfile.id);
                        }
                    }
                } else {
                    // Sem perfil salvo, usar default
                    const defaultProfile = profilesList.find(p => p.isDefault) || profilesList[0];
                    setCurrentProfile(defaultProfile);
                    if (defaultProfile && typeof window !== 'undefined') {
                        localStorage.setItem('investpro_profile_id', defaultProfile.id);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading profiles:', error);
            setHasProfiles(false);
        } finally {
            setLoading(false);
        }
    }, []);

    // Trocar de perfil - FORÇA RELOAD para limpar dados do perfil anterior
    const switchProfile = useCallback(async (profileId) => {
        try {
            // 1. Salvar no localStorage PRIMEIRO (antes da API)
            if (typeof window !== 'undefined') {
                localStorage.setItem('investpro_profile_id', profileId);
                console.log('🔄 [PROFILE] Switching to profile:', profileId);
            }

            // 2. Chamar API para marcar como default no backend
            await profilesAPI.switchProfile(profileId);

            // 3. Atualizar state local
            const profile = profiles.find(p => p.id === profileId);
            if (profile) {
                setCurrentProfile(profile);
            }

            // 4. FORÇA RELOAD da página para limpar todos os dados cached
            // Isso garante que dashboard, transações, etc. busquem dados do novo perfil
            if (typeof window !== 'undefined') {
                window.location.reload();
            }

            return true;
        } catch (error) {
            console.error('Error switching profile:', error);
            return false;
        }
    }, [profiles]);

    // Refresh profiles
    const refreshProfiles = useCallback(async () => {
        await loadProfiles();
    }, [loadProfiles]);

    // Carregar perfis ao montar
    useEffect(() => {
        // Verificar se já está autenticado antes de carregar
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('investpro_token')
            : null;

        if (token) {
            loadProfiles();
        } else {
            setLoading(false);
        }
    }, [loadProfiles]);

    const value = {
        profiles,
        currentProfile,
        loading,
        hasProfiles,
        loadProfiles,
        switchProfile,
        refreshProfiles,
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfiles() {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfiles must be used within a ProfileProvider');
    }
    return context;
}

export default ProfileContext;
