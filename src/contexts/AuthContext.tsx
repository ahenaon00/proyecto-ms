import React, { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react'
import type { ReactNode } from 'react'
import api from '@/lib/api';
declare module 'axios' {
    interface InternalAxiosRequestConfig {
        _retry?: boolean;
    }
}

const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';
const USER_KEY = 'auth_user';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

interface User {
    id: string;
    email: string;
    roles: string[];
}

interface AuthContextType {
    token: string | null;
    user: User | null;
    setToken: (token: string | null, user?: User | null) => void;
    isLoading: boolean;
    logout: () => void;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setTokenState] = useState<string | null>(null);
    const [user, setUserState] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionTimer, setSessionTimer] = useState<number | null>(null);

    // Role checking methods
    const hasRole = (role: string): boolean => {
        return user?.roles.includes(role) ?? false;
    };

    const hasAnyRole = (roles: string[]): boolean => {
        return user?.roles.some(role => roles.includes(role)) ?? false;
    };

    const isAdmin = (): boolean => {
        return hasRole('admin');
    };

    // Enhanced setToken with persistence and session management
    const setToken = (newToken: string | null, newUser?: User | null) => {
        setTokenState(newToken);
        setUserState(newUser ?? null);

        if (newToken) {
            // Store token, user, and expiry time
            localStorage.setItem(TOKEN_KEY, newToken);
            if (newUser) {
                localStorage.setItem(USER_KEY, JSON.stringify(newUser));
            }
            const expiryTime = Date.now() + SESSION_TIMEOUT;
            localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

            // Set session timeout
            if (sessionTimer) clearTimeout(sessionTimer);
            const timer = setTimeout(() => {
                logout();
            }, SESSION_TIMEOUT);
            setSessionTimer(timer);
        } else {
            // Clear stored data
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem(TOKEN_EXPIRY_KEY);
            if (sessionTimer) {
                clearTimeout(sessionTimer);
                setSessionTimer(null);
            }
        }
    };

    // Logout function
    const logout = () => {
        setToken(null);
        // Optional: Call logout endpoint
        api.post('/auth/logout').catch(() => {
            // Ignore logout errors - token is cleared locally anyway
        });
    };

    // Initialize token and user from localStorage on app start
    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem(TOKEN_KEY);
            const storedUser = localStorage.getItem(USER_KEY);
            const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

            if (storedToken && storedExpiry) {
                const expiryTime = parseInt(storedExpiry);
                const now = Date.now();

                if (now < expiryTime) {
                    // Token is still valid, use it directly without refresh
                    const userData = storedUser ? JSON.parse(storedUser) : null;
                    setTokenState(storedToken);
                    setUserState(userData);
                } else {
                    // Token expired, clear stored data
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(USER_KEY);
                    localStorage.removeItem(TOKEN_EXPIRY_KEY);
                }
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, []);

    useLayoutEffect(() => {
        const requestInterceptor = api.interceptors.request.use((config) => {
            config.headers.Authorization = !config._retry && token ? `Bearer ${token}` : config.headers.Authorization;
            return config;
        });

        const responseInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401 && !error.config._retry) {
                    error.config._retry = true;
                    try {
                        const refreshResponse = await api.post('/auth/refresh');
                        const newToken = refreshResponse.data.accessToken;
                        setToken(newToken);
                        error.config.headers.Authorization = `Bearer ${newToken}`;
                        return api(error.config);
                    } catch (refreshError) {
                        setToken(null);
                        return Promise.reject(refreshError);
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.request.eject(requestInterceptor);
            api.interceptors.response.eject(responseInterceptor);
        };
    }, [token]);
    
    return (
        <AuthContext.Provider value={{
            token,
            user,
            setToken,
            isLoading,
            logout,
            hasRole,
            hasAnyRole,
            isAdmin
        }}>
            {children}
        </AuthContext.Provider>
    );

    
};


export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthProvider;