import { Platform } from 'react-native';
import { router } from 'expo-router';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Constants.appOwnership === 'expo';

let Notifications: any = null;

const loadNotifications = () => {
    if (Notifications) return Notifications;
    // CRITICAL: Return null immediately if in Expo Go on Android to prevent loading the module which triggers side-effects
    if (isExpoGo && Platform.OS === 'android') return null;
    try {
        // @ts-ignore
        Notifications = require('expo-notifications');
        return Notifications;
    } catch (e) {
        console.warn("Could not load expo-notifications:", e);
        return null;
    }
}

// Initialize handler safely ONLY if supported
try {
    if (!(isExpoGo && Platform.OS === 'android')) {
        const notif = loadNotifications();
        if (notif) {
            notif.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });
        }
    }
} catch (e) {
    console.warn("Handler setup error:", e);
}


export const requestNotificationPermissions = async () => {
    if (isExpoGo && Platform.OS === 'android') {
        console.log("Notifications skipped in Expo Go Android");
        return false;
    }

    const notif = loadNotifications();
    if (!notif) return false;

    try {
        const { status: existingStatus } = await notif.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await notif.requestPermissionsAsync();
            finalStatus = status;
        }
        return finalStatus === 'granted';
    } catch (e) {
        console.warn("Error requesting permissions:", e);
        return false;
    }
};

export const scheduleLocalNotification = async (title: string, body: string, data = {}) => {
    const notif = loadNotifications();
    if (!notif) return;

    try {
        await notif.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
            },
            trigger: null, // Send immediately
        });
    } catch (e) {
        console.warn("Error scheduling notification:", e);
    }
};

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    const notif = loadNotifications();
    if (!notif) return null;

    if (Platform.OS === 'android') {
        try {
            await notif.setNotificationChannelAsync('default', {
                name: 'default',
                importance: notif.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        } catch (e) {
            console.warn("Notification channel setup failed:", e);
        }
    }

    try {
        const tokenData = await notif.getExpoPushTokenAsync();
        return tokenData?.data || null;
    } catch (e) {
        console.warn("Error getting push token:", e);
        return null;
    }
};

// Listener for interacting with notifications
export const setupNotificationListeners = () => {
    const notif = loadNotifications();
    if (!notif) return () => { };

    try {
        const responseListener = notif.addNotificationResponseReceivedListener((response: any) => {
            // Redirect to chat if notification is clicked
            router.push('/(tabs)/chat');
        });

        return () => {
            responseListener.remove();
        };
    } catch (e) {
        console.warn("Error setting up listeners:", e);
        return () => { };
    }
};
