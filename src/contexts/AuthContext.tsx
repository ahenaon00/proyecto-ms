import { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react'
import type { ReactNode } from 'react'
import api from '@/lib/api';
declare module 'axios' {
    interface InternalAxiosRequestConfig {
        _retry?: boolean;
    }
}

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';
const USER_KEY = 'auth_user';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Keycloak configuration from JWT
const KEYCLOAK_BASE_URL = 'http://localhost:8080';
const REALM_NAME = 'proyect-ms-realm';
const CLIENT_ID = 'user-ms-client';

// Helper function to decode JWT payload
const decodeJWT = (token: string) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

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

    // Function to refresh access token using refresh token
    const refreshToken = async (): Promise<string | null> => {
        try {
            const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
            if (!storedRefreshToken) {
                console.log('No refresh token available');
                return null;
            }

            console.log('Attempting to refresh token...');
            const response = await fetch(`${KEYCLOAK_BASE_URL}/realms/${REALM_NAME}/protocol/openid-connect/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: CLIENT_ID,
                    refresh_token: storedRefreshToken
                })
            });

            if (!response.ok) {
                console.error('Token refresh failed:', response.status, response.statusText);
                // Refresh token expired or invalid, clear all tokens
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(REFRESH_TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                localStorage.removeItem(TOKEN_EXPIRY_KEY);
                return null;
            }

            const tokenData = await response.json();
            const { access_token, refresh_token: newRefreshToken } = tokenData;
            
            // Decode the new token to get user info
            const decodedToken = decodeJWT(access_token);
            const rolesFromToken = decodedToken?.realm_access?.roles || [];
            const newUser: User = {
                id: decodedToken?.sub || '',
                email: decodedToken?.email || decodedToken?.preferred_username || '',
                roles: rolesFromToken
            };

            // Update tokens and user
            localStorage.setItem(TOKEN_KEY, access_token);
            localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
            localStorage.setItem(USER_KEY, JSON.stringify(newUser));
            
            // Update token expiry based on JWT exp claim
            if (decodedToken?.exp) {
                const expiryTime = decodedToken.exp * 1000; // Convert to milliseconds
                localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
            }

            setTokenState(access_token);
            setUserState(newUser);
            
            console.log('Token refreshed successfully');
            return access_token;
        } catch (error) {
            console.error('Error refreshing token:', error);
            // Clear all tokens on error
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem(TOKEN_EXPIRY_KEY);
            return null;
        }
    };

    // Enhanced setToken with persistence and session management
    const setToken = (newToken: string | null, newUser?: User | null, refreshTokenValue?: string) => {
        setTokenState(newToken);
        setUserState(newUser ?? null);
        if (newToken) {
            const decodedToken = decodeJWT(newToken);
            console.log('Setting token in AuthContext, decoded payload:', decodedToken);
        }
        if (newUser) {
            console.log('Setting user in AuthContext:', { user: newUser, roles: newUser.roles });
        }

        if (newToken) {
            // Store token, user, refresh token, and expiry time
            localStorage.setItem(TOKEN_KEY, newToken);
            if (refreshTokenValue) {
                localStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenValue);
            }
            if (newUser) {
                localStorage.setItem(USER_KEY, JSON.stringify(newUser));
            }
            
            // Get expiry from JWT instead of fixed timeout
            const decodedToken = decodeJWT(newToken);
            let expiryTime: number;
            if (decodedToken?.exp) {
                expiryTime = decodedToken.exp * 1000; // Convert to milliseconds
            } else {
                expiryTime = Date.now() + SESSION_TIMEOUT; // Fallback
            }
            localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

            // Set session timeout
            if (sessionTimer) clearTimeout(sessionTimer);
            const timer = setTimeout(() => {
                logout();
            }, SESSION_TIMEOUT);
            setSessionTimer(timer);
        } else {
            // Clear stored data including refresh token
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
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

            if (storedToken) {
                const decodedToken = decodeJWT(storedToken);
                const now = Math.floor(Date.now() / 1000); // Convert to seconds
                
                if (decodedToken?.exp && now < decodedToken.exp) {
                    // Token is still valid based on JWT exp claim
                    const userData = storedUser ? JSON.parse(storedUser) : null;
                    setTokenState(storedToken);
                    setUserState(userData);
                    if (userData) {
                        console.log('Loaded user from localStorage:', { user: userData, roles: userData.roles });
                    }
                } else if (decodedToken?.exp && now >= decodedToken.exp) {
                    // Access token expired, try to refresh
                    console.log('Access token expired, attempting refresh...');
                    const newToken = await refreshToken();
                    if (!newToken) {
                        // Refresh failed, clear all data
                        console.log('Token refresh failed, clearing stored data');
                        localStorage.removeItem(TOKEN_KEY);
                        localStorage.removeItem(REFRESH_TOKEN_KEY);
                        localStorage.removeItem(USER_KEY);
                        localStorage.removeItem(TOKEN_EXPIRY_KEY);
                    }
                } else {
                    // Invalid token format, clear stored data
                    console.log('Invalid token format, clearing stored data');
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(REFRESH_TOKEN_KEY);
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
                        const newToken = await refreshToken();
                        if (newToken) {
                            error.config.headers.Authorization = `Bearer ${newToken}`;
                            return api(error.config);
                        } else {
                            // Refresh failed, logout user
                            setToken(null);
                            return Promise.reject(new Error('Token refresh failed'));
                        }
                    } catch (refreshError) {
                        console.error('Token refresh error in interceptor:', refreshError);
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