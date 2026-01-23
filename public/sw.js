self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();

        // "WhatsApp-like" options
        const options = {
            body: data.body,
            icon: data.icon || '/icon.jpg', // App icon
            badge: '/icon.jpg', // Small badge on Android
            vibrate: [200, 100, 200], // Distinctive buzz
            tag: 'power-couple-chat', // Groups messages so they update each other
            renotify: true, // Vibrate again even if replacing an old notification
            data: {
                dateOfArrival: Date.now(),
                url: data.url || '/'
            },
            actions: [
                { action: 'open', title: 'Open Chat' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
