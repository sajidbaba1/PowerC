import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

type User = {
    name: string;
    role: 'sajid' | 'nasywa' | 'admin';
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    login: (user: User) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inTabsGroup = segments[0] === '(tabs)';
        const inAdminGroup = segments[0] === '(admin)';

        if (!user) {
            if (inTabsGroup || inAdminGroup) {
                router.replace('/login');
            }
        } else {
            if (user.role === 'admin') {
                if (!inAdminGroup) router.replace('/(admin)');
            } else {
                if (!inTabsGroup) router.replace('/(tabs)');
            }
        }
    }, [user, segments, isLoading]);

    async function loadUser() {
        try {
            const savedUser = await AsyncStorage.getItem('power-couple-user');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        } catch (e) {
            console.error('Failed to load user', e);
        } finally {
            setIsLoading(false);
        }
    }

    async function login(userData: User) {
        setUser(userData);
        await AsyncStorage.setItem('power-couple-user', JSON.stringify(userData));
    }

    async function logout() {
        setUser(null);
        await AsyncStorage.removeItem('power-couple-user');
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
