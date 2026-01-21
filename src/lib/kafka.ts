/**
 * Kafka Utility using Upstash REST API
 * This allows for high-performance, asynchronous logging and event processing
 * without blocking the main request cycle.
 */

export const kafka = {
    async publish(topic: string, message: any) {
        const url = process.env.KAFKA_REST_URL;
        const token = process.env.KAFKA_REST_TOKEN;

        if (!url || !token) {
            // Silently fail if Kafka is not configured
            // This ensures the app keeps working even without Kafka
            return;
        }

        try {
            // Asynchronously send to Kafka without 'await' to improve performance in the caller
            fetch(`${url}/produce/${topic}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ value: JSON.stringify(message) }),
            }).catch(err => console.error("Kafka Publish Error:", err));

            // We don't await the fetch so the main thread continues immediately
        } catch (error) {
            console.error("Kafka Setup Error:", error);
        }
    }
};

export const KAFKA_TOPICS = {
    MESSAGES: 'app_messages',
    VIBE_EVENTS: 'vibe_events',
    SYSTEM_LOGS: 'system_logs',
};
