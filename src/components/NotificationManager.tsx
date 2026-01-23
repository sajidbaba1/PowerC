"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

interface NotificationManagerProps {
    userId: string; // 'sajid' or 'nasywa'
}

export default function NotificationManager({ userId }: NotificationManagerProps) {
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, [userId]);

    const checkSubscription = async () => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            setIsSubscribed(true);
            // Optionally sync with backend to ensure it's up to date
            sendSubscriptionToBackend(subscription);
        }
    };

    const subscribe = async () => {
        if (!VAPID_PUBLIC_KEY) {
            console.error("No VAPID public key found");
            return;
        }

        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.register("/sw.js");
            await navigator.serviceWorker.ready; // Wait for active

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            await sendSubscriptionToBackend(subscription);
            setPermission(Notification.permission);
            setIsSubscribed(true);
            // new Audio("/sounds/success.mp3").play().catch(() => {}); // Optional feedback
        } catch (err) {
            console.error("Failed to subscribe:", err);
            alert("Failed to enable notifications. Please checking your browser settings.");
        } finally {
            setLoading(false);
        }
    };

    const sendSubscriptionToBackend = async (subscription: PushSubscription) => {
        try {
            await fetch("/api/notifications/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subscription,
                    userId,
                }),
            });
        } catch (err) {
            console.error("Failed to save subscription:", err);
        }
    };

    if (permission === "granted" && isSubscribed) {
        return null; // Already setup, verified silently
    }

    if (permission === "denied") {
        return (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 px-3 py-1.5 rounded-full border border-red-500/20">
                <BellOff className="w-3 h-3" />
                <span>Notifications Blocked</span>
            </div>
        );
    }

    return (
        <button
            onClick={subscribe}
            disabled={loading}
            className="group flex items-center gap-2 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full transition-all border border-primary/20 backdrop-blur-md"
        >
            <Bell className={`w-3 h-3 ${loading ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'}`} />
            {loading ? "Enabling..." : "Enable Chat Notifications"}
        </button>
    );
}
