import { Stack } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout() {
    const { logout } = useAuth();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#0f172a',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                headerRight: () => (
                    <TouchableOpacity onPress={logout} style={{ marginRight: 15 }}>
                        <LogOut size={24} color="#ef4444" />
                    </TouchableOpacity>
                ),
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
        </Stack>
    );
}
