import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { LogIn, User, Shield, AlertCircle } from 'lucide-react-native';
// Login Screen

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const { login } = useAuth();
    const [selectedRole, setSelectedRole] = useState<'sajid' | 'nasywa' | 'admin' | ''>('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const users = [
        { name: "Sajid", role: "sajid" as const, color: ['#3b82f6', '#06b6d4'] as const, icon: User },
        { name: "Nasywa", role: "nasywa" as const, color: ['#ec4899', '#f43f5e'] as const, icon: User },
        { name: "Admin", role: "admin" as const, color: ['#8b5cf6', '#6366f1'] as const, icon: Shield },
    ];

    const handleLogin = () => {
        if (!selectedRole) {
            setError("Please select a user");
            return;
        }

        const passwords: Record<string, string> = {
            sajid: "sajid20025",
            nasywa: "nasywa123",
            admin: "admin20025"
        };

        if (password === passwords[selectedRole]) {
            const user = users.find(u => u.role === selectedRole);
            if (user) {
                login({ name: user.name, role: user.role });
            }
        } else {
            setError("Incorrect password");
        }
    };

    return (
        <LinearGradient
            colors={['#0f172a', '#1e1b4b', '#312e81']} // Deep dark gradient matching Next.js dark theme
            style={styles.container}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <LinearGradient
                        colors={['#8b5cf6', '#a78bfa'] as const}
                        style={styles.logoBox}
                    >
                        <LogIn size={32} color="white" />
                    </LinearGradient>
                    <Text style={styles.title}>Power Couple</Text>
                    <Text style={styles.subtitle}>Select your account to continue</Text>
                </View>

                <View style={styles.glassCard}>
                    <View style={styles.roleGrid}>
                        {users.map((u) => (
                            <TouchableOpacity
                                key={u.role}
                                activeOpacity={0.8}
                                onPress={() => {
                                    setSelectedRole(u.role);
                                    setError('');
                                }}
                                style={[
                                    styles.roleButton,
                                    selectedRole === u.role && styles.selectedRoleButton
                                ]}
                            >
                                <LinearGradient
                                    colors={u.color}
                                    style={styles.roleIcon}
                                >
                                    <u.icon size={24} color="white" />
                                </LinearGradient>
                                <View style={styles.roleTextContainer}>
                                    <Text style={styles.roleName}>{u.name}</Text>
                                    <Text style={styles.roleLabel}>{u.role}</Text>
                                </View>
                                {selectedRole === u.role && (
                                    <View style={styles.checkCircle}>
                                        <View style={styles.checkInner} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.passwordContainer}>
                        <Text style={styles.inputLabel}>PASSWORD</Text>
                        <TextInput
                            secureTextEntry
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setError('');
                            }}
                        />
                    </View>

                    {error ? (
                        <View style={styles.errorBox}>
                            <AlertCircle size={16} color="#f43f5e" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            (!selectedRole || !password) && styles.disabledButton
                        ]}
                        onPress={handleLogin}
                        disabled={!selectedRole || !password}
                    >
                        <Text style={styles.loginButtonText}>Login</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoBox: {
        width: 70,
        height: 70,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 8,
    },
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    roleGrid: {
        gap: 12,
        marginBottom: 24,
    },
    roleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    selectedRoleButton: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderColor: '#8b5cf6',
    },
    roleIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    roleName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'semibold',
    },
    roleLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        textTransform: 'capitalize',
    },
    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#8b5cf6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'white',
    },
    passwordContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        color: 'white',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(244, 63, 94, 0.2)',
        marginBottom: 20,
        gap: 8,
    },
    errorText: {
        color: '#f43f5e',
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: '#8b5cf6',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.5,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
