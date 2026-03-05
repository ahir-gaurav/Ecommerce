import { createContext, useContext, useState, useEffect } from 'react';
import { adminAuthAPI } from '../api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    // Initialize admin state directly from localStorage so it's available on first render
    const storedToken = localStorage.getItem('admin_token');
    const storedAdmin = (() => {
        try {
            const raw = localStorage.getItem('admin_info');
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    })();

    const [admin, setAdmin] = useState(storedAdmin);
    const [token, setToken] = useState(storedToken);
    // loading=true while we verify the token server-side on page refresh
    const [loading, setLoading] = useState(!!storedToken);

    useEffect(() => {
        if (!storedToken) { setLoading(false); return; }
        adminAuthAPI.me()
            .then(res => {
                const freshAdmin = res.data.admin;
                localStorage.setItem('admin_info', JSON.stringify(freshAdmin));
                setAdmin(freshAdmin);
                setToken(storedToken);
            })
            .catch(() => {
                // Token expired or invalid — clear everything
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_info');
                setToken(null);
                setAdmin(null);
            })
            .finally(() => setLoading(false));
    }, []); // only on mount

    const login = async (email, password) => {
        const response = await adminAuthAPI.login({ email, password });
        const { token: newToken, admin: newAdmin } = response.data;

        localStorage.setItem('admin_token', newToken);
        localStorage.setItem('admin_info', JSON.stringify(newAdmin));
        setToken(newToken);
        setAdmin(newAdmin);

        return response.data;
    };

    const register = async (data) => {
        const response = await adminAuthAPI.register(data);
        const { token: newToken, admin: newAdmin } = response.data;

        localStorage.setItem('admin_token', newToken);
        localStorage.setItem('admin_info', JSON.stringify(newAdmin));
        setToken(newToken);
        setAdmin(newAdmin);

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
        // isAuthenticated: token exists AND admin info is loaded
        isAuthenticated: !!token && !!admin,
        login,
        register,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
