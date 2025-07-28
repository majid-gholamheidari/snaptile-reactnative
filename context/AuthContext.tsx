import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const TOKEN_KEY = 'user-token';
const API_URL = 'https://snaptile.ir/api';

interface AuthContextType {
    authState: { token: string | null; authenticated: boolean };
    isAuthLoading: boolean;
    login: (username, password) => Promise<any>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [authState, setAuthState] = useState<{ token: string | null; authenticated: boolean }>({
        token: null,
        authenticated: false,
    });
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const logout = useCallback(async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        delete axios.defaults.headers.common['Authorization'];
        setAuthState({
            token: null,
            authenticated: false,
        });
    }, []);

    useEffect(() => {
        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401) {
                    console.log('401 Error - Token expired or invalid. Logging out.');
                    await logout();
                }
                return Promise.reject(error);
            }
        );

        const loadToken = async () => {
            try {
                const token = await SecureStore.getItemAsync(TOKEN_KEY);
                if (token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    setAuthState({ token: token, authenticated: true });
                }
            } catch (e) {
                console.error("Failed to load token", e);
            } finally {
                setIsAuthLoading(false);
            }
        };

        loadToken();

        return () => {
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [logout]);

    const login = async (username, password) => {
        try {
            const result = await axios.post(`${API_URL}/login`, { username, password });
            const token = result.data.token;
            setAuthState({ token: token, authenticated: true });
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            await SecureStore.setItemAsync(TOKEN_KEY, token);
            return result;
        } catch (e) {
            throw e;
        }
    };

    const value = {
        authState,
        isAuthLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
