'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/services/api';

const AuthContext = createContext({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => { },
    logout: () => { },
    register: async () => { },
    updateUser: () => { },
});

export function AuthProvider({ children }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    // PAYWALL: Global protection - redirect to checkout if no active subscription
    useEffect(() => {
        if (isLoading || !user) return;

        // Get current path
        const currentPath = window.location.pathname;

        // Skip paywall for these paths
        const publicPaths = ['/login', '/signup', '/checkout', '/admin', '/forgot-password', '/'];
        if (publicPaths.some(path => currentPath === path || currentPath.startsWith(path + '?'))) {
            return;
        }

        // OWNER can access everything
        if (user.plan === 'OWNER') {
            return;
        }

        // ACTIVE subscription can access everything
        if (user.subscriptionStatus === 'ACTIVE') {
            return;
        }

        // No active subscription = redirect to checkout
        console.log('PAYWALL: User without subscription trying to access:', currentPath);
        console.log('User subscription status:', user.subscriptionStatus, 'Plan:', user.plan);
        router.push('/checkout');
    }, [user, isLoading, router]);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('investpro_token');
            if (token) {
                const response = await authAPI.me();
                // API response format: { success: true, data: user } or { user: {...} }
                const userData = response?.data || response?.user || response;
                if (userData?.id) {
                    setUser(userData);

                    // IMMEDIATE PAYWALL CHECK after auth
                    const currentPath = window.location.pathname;
                    const publicPaths = ['/login', '/signup', '/checkout', '/admin', '/forgot-password', '/', '/landing'];
                    const isPublicPath = publicPaths.some(path => currentPath === path || currentPath.startsWith(path + '?'));

                    if (!isPublicPath) {
                        // Check if needs to go to checkout
                        if (userData.plan !== 'OWNER' && userData.subscriptionStatus !== 'ACTIVE') {
                            console.log('PAYWALL (checkAuth): Redirecting to checkout', userData);
                            router.push('/checkout');
                            return;
                        }
                    }
                } else {
                    localStorage.removeItem('investpro_token');
                    localStorage.removeItem('investpro_user');
                }
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            localStorage.removeItem('investpro_token');
            localStorage.removeItem('investpro_user');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper: Determine redirect path based on user subscription
    const getRedirectPath = (userData) => {
        // OWNER = admin
        if (userData?.plan === 'OWNER') {
            return '/admin';
        }
        // ACTIVE subscription = dashboard
        if (userData?.subscriptionStatus === 'ACTIVE') {
            return '/dashboard';
        }
        // Everyone else = checkout (paywall)
        return '/checkout';
    };

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const response = await authAPI.login(email, password);
            console.log('Login response:', response);

            // API format: { message: "...", data: { accessToken, refreshToken, user } }
            if (response?.data?.accessToken && response?.data?.user) {
                const { accessToken, user: userData } = response.data;
                localStorage.setItem('investpro_token', accessToken);
                localStorage.setItem('investpro_user', JSON.stringify(userData));
                setUser(userData);

                // PAYWALL: Determine redirect
                const redirect = getRedirectPath(userData);
                console.log('User data:', userData, 'Redirect:', redirect);
                return { success: true, redirect };
            }

            // Alternative format
            if (response?.accessToken || response?.token) {
                const token = response.accessToken || response.token;
                const userData = response.user || { email };
                localStorage.setItem('investpro_token', token);
                localStorage.setItem('investpro_user', JSON.stringify(userData));
                setUser(userData);

                // PAYWALL: Determine redirect
                const redirect = getRedirectPath(userData);
                console.log('User data (alt):', userData, 'Redirect:', redirect);
                return { success: true, redirect };
            }

            throw new Error(response?.error || response?.message || 'Erro ao fazer login');
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error?.error || error?.message || 'Credenciais inválidas' };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name, email, password, salary, salaryDay) => {
        setIsLoading(true);
        try {
            const response = await authAPI.register(name, email, password, salary, salaryDay);
            console.log('Register response:', response);

            // API format: { message: "...", data: { accessToken, refreshToken, user } }
            if (response?.data?.accessToken && response?.data?.user) {
                const { accessToken, user: userData } = response.data;
                localStorage.setItem('investpro_token', accessToken);
                localStorage.setItem('investpro_user', JSON.stringify(userData));
                setUser(userData);

                // PAYWALL: Determine redirect (new users go to checkout)
                const redirect = getRedirectPath(userData);
                console.log('Register user data:', userData, 'Redirect:', redirect);
                return { success: true, redirect };
            }

            // Alternative format
            if (response?.accessToken || response?.token) {
                const token = response.accessToken || response.token;
                const userData = response.user || { name, email };
                localStorage.setItem('investpro_token', token);
                localStorage.setItem('investpro_user', JSON.stringify(userData));
                setUser(userData);

                // PAYWALL: Determine redirect
                const redirect = getRedirectPath(userData);
                console.log('Register user data (alt):', userData, 'Redirect:', redirect);
                return { success: true, redirect };
            }

            throw new Error(response?.error || response?.message || 'Erro ao registrar');
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: error?.error || error?.message || 'Erro ao criar conta' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('investpro_token');
        localStorage.removeItem('investpro_user');
        setUser(null);
        window.location.href = '/login';
    };

    const updateUser = (updatedData) => {
        setUser(prev => ({ ...prev, ...updatedData }));
        const stored = localStorage.getItem('investpro_user');
        if (stored) {
            const userData = JSON.parse(stored);
            localStorage.setItem('investpro_user', JSON.stringify({ ...userData, ...updatedData }));
        }
    };

    // Expose checkAuth as refreshUser for external use
    const refreshUser = async () => {
        await checkAuth();
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        updateUser,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
