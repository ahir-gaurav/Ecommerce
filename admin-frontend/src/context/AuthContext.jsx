import { createContext, useContext, useState, useEffect } from 'react';
import { adminAuthAPI } from '../api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('admin_token'));

    useEffect(() => {
        if (token) {
            // We store admin info in localStorage since there's no /me endpoint
            const stored = localStorage.getItem('admin_info');
            if (stored) {
                setAdmin(JSON.parse(stored));
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        const response = await adminAuthAPI.login({ email, password });
        const { token, admin } = response.data;

        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_info', JSON.stringify(admin));
        setToken(token);
        setAdmin(admin);

        return response.data;
    };

    const register = async (data) => {
        const response = await adminAuthAPI.register(data);
        const { token, admin } = response.data;

        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_info', JSON.stringify(admin));
        setToken(token);
        setAdmin(admin);

        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        setToken(null);
        setAdmin(null);
    };

    const value = {
        admin,
        loading,
        isAuthenticated: !!admin && !!token,
        login,
        register,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
