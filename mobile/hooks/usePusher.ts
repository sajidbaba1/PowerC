import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { CONFIG } from '@/constants/Config';

export function usePusher(channelName: string, eventName: string, onEvent: (data: any) => void) {
    const onEventRef = useRef(onEvent);

    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    useEffect(() => {
        const pusher = new Pusher(CONFIG.PUSHER.key, {
            cluster: CONFIG.PUSHER.cluster,
        });

        const channel = pusher.subscribe(channelName);

        // Use a wrapper to call the current ref
        const eventHandler = (data: any) => {
            if (onEventRef.current) {
                onEventRef.current(data);
            }
        };

        channel.bind(eventName, eventHandler);

        return () => {
            channel.unbind(eventName, eventHandler);
            channel.unsubscribe();
            pusher.disconnect();
        };
    }, [channelName, eventName]);
}
