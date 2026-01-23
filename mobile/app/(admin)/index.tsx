import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';
import { adminApi, chatApi } from '@/lib/api';
import { Activity, Music, MessageSquare, Zap, Settings, Play, Square, CloudRain, CloudSnow, Heart, Sparkles, Send, X } from 'lucide-react-native';
import { usePusher } from '@/hooks/usePusher';

import { Audio } from 'expo-av';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState<any[]>([]);
    const [songs, setSongs] = useState<any[]>([]);
    const [vibeSettings, setVibeSettings] = useState({
        isPlaying: false,
        effect: 'none',
        currentIndex: 0
    });
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    // Chat State
    const [chatUser, setChatUser] = useState<'sajid' | 'nasywa'>('sajid');
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');

    useEffect(() => {
        loadData();
        return () => {
            // Cleanup sound
            if (sound) sound.unloadAsync();
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'chat') {
            loadMessages();
        }
    }, [activeTab, chatUser]);

    const loadData = async () => {
        try {
            const songsRes = await adminApi.getSongs();
            setSongs(songsRes.data || []);
            // Mock stats if API fails or is missing
            setStats([
                { label: "Total Users", value: "2", icon: Activity, color: "#3b82f6" },
                { label: "Active Keys", value: "5", icon: Settings, color: "#10b981" },
            ]);
        } catch (e) {
            console.error('Error loading admin data', e);
        }
    };

    const loadMessages = async () => {
        try {
            const res = await chatApi.getMessages('admin', chatUser);
            setMessages(res.data);
        } catch (e) { console.error(e); }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;
        const msg = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'admin',
            receiver: chatUser,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, msg]);
        setInputText('');
        try {
            await chatApi.sendMessage('admin', chatUser, msg);
        } catch (e) { console.error(e); }
    };

    const playLocalMusic = async (index: number) => {
        if (sound) {
            await sound.unloadAsync();
        }
        if (songs[index] && songs[index].url) {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: songs[index].url },
                { shouldPlay: true, isLooping: true }
            );
            setSound(newSound);
        }
    };

    const stopLocalMusic = async () => {
        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
        }
    };

    const broadcastMusic = async (updates: any) => {
        const newState = { ...vibeSettings, ...updates };

        // Handle Local Playback
        if (updates.isPlaying === true || (updates.currentIndex !== undefined && newState.isPlaying)) {
            await playLocalMusic(updates.currentIndex !== undefined ? updates.currentIndex : vibeSettings.currentIndex);
        } else if (updates.isPlaying === false) {
            await stopLocalMusic();
        }

        await adminApi.broadcastMusic({
            ...newState,
            chatKey: 'nasywa-sajid', // Standard key
            playlist: songs
        });
        setVibeSettings(prev => ({ ...prev, ...updates }));
    };

    const renderOverview = () => (
        <View style={styles.grid}>
            {stats.map((s, i) => (
                <View key={i} style={[styles.card, { borderLeftColor: s.color, borderLeftWidth: 4 }]}>
                    <s.icon size={24} color={s.color} />
                    <View style={{ marginLeft: 16 }}>
                        <Text style={styles.cardValue}>{s.value}</Text>
                        <Text style={styles.cardLabel}>{s.label}</Text>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderVibes = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Music Control</Text>
            <View style={styles.row}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.playButton]}
                    onPress={() => broadcastMusic({ isPlaying: true })}
                >
                    <Play fill="white" size={24} color="white" />
                    <Text style={styles.btnText}>Play</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.stopButton]}
                    onPress={() => broadcastMusic({ isPlaying: false })}
                >
                    <Square fill="white" size={24} color="white" />
                    <Text style={styles.btnText}>Stop</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Background Effects</Text>
            <View style={styles.effectGrid}>
                {[
                    { id: 'rain', icon: CloudRain, color: '#3b82f6' },
                    { id: 'snow', icon: CloudSnow, color: '#a5f3fc' },
                    { id: 'hearts', icon: Heart, color: '#ec4899' },
                    { id: 'sparkles', icon: Sparkles, color: '#fbbf24' },
                    { id: 'none', icon: X, color: '#64748b' }
                ].map((eff) => (
                    <TouchableOpacity
                        key={eff.id}
                        style={[styles.effectCard, vibeSettings.effect === eff.id && styles.activeEffect]}
                        onPress={() => broadcastMusic({ effect: eff.id })}
                    >
                        {eff.id === 'none' ? <Text style={{ fontSize: 24 }}>❌</Text> : <eff.icon size={32} color={eff.color} />}
                        <Text style={styles.effectLabel}>{eff.id}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderSongs = () => (
        <View style={styles.section}>
            <ScrollView style={{ maxHeight: 400 }}>
                {songs.map((song, i) => (
                    <TouchableOpacity
                        key={i}
                        style={[styles.songItem, vibeSettings.currentIndex === i && styles.activeSong]}
                        onPress={() => broadcastMusic({ currentIndex: i, isPlaying: true })}
                    >
                        <Music size={20} color={vibeSettings.currentIndex === i ? "#8b5cf6" : "#666"} />
                        <Text style={[styles.songTitle, vibeSettings.currentIndex === i && styles.activeSongText]}>
                            {song.title}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderChat = () => (
        <View style={{ flex: 1 }}>
            <View style={styles.chatHeader}>
                <TouchableOpacity
                    style={[styles.chatTab, chatUser === 'sajid' && styles.activeChatTab]}
                    onPress={() => setChatUser('sajid')}
                >
                    <Text style={[styles.chatTabText, chatUser === 'sajid' && { color: '#8b5cf6' }]}>Sajid</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.chatTab, chatUser === 'nasywa' && styles.activeChatTab]}
                    onPress={() => setChatUser('nasywa')}
                >
                    <Text style={[styles.chatTabText, chatUser === 'nasywa' && { color: '#8b5cf6' }]}>Nasywa</Text>
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.chatArea}>
                {messages.map((m, i) => (
                    <View key={i} style={[
                        styles.msgBubble,
                        m.sender === 'admin' ? styles.msgMe : styles.msgThem
                    ]}>
                        <Text style={m.sender === 'admin' ? { color: 'white' } : { color: '#333' }}>{m.text}</Text>
                    </View>
                ))}
            </ScrollView>
            <View style={styles.inputArea}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type a message..."
                />
                <TouchableOpacity onPress={handleSendMessage}>
                    <Send size={24} color="#8b5cf6" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const TABS = [
        { id: 'overview', icon: Activity, label: 'Overview' },
        { id: 'vibes', icon: Zap, label: 'Vibes' },
        { id: 'songs', icon: Music, label: 'Songs' },
        { id: 'chat', icon: MessageSquare, label: 'Chat' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[styles.tabItem, activeTab === tab.id && styles.activeTab]}
                        onPress={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={20} color={activeTab === tab.id ? '#8b5cf6' : '#64748b'} />
                        <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'vibes' && renderVibes()}
                {activeTab === 'songs' && renderSongs()}
                {activeTab === 'chat' && renderChat()}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#09090b' },
    tabBar: { flexDirection: 'row', backgroundColor: '#09090b', padding: 10, justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#27272a' },
    tabItem: { alignItems: 'center', gap: 4, padding: 8, borderRadius: 12 },
    activeTab: { backgroundColor: '#27272a' },
    tabLabel: { fontSize: 12, color: '#a1a1aa' },
    activeTabLabel: { color: 'white', fontWeight: 'bold' },
    content: { padding: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    card: { width: '47%', backgroundColor: '#18181b', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#27272a' },
    cardValue: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    cardLabel: { fontSize: 12, color: '#a1a1aa' },
    section: { backgroundColor: '#18181b', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#27272a', marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: 'white' },
    row: { flexDirection: 'row', gap: 16 },
    actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 8 },
    playButton: { backgroundColor: '#059669' },
    stopButton: { backgroundColor: '#dc2626' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    effectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 },
    effectCard: { width: '30%', aspectRatio: 1, backgroundColor: '#27272a', borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#3f3f46' },
    activeEffect: { borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.2)' },
    effectLabel: { fontSize: 10, fontWeight: 'bold', textTransform: 'capitalize', color: 'white' },
    songItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#27272a', gap: 12 },
    activeSong: { backgroundColor: '#27272a' },
    activeSongText: { color: '#8b5cf6', fontWeight: 'bold' },
    songTitle: { fontSize: 14, color: '#e4e4e7' },
    chatHeader: { flexDirection: 'row', marginBottom: 16 },
    chatTab: { flex: 1, padding: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#27272a' },
    activeChatTab: { borderBottomColor: '#8b5cf6' },
    chatTabText: { fontWeight: 'bold', color: '#71717a' },
    chatArea: { height: 300, backgroundColor: '#09090b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
    msgBubble: { padding: 10, borderRadius: 12, marginBottom: 8, maxWidth: '80%' },
    msgMe: { alignSelf: 'flex-end', backgroundColor: '#27272a', borderWidth: 1, borderColor: '#3f3f46' },
    msgThem: { alignSelf: 'flex-start', backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a' },
    inputArea: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    input: { flex: 1, backgroundColor: '#18181b', padding: 12, borderRadius: 24, borderWidth: 1, borderColor: '#27272a', color: 'white' },
});
