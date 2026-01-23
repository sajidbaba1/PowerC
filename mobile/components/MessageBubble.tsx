import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Lock, Check, CheckCheck, Clock, Play, Reply, Copy, Trash2 } from 'lucide-react-native';
import { format } from 'date-fns';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

interface MessageBubbleProps {
    msg: any;
    userRole: string;
    onDelete?: (id: string, everyone: boolean) => void;
    onReply?: (msg: any) => void;
}

const MessageBubble = React.memo(({ msg, userRole, onDelete, onReply }: MessageBubbleProps) => {
    const isMe = msg.sender === userRole;
    const [sound, setSound] = React.useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [showMenu, setShowMenu] = React.useState(false);

    // Swipe gesture animation
    const translateX = React.useRef(new Animated.Value(0)).current;
    const SWIPE_THRESHOLD = 60;

    React.useEffect(() => {
        return () => {
            if (sound) sound.unloadAsync();
        };
    }, [sound]);

    const playAudio = async () => {
        if (!msg.audioUrl) return;
        try {
            if (sound) {
                // If already loaded/playing, stop and unload to restart or just stop?
                // Simple toggle: if playing, stop. If not, play.
                // But current logic re-creates sound every time for simplicity to ensure clean state
                await sound.unloadAsync();
                setSound(null);
                setIsPlaying(false);
                // If we want to toggle pause, we need more state. Let's keep it simple: Stop if clicked while playing.
                return;
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: msg.audioUrl },
                { shouldPlay: true }
            );
            setSound(newSound);
            setIsPlaying(true);

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                    setSound(null);
                    // newSound.unloadAsync(); // Optional: unload immediately or wait for cleanup
                }
            });
        } catch (error) {
            console.error('Error playing audio', error);
        }
    };

    const isUnlocked = () => {
        if (msg.type !== "secret" || isMe) return true;
        if (!msg.unlockAt) return true;
        return false;
    };

    const handleLongPress = () => {
        if (msg.type === 'deleted') return;
        setShowMenu(!showMenu);
    };

    const handleDelete = (everyone: boolean) => {
        if (onDelete) onDelete(msg.id, everyone);
        setShowMenu(false);
    };

    const handleCopy = () => {
        if (msg.text) {
            import('react-native').then(({ Clipboard }) => {
                Clipboard.setString(msg.text);
            });
        }
        setShowMenu(false);
    };

    const handleReply = () => {
        if (onReply) onReply(msg);
        setShowMenu(false);
    };

    const onGestureEvent = Animated.event(
        [{ nativeEvent: { translationX: translateX } }],
        { useNativeDriver: true }
    );

    const onHandlerStateChange = (event: any) => {
        if (event.nativeEvent.state === State.END) {
            const { translationX } = event.nativeEvent;

            // Trigger reply if swiped past threshold
            if (Math.abs(translationX) > SWIPE_THRESHOLD) {
                handleReply();
            }

            // Reset animation
            Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 10,
            }).start();
        }
    };

    if (msg.type === 'deleted') {
        return (
            <View style={[styles.container, isMe ? styles.myContainer : styles.theirContainer]}>
                {!isMe && (
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{msg.sender.charAt(0).toUpperCase()}</Text>
                    </View>
                )}
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble, { opacity: 0.6 }]}>
                    <Text style={[styles.messageText, { fontStyle: 'italic', color: '#a1a1aa' }]}>This message was deleted</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={{ position: 'relative' }}>
            {/* Reply Icon Indicator */}
            <Animated.View
                style={[
                    styles.replyIconContainer,
                    {
                        opacity: translateX.interpolate({
                            inputRange: isMe ? [-SWIPE_THRESHOLD, 0] : [0, SWIPE_THRESHOLD],
                            outputRange: [1, 0],
                            extrapolate: 'clamp',
                        }),
                        [isMe ? 'right' : 'left']: 10,
                    },
                ]}
            >
                <Reply size={24} color="#8b5cf6" />
            </Animated.View>

            <PanGestureHandler
                onGestureEvent={onGestureEvent}
                onHandlerStateChange={onHandlerStateChange}
                activeOffsetX={isMe ? [-20, 20] : [-20, 20]}
            >
                <Animated.View
                    style={{
                        transform: [{
                            translateX: translateX.interpolate({
                                inputRange: isMe ? [-100, 0] : [0, 100],
                                outputRange: isMe ? [-50, 0] : [0, 50],
                                extrapolate: 'clamp',
                            }),
                        }],
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onLongPress={handleLongPress}
                        style={[styles.container, isMe ? styles.myContainer : styles.theirContainer]}
                    >
                        {/* Sender Avatar (Only for received messages) */}
                        {!isMe && (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{msg.sender.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}

                        <View style={[
                            styles.bubble,
                            isMe ? styles.myBubble : styles.theirBubble,
                            msg.type === 'sticker' && { backgroundColor: 'transparent', borderWidth: 0, padding: 0 }
                        ]}>
                            {/* Reply to Message Preview */}
                            {msg.replyToMsg && (
                                <View style={[
                                    styles.replyInBubble,
                                    { backgroundColor: isMe ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)' }
                                ]}>
                                    <View style={styles.replyLineInBubble} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.replyNameInBubble}>
                                            {msg.replyToMsg.sender === userRole ? 'You' : (msg.replyToMsg.sender === 'sajid' ? 'Sajid' : 'Nasywa')}
                                        </Text>
                                        <Text style={styles.replyTextInBubble} numberOfLines={1}>
                                            {msg.replyToMsg.text || (msg.replyToMsg.imageUrl ? 'Photo' : (msg.replyToMsg.audioUrl ? 'Voice Message' : 'Message'))}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            {/* Sticker Type */}
                            {msg.type === 'sticker' ? (
                                <Text style={styles.stickerText}>{msg.text}</Text>
                            ) : msg.type === 'secret' && !isUnlocked() ? (
                                <View style={styles.lockedContainer}>
                                    <Lock size={24} color="#f59e0b" />
                                    <Text style={styles.lockedText}>LOCKED MESSAGE</Text>
                                    <Text style={styles.unlockTime}>UNLOCKS AT {msg.unlockAt || '??:??'}</Text>
                                </View>
                            ) : (
                                <>
                                    {/* Image Support */}
                                    {msg.imageUrl && (
                                        <Image source={{ uri: msg.imageUrl }} style={styles.messageImage} />
                                    )}

                                    {/* Audio Message */}
                                    {msg.type === 'audio' ? (
                                        <View style={styles.audioBubble}>
                                            <TouchableOpacity style={styles.playBtn} onPress={playAudio}>
                                                {isPlaying ? (
                                                    <View style={{ width: 12, height: 12, backgroundColor: isMe ? '#8b5cf6' : 'white', borderRadius: 2 }} />
                                                ) : (
                                                    <Play size={20} color={isMe ? "#8b5cf6" : "white"} fill={isMe ? "#8b5cf6" : "white"} />
                                                )}
                                            </TouchableOpacity>
                                            <Image
                                                style={styles.waveVisual}
                                                source={{ uri: 'https://img.icons8.com/ios-filled/50/ffffff/audio-wave.png' }}
                                                resizeMode="contain"
                                            />
                                            <Text style={styles.duration}>0:15</Text>
                                        </View>
                                    ) : null}

                                    {/* Text Message */}
                                    {msg.text && msg.type !== 'sticker' && msg.type !== 'audio' && (
                                        <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
                                            {msg.text}
                                        </Text>
                                    )}

                                    {/* Translation */}
                                    {msg.translation && msg.translation !== msg.text && (
                                        <View style={styles.translationContainer}>
                                            <View style={styles.translationLine} />
                                            <Text style={styles.translationText}>{msg.translation}</Text>
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Reactions (Simple badges) */}
                            {msg.reactions && msg.reactions.length > 0 && (
                                <View style={styles.reactionsContainer}>
                                    {msg.reactions.map((r: any, i: number) => (
                                        <View key={i} style={styles.reactionBadge}>
                                            <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Footer: Time and Status */}
                            <View style={styles.footer}>
                                <Text style={styles.timestamp}>
                                    {format(new Date(msg.createdAt || Date.now()), 'HH:mm')}
                                </Text>
                                {isMe && (
                                    <View style={styles.statusIcon}>
                                        {msg.status === 'read' ? (
                                            <CheckCheck size={12} color="#ace0f9" />
                                        ) : (
                                            <Check size={12} color="rgba(255,255,255,0.5)" />
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Context Menu for Deletion & Actions */}
                    {showMenu && (
                        <View style={[styles.menu, isMe ? { position: 'absolute', bottom: -50, right: 10 } : { position: 'absolute', bottom: -50, left: 50 }]}>
                            <TouchableOpacity style={styles.menuItem} onPress={handleReply}>
                                <Text style={styles.menuText}>Reply</Text>
                            </TouchableOpacity>
                            <View style={styles.menuDivider} />

                            {msg.text && (
                                <>
                                    <TouchableOpacity style={styles.menuItem} onPress={handleCopy}>
                                        <Text style={styles.menuText}>Copy</Text>
                                    </TouchableOpacity>
                                    <View style={styles.menuDivider} />
                                </>
                            )}

                            {isMe && (
                                <>
                                    <TouchableOpacity style={styles.menuItem} onPress={() => handleDelete(true)}>
                                        <Text style={styles.menuText}>Delete for Everyone</Text>
                                    </TouchableOpacity>
                                    <View style={styles.menuDivider} />
                                </>
                            )}

                            <TouchableOpacity style={styles.menuItem} onPress={() => handleDelete(false)}>
                                <Text style={styles.menuText}>Delete for Me</Text>
                            </TouchableOpacity>
                            <View style={styles.menuDivider} />
                            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
                                <Text style={[styles.menuText, { color: '#ef4444' }]}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </PanGestureHandler>
        </View>
    );
});

export default MessageBubble;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: 12,
        maxWidth: '85%',
    },
    myContainer: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    theirContainer: {
        alignSelf: 'flex-start',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: '#27272a',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    avatarText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    bubble: {
        padding: 12,
        borderRadius: 22,
    },
    myBubble: {
        backgroundColor: '#000000', // Solid black/darkest grey for sent
        borderTopRightRadius: 4,
        borderWidth: 1,
        borderColor: '#27272a',
    },
    theirBubble: {
        backgroundColor: '#18181b', // Dark grey for received
        borderTopLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#27272a',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    myText: {
        color: 'white',
        fontWeight: '600',
    },
    theirText: {
        color: '#e4e4e7', // Zinc 200
        fontWeight: '600',
    },
    messageImage: {
        width: width * 0.6,
        height: width * 0.6,
        borderRadius: 15,
        marginBottom: 8,
        backgroundColor: '#27272a',
    },
    stickerText: {
        fontSize: 50,
        textAlign: 'center',
        color: '#ffffff',
        lineHeight: 60,
    },
    lockedContainer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#27272a',
        borderRadius: 15,
    },
    lockedText: {
        color: '#f59e0b',
        fontWeight: 'bold',
        fontSize: 12,
        marginTop: 8,
        letterSpacing: 1,
    },
    unlockTime: {
        color: '#a1a1aa',
        fontSize: 10,
        marginTop: 4,
    },
    translationContainer: {
        marginTop: 8,
        paddingTop: 8,
    },
    translationLine: {
        height: 1,
        backgroundColor: '#3f3f46', // Zinc 700
        marginBottom: 6,
    },
    translationText: {
        fontSize: 13,
        color: '#a1a1aa', // Zinc 400
        fontStyle: 'italic',
    },
    reactionsContainer: {
        flexDirection: 'row',
        marginTop: 8,
        flexWrap: 'wrap',
        gap: 4,
    },
    reactionBadge: {
        backgroundColor: '#27272a',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: '#3f3f46',
    },
    reactionEmoji: {
        fontSize: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    timestamp: {
        fontSize: 10,
        color: '#71717a', // Zinc 500
    },
    statusIcon: {
        marginLeft: 4,
    },
    audioBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 200,
        gap: 10,
    },
    playBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    waveVisual: {
        flex: 1,
        height: 20,
        tintColor: 'white', // Ensure it respects theme
        opacity: 0.8,
    },
    duration: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: 'bold',
    },
    menu: {
        backgroundColor: '#18181b',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: '#3f3f46',
        minWidth: 160,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    menuItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    menuText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#27272a',
    },
    replyInBubble: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 6,
        marginBottom: 8,
        minWidth: 100,
    },
    replyLineInBubble: {
        width: 3,
        height: '100%',
        backgroundColor: '#8b5cf6',
        borderRadius: 2,
        marginRight: 8,
    },
    replyNameInBubble: {
        color: '#8b5cf6',
        fontSize: 11,
        fontWeight: 'bold',
    },
    replyTextInBubble: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
    },
    replyIconContainer: {
        position: 'absolute',
        top: '50%',
        marginTop: -12,
        zIndex: -1,
    },
});
