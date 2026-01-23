import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Modal, RefreshControl, Image, Keyboard } from 'react-native';
import { Audio } from 'expo-av';
import { chatApi, uploadImage, uploadAudio, profileApi, callApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { usePusher } from '@/hooks/usePusher';
import * as ImagePicker from 'expo-image-picker';
import { Send, Image as ImageIcon, Smile, Phone, Video, Mic, MicOff, VideoOff, ChevronDown, X } from 'lucide-react-native';
import MessageBubble from '@/components/MessageBubble';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatScreen() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [showStickers, setShowStickers] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showScrollDown, setShowScrollDown] = useState(false);
    const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null);
    const [replyTo, setReplyTo] = useState<any | null>(null);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Call State
    const [isCallActive, setIsCallActive] = useState(false);
    const [callType, setCallType] = useState<'audio' | 'video'>('audio');

    // Recording State
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState('0:00');
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const durationCount = useRef(0);

    const flatListRef = useRef<FlatList>(null);

    const STICKERS = ['❤️', '🫂', '😊', '😍', '😘', '🔥', '✨', '🥺', '😴', '💕'];

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSubscription = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
        const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    // Derived state for chat key
    const partnerRole = user?.role === 'sajid' ? 'nasywa' : 'sajid';
    // Ensure accurate channel name: alphabetical order
    const chatKey = user ? [user.role, partnerRole].sort().join('-') : '';

    const startCall = async (type: 'audio' | 'video') => {
        setCallType(type);
        setIsCallActive(true);
        try {
            await callApi.signal({
                sender: user?.role,
                receiver: partnerRole,
                type: 'offer',
                data: { callType: type }
            });
        } catch (e) {
            console.error('Call Signal Error', e);
        }
    };

    usePusher(chatKey, 'call-signal', (data) => {
        if (data.sender !== user?.role && data.type === 'offer') {
            setIsCallActive(true);
            setCallType(data.data?.callType || 'audio');
        }
    });

    const fetchMessages = async () => {
        try {
            if (!user) return;
            const response = await chatApi.getMessages(user.role, partnerRole);
            setMessages(response.data);

            // Fetch partner profile for avatar
            const profiles = await profileApi.getProfiles();
            const partner = profiles.data.find((p: any) => p.role === partnerRole);
            const myProfile = profiles.data.find((p: any) => p.role === user.role);

            if (partner?.avatarUrl) {
                setPartnerAvatar(partner.avatarUrl);
            }

            // Update hometowns if not set (Sajid from Pune, Nasywa from Banda Aceh)
            if (user.role === 'sajid' && !myProfile?.hometown) {
                profileApi.updateHometown('sajid', 'Pune', 'India');
            } else if (user.role === 'nasywa' && !myProfile?.hometown) {
                profileApi.updateHometown('nasywa', 'Banda Aceh', 'Indonesia');
            }

            // Register Push Token safely
            import('@/lib/notifications').then(async ({ registerForPushNotificationsAsync }) => {
                try {
                    const token = await registerForPushNotificationsAsync();
                    if (token && user?.role) {
                        await profileApi.updatePushToken(user.role, token);
                    }
                } catch (e) {
                    console.warn("⚠️ Push token registration failed:", e);
                }
            }).catch(err => console.error("❌ Notification module load error:", err));
        } catch (error: any) {
            console.error('❌ Error fetching chat data:', error.message || error);
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', JSON.stringify(error.response.data));
            }
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMessages();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchMessages();
        return () => {
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [user]);

    // Real-time listener for new messages
    usePusher(chatKey, 'new-message', (newMessage) => {
        setMessages((prev) => {
            const exists = prev.find(m => m.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
        });
        setIsPartnerTyping(false); // Stop typing indicator when message arrives
    });

    // Listen for typing events
    usePusher(chatKey, 'typing', (data) => {
        if (data.role !== user?.role) {
            setIsPartnerTyping(data.isTyping);
        }
    });

    // Listen for message deletions
    usePusher(chatKey, 'message-deleted', (data) => {
        setMessages((prev) => prev.map(m => {
            if (m.id === data.id) {
                if (data.deleteForEveryone) {
                    return { ...m, text: "This message was deleted", type: 'deleted', imageUrl: null, audioUrl: null, translation: null };
                } else if (data.targetUser === user?.role) {
                    // Hidden for this user only
                    // We can either filter it out or mark it. WhatsApp just removes it.
                    // For simplicity, let's mark it as hidden and filter in rendering if needed, or just filter it out now.
                    // To truly remove it from state:
                    return null;
                }
            }
            return m;
        }).filter(Boolean)); // Remove nulls
    });

    const handleDeleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
        try {
            await chatApi.deleteMessage(messageId, user?.role!, chatKey, deleteForEveryone);
            // Optimistic update
            setMessages(prev => prev.map(m => {
                if (m.id === messageId) {
                    if (deleteForEveryone) {
                        return { ...m, text: "This message was deleted", type: 'deleted', imageUrl: null, audioUrl: null, translation: null };
                    } else {
                        return null;
                    }
                }
                return m;
            }).filter(Boolean));
        } catch (e) {
            console.error('Delete failed', e);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            // @ts-ignore
            mediaTypes: ImagePicker.MediaType ? ImagePicker.MediaType.Images : 'Images',
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setIsUploading(true);
            try {
                const imageUrl = await uploadImage(result.assets[0].uri);
                await handleSend('image', imageUrl);
            } catch (error) {
                console.error('Failed to upload image', error);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const startRecording = async () => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status === 'granted') {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );

                setRecording(recording);
                setIsRecording(true);
                durationCount.current = 0;
                setRecordingDuration('0:00');

                recordingTimerRef.current = setInterval(() => {
                    durationCount.current += 1;
                    const mins = Math.floor(durationCount.current / 60);
                    const secs = durationCount.current % 60;
                    setRecordingDuration(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
                }, 1000) as unknown as NodeJS.Timeout;
            }
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        setIsRecording(false);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

            if (uri) {
                setIsUploading(true);
                // Upload audio
                const audioUrl = await uploadAudio(uri);
                await handleSend('audio', audioUrl);
            }
        } catch (error) {
            console.error('Failed to send audio', error);
        } finally {
            setRecording(null);
            setIsUploading(false);
        }
    };


    const handleSend = async (type = 'text', content = '') => {
        const textToSend = type === 'text' ? inputText : content;
        if ((!textToSend && type === 'text') || !user) return;

        const optimisticMsg = {
            id: Date.now().toString(),
            text: type === 'text' || type === 'sticker' ? textToSend : (type === 'audio' ? 'Voice Message' : ''),
            imageUrl: type === 'image' ? content : undefined,
            audioUrl: type === 'audio' ? content : undefined,
            sender: user.role,
            receiver: partnerRole,
            type: type,
            status: 'sending',
            createdAt: new Date().toISOString(),
            parentId: replyTo?.id
        };

        // Append optimistic message
        setMessages(prev => [...prev, optimisticMsg]);

        if (type === 'text') setInputText('');
        if (type === 'sticker') setShowStickers(false);
        setReplyTo(null);

        // Stop typing indicator
        chatApi.sendTyping(user.role, chatKey, false);

        try {
            await chatApi.sendMessage(user.role, partnerRole, optimisticMsg);
        } catch (error: any) {
            console.error('❌ Error sending message:', error.message || error);
            // Revert optimistic update (simplified: mark as failed)
            setMessages(prev => prev.map(m =>
                m.id === optimisticMsg.id ? { ...m, status: 'error' } : m
            ));
        }
    };


    // Scroll to bottom (visually offset 0)
    const scrollToBottom = () => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        setShowScrollDown(false);
    };

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        // In inverted list, offsetY > 0 means we are scrolled "up" into history.
        if (offsetY > 300) {
            if (!showScrollDown) setShowScrollDown(true);
        } else {
            if (showScrollDown) setShowScrollDown(false);
        }
    };

    const handleReply = (msg: any) => {
        setReplyTo(msg);
    };

    const renderItem = ({ item }: { item: any }) => {
        const replyToMsg = item.parentId ? messages.find(m => m.id === item.parentId) : null;
        return (
            <MessageBubble
                msg={{ ...item, replyToMsg }}
                userRole={user?.role || ''}
                onDelete={handleDeleteMessage}
                onReply={handleReply}
            />
        );
    };

    const partnerName = user?.role === 'sajid' ? 'Nasywa' : 'Sajid';

    const sortedMessages = useMemo(() => {
        return [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [messages]);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f172a', '#1e1b4b']}
                style={styles.background}
            />

            {/* Fancy Header */}
            <BlurView intensity={90} tint="dark" style={styles.header}>
                <View style={styles.headerInfo}>
                    <LinearGradient
                        colors={user?.role === 'sajid' ? ['#ec4899', '#db2777'] : ['#3b82f6', '#2563eb']}
                        style={styles.avatar}
                    >
                        {partnerAvatar ? (
                            <Image source={{ uri: partnerAvatar }} style={styles.fullSize} />
                        ) : (
                            <Text style={styles.avatarText}>{partnerName[0]}</Text>
                        )}
                    </LinearGradient>
                    <View>
                        <Text style={styles.headerName}>{partnerName}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.onlineBadge} />
                            <Text style={styles.headerStatus}>
                                {isPartnerTyping ? 'typing...' : 'Online'}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerBtn} onPress={() => startCall('audio')}>
                        <Phone size={22} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerBtn} onPress={() => startCall('video')}>
                        <Video size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </BlurView>

            {/* Keyboard Avoiding Wrapper */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                style={{ flex: 1 }}
            >
                <View style={{ flex: 1 }}>
                    <FlatList
                        ref={flatListRef}
                        data={sortedMessages}
                        inverted
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        initialNumToRender={15}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#fff"
                                colors={['#8b5cf6']}
                                progressBackgroundColor="#1e1b4b"
                            />
                        }
                    />

                    {showScrollDown && (
                        <TouchableOpacity
                            style={styles.scrollDownFab}
                            onPress={scrollToBottom}
                            activeOpacity={0.8}
                        >
                            <ChevronDown size={24} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

                <BlurView intensity={80} tint="dark" style={[styles.inputArea, isKeyboardVisible && { paddingBottom: 10 }]}>
                    {replyTo && (
                        <View style={styles.replyPreviewContainer}>
                            <View style={styles.replyPreviewLine} />
                            <View style={styles.replyPreviewContent}>
                                <Text style={styles.replyPreviewName}>
                                    Replying to {replyTo.sender === user?.role ? 'Yourself' : (replyTo.sender === 'sajid' ? 'Sajid' : 'Nasywa')}
                                </Text>
                                <Text style={styles.replyPreviewText} numberOfLines={1}>
                                    {replyTo.text || (replyTo.imageUrl ? 'Photo' : (replyTo.audioUrl ? 'Voice Message' : 'Message'))}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setReplyTo(null)}>
                                <X size={20} color="rgba(255,255,255,0.6)" />
                            </TouchableOpacity>
                        </View>
                    )}
                    {showStickers && (
                        <View style={styles.stickerGrid}>
                            {STICKERS.map(s => (
                                <TouchableOpacity key={s} onPress={() => handleSend('sticker', s)}>
                                    <Text style={styles.stickerItem}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={styles.inputRow}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => setShowStickers(!showStickers)}
                        >
                            <Smile size={24} color={showStickers ? '#8b5cf6' : 'rgba(255,255,255,0.6)'} />
                        </TouchableOpacity>

                        {isRecording ? (
                            <View style={styles.recordingArea}>
                                <Text style={styles.recordingText}>Recording...</Text>
                                <Text style={styles.recordingTimer}>{recordingDuration || '0:00'}</Text>
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={pickImage}
                                    disabled={isUploading}
                                >
                                    <ImageIcon size={24} color={isUploading ? '#8b5cf6' : 'rgba(255,255,255,0.6)'} />
                                </TouchableOpacity>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Type your heart out..."
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={inputText}
                                    onChangeText={(text) => {
                                        setInputText(text);
                                        // Send typing indicator
                                        if (user && text.length > 0) {
                                            chatApi.sendTyping(user.role, chatKey, true);
                                            // Clear previous timeout
                                            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                                            // Set timeout to stop typing after 2 seconds of inactivity
                                            typingTimeoutRef.current = setTimeout(() => {
                                                chatApi.sendTyping(user.role, chatKey, false);
                                            }, 2000);
                                        }
                                    }}
                                    multiline
                                    onFocus={() => setShowStickers(false)}
                                />
                            </>
                        )}

                        {isRecording ? (
                            <TouchableOpacity
                                style={[styles.sendButton, { backgroundColor: '#ef4444' }]}
                                onPress={stopRecording}
                            >
                                <Send size={20} color="white" />
                            </TouchableOpacity>
                        ) : inputText.trim() ? (
                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={() => handleSend('text')}
                            >
                                <Send size={20} color="white" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={startRecording}
                            >
                                <Mic size={24} color="rgba(255,255,255,0.6)" />
                            </TouchableOpacity>
                        )}
                    </View>
                </BlurView>
            </KeyboardAvoidingView>

            {/* Call Overlay (Mock) */}
            <Modal visible={isCallActive} animationType="slide" transparent>
                <View style={styles.callOverlay}>
                    <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
                    <LinearGradient
                        colors={['rgba(15, 23, 42, 0.9)', 'rgba(88, 28, 135, 0.8)']}
                        style={styles.callGradient}
                    >
                        <View style={styles.callHeader}>
                            <Text style={styles.callStatus}>Calling...</Text>
                            <Text style={styles.callName}>{partnerName}</Text>
                        </View>

                        <View style={styles.callAvatarContainer}>
                            <LinearGradient
                                colors={['#8b5cf6', '#d946ef']}
                                style={styles.callAvatar}
                            >
                                <Text style={styles.callAvatarText}>{partnerName[0]}</Text>
                            </LinearGradient>
                            <View style={styles.ripple} />
                        </View>

                        <View style={styles.callControls}>
                            <TouchableOpacity style={styles.controlBtn}>
                                <MicOff size={24} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.controlBtn}>
                                <VideoOff size={24} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.controlBtn, styles.hangupBtn]}
                                onPress={() => setIsCallActive(false)}
                            >
                                <Phone size={32} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b', // Matte Black
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#09090b', // Solid Matte Black instead of Gradient
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#27272a', // Dark border
        backgroundColor: '#09090b', // Solid Matte Black
        zIndex: 10,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#27272a', // Dark grey avatar bg
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    fullSize: {
        width: '100%',
        height: '100%',
    },
    headerName: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerStatus: {
        color: '#4ade80', // Green for online
        fontSize: 12,
    },
    onlineBadge: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ade80',
        marginRight: 5,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 20,
    },
    headerBtn: {
        padding: 8,
        // backgroundColor: 'transparent', // Minimalist buttons
        borderRadius: 12,
    },
    listContent: {
        padding: 15,
        paddingBottom: 20,
    },
    scrollDownFab: {
        position: 'absolute',
        bottom: 80, // Moved up slightly to clear input
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#27272a', // Dark grey FAB
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3f3f46',
    },
    inputArea: {
        paddingBottom: Platform.OS === 'ios' ? 30 : 10,
        paddingTop: 10,
        backgroundColor: '#09090b', // Solid Matte Black
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: '#09090b',
    },
    iconButton: {
        padding: 10,
    },
    input: {
        flex: 1,
        backgroundColor: '#27272a', // Dark grey input pill
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 12,
        color: 'white',
        fontSize: 15,
        maxHeight: 100,
        marginHorizontal: 8,
    },
    sendButton: {
        backgroundColor: '#27272a', // Dark grey send button
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledSend: {
        opacity: 0.5,
    },
    stickerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        justifyContent: 'center',
        gap: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
        marginBottom: 10,
    },
    stickerItem: {
        fontSize: 32,
    },
    // Recording UI
    // Reply Preview UI
    replyPreviewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: 'rgba(24, 24, 27, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
    },
    replyPreviewLine: {
        width: 4,
        height: '100%',
        backgroundColor: '#8b5cf6',
        borderRadius: 2,
        marginRight: 10,
    },
    replyPreviewContent: {
        flex: 1,
    },
    replyPreviewName: {
        color: '#8b5cf6',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    replyPreviewText: {
        color: '#a1a1aa',
        fontSize: 13,
    },
    recordingArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: '#27272a',
        borderRadius: 22,
        height: 44,
        marginHorizontal: 8,
    },
    recordingText: {
        color: '#ef4444',
        marginRight: 10,
        fontWeight: 'bold',
    },
    recordingTimer: {
        color: 'white',
        fontWeight: 'bold',
    },
    // Call UI (Updated to match dark theme)
    callOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#09090b',
    },
    callGradient: {
        flex: 1,
        width: '100%',
        justifyContent: 'space-between',
        paddingVertical: 80,
        alignItems: 'center',
        backgroundColor: '#09090b', // Override gradient
    },
    callHeader: {
        alignItems: 'center',
    },
    callStatus: {
        color: '#a1a1aa',
        fontSize: 16,
        marginBottom: 8,
    },
    callName: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    callAvatarContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    callAvatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#27272a',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    callAvatarText: {
        fontSize: 48,
        color: 'white',
        fontWeight: 'bold',
    },
    ripple: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        borderColor: '#3f3f46',
        zIndex: 1,
    },
    callControls: {
        flexDirection: 'row',
        gap: 30,
        alignItems: 'center',
    },
    controlBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#27272a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hangupBtn: {
        backgroundColor: '#ef4444',
        width: 70,
        height: 70,
        borderRadius: 35,
    },
});
