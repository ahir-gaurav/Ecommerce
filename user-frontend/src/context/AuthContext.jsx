import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const response = await userAPI.getProfile();
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await authAPI.login({ email, password });
        const { token, user } = response.data;

        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);

        return response.data;
    };

    const register = async (name, email, password) => {
        const response = await authAPI.register({ name, email, password });
        return response.data;
    };

    const verifyOTP = async (email, otp) => {
        const response = await authAPI.verifyOTP({ email, otp });
        const { token, user } = response.data;

        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);

        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        verifyOTP,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
