import axios from 'axios';
import { CONFIG } from '@/constants/Config';

const api = axios.create({
    baseURL: CONFIG.API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const profileApi = {
    getProfiles: () => api.get('/api/profiles/all'),
    updateMood: (role: string, mood: string) => api.post('/api/profiles', { role, mood }),
    updateLocation: (role: string, lat: number, lng: number) => api.post('/api/profiles', { role, latitude: lat, longitude: lng }),
    updatePushToken: (role: string, token: string) => api.post('/api/profiles', { role, expoPushToken: token }),
    updateHometown: (role: string, hometown: string, country: string) => api.post('/api/profiles', { role, hometown, country }),
};

export const chatApi = {
    getMessages: (u1: string, u2: string) => api.get(`/api/messages?user1=${u1}&user2=${u2}`),
    sendMessage: (u1: string, u2: string, msg: any) => api.post('/api/messages', { user1: u1, user2: u2, message: msg }),
    deleteMessage: (messageId: string, userId: string, chatKey: string, deleteForEveryone: boolean) => api.post('/api/chat/messages/delete', { messageId, userId, chatKey, deleteForEveryone }),
    sendTyping: (role: string, chatKey: string, isTyping: boolean) => api.post('/api/chat/typing', { role, chatKey, isTyping }),
};

export const loveNotesApi = {
    getNotes: () => api.get('/api/lovenotes'),
    addNote: (data: any) => api.post('/api/lovenotes', data),
};

export const jarApi = {
    getNotes: () => api.get('/api/jar'),
    addNote: (content: string, author: string) => api.post('/api/jar', { content, author }),
};

export const milestoneApi = {
    getMilestones: () => api.get('/api/milestones'),
};

export const activityApi = {
    addComment: (activityId: string, text: string, user: string) => api.post('/api/activities/comment', { activityId, text, user }),
};

export const adminApi = {
    getStats: () => api.get('/api/admin/stats'), // Assuming this exists or we mock it
    getKeys: () => api.get('/api/admin/keys'),
    getSongs: () => api.get('/api/admin/songs'),
    broadcastMusic: (data: any) => api.post('/api/chat/music', data),
};

export const callApi = {
    signal: (data: any) => api.post('/api/chat/signal', data),
};

export const uploadImage = async (uri: string) => {
    const formData = new FormData();
    formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'upload.jpg',
    } as any);
    formData.append('upload_preset', CONFIG.IMAGES.CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CONFIG.IMAGES.CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
    });
    const data = await response.json();
    return data.secure_url;
};

export const uploadAudio = async (uri: string) => {
    const formData = new FormData();
    formData.append('file', {
        uri,
        type: 'audio/m4a', // Standard iOS/Android recording format usually
        name: 'audio.m4a',
    } as any);
    formData.append('upload_preset', CONFIG.IMAGES.CLOUDINARY_UPLOAD_PRESET);
    // Note: Cloudinary auto-detects resource_type usually, but for raw/video (audio is treated as video often) we might need 'video'
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CONFIG.IMAGES.CLOUDINARY_CLOUD_NAME}/video/upload`, {
        method: 'POST',
        body: formData,
    });
    const data = await response.json();
    return data.secure_url;
};

export default api;
