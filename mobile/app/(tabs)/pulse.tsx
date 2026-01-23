import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { activityApi, uploadImage } from '@/lib/api';
import axios from 'axios';
import { CONFIG } from '@/constants/Config';
import { Heart, MessageSquare, Send, Zap, X, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { Modal } from 'react-native';

export default function PulseScreen() {
    const { user } = useAuth();
    const [activities, setActivities] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [inputText, setInputText] = useState('');
    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [commentText, setCommentText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchActivities = async () => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const response = await axios.get(`${CONFIG.API_URL}/api/activities?date=${today}`);
            setActivities(response.data);
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchActivities();
        setRefreshing(false);
    };

    const handleReaction = async (activityId: string, emoji: string) => {
        if (!user) return;
        try {
            await axios.post(`${CONFIG.API_URL}/api/activities/react`, {
                activityId,
                emoji,
                user: user.role,
            });
            fetchActivities();
        } catch (error) {
            console.error('Error reacting:', error);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || !user || !selectedActivity) return;
        try {
            await activityApi.addComment(selectedActivity.id, commentText, user.role);
            setCommentText('');
            // Refresh logic: Optimistically update local state or re-fetch
            fetchActivities();
            // Also update selectedActivity comments locally to show immediately in modal
            const newComment = {
                id: Date.now().toString(),
                text: commentText,
                sender: user.role,
                createdAt: new Date().toISOString()
            };
            setSelectedActivity((prev: any) => ({
                ...prev,
                comments: [...(prev.comments || []), newComment]
            }));
        } catch (error) {
            console.error('Error commenting:', error);
        }
    };

    const openComments = (activity: any) => {
        setSelectedActivity(activity);
        setModalVisible(true);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            // @ts-ignore
            mediaTypes: ImagePicker.MediaType ? ImagePicker.MediaType.Images : 'Images',
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handlePostActivity = async () => {
        if ((!inputText.trim() && !selectedImage) || !user) return;
        setIsUploading(true);
        try {
            let imageUrl = undefined;
            if (selectedImage) {
                imageUrl = await uploadImage(selectedImage);
            }

            await axios.post(`${CONFIG.API_URL}/api/activities`, {
                text: inputText,
                imageUrl,
                sender: user.role,
                date: format(new Date(), 'yyyy-MM-dd'),
            });
            setInputText('');
            setSelectedImage(null);
            fetchActivities();
        } catch (error) {
            console.error('Error posting activity:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const isMe = item.sender === user?.role;
        return (
            <View style={styles.activityCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.senderName}>{item.sender === 'sajid' ? 'Sajid' : 'Nasywa'}</Text>
                    <Text style={styles.timeText}>{format(new Date(item.createdAt), 'HH:mm')}</Text>
                </View>
                <Text style={styles.activityText}>{item.text}</Text>
                {item.imageUrl && (
                    <Image source={{ uri: item.imageUrl }} style={styles.activityImage} />
                )}
                <View style={styles.cardFooter}>
                    <View style={styles.reactions}>
                        {['❤️', '🔥', '✨'].map(emoji => (
                            <TouchableOpacity
                                key={emoji}
                                style={styles.reactionButton}
                                onPress={() => handleReaction(item.id, emoji)}
                            >
                                <Text>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={styles.commentButton} onPress={() => openComments(item)}>
                        <MessageSquare size={18} color="#666" />
                        <Text style={styles.commentCount}>{item.comments?.length || 0}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={activities}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListHeaderComponent={
                    <View style={styles.inputArea}>
                        <TextInput
                            style={styles.input}
                            placeholder="What's happening?"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        {selectedImage && (
                            <View style={styles.previewContainer}>
                                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                                <TouchableOpacity style={styles.removeImage} onPress={() => setSelectedImage(null)}>
                                    <X size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={styles.actionBar}>
                            <TouchableOpacity onPress={pickImage} disabled={isUploading}>
                                <ImageIcon size={24} color="#666" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.postButton, (!inputText.trim() && !selectedImage) && styles.disabledButton]}
                                onPress={handlePostActivity}
                                disabled={isUploading || (!inputText.trim() && !selectedImage)}
                            >
                                <Zap size={20} color="white" />
                                <Text style={styles.postButtonText}>{isUploading ? 'Posting...' : 'Pulse'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Comments</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={selectedActivity?.comments || []}
                            keyExtractor={(item, index) => item.id || index.toString()}
                            renderItem={({ item }) => (
                                <View style={[
                                    styles.commentItem,
                                    item.sender === user?.role ? styles.myComment : styles.theirComment
                                ]}>
                                    <Text style={styles.commentSender}>{item.sender === 'sajid' ? 'Sajid' : 'Nasywa'}</Text>
                                    <Text style={styles.commentText}>{item.text}</Text>
                                    <Text style={styles.commentTime}>{format(new Date(item.createdAt), 'HH:mm')}</Text>
                                </View>
                            )}
                            contentContainerStyle={styles.commentsList}
                            ListEmptyComponent={<Text style={styles.emptyComments}>No comments yet. Be the first!</Text>}
                        />

                        <View style={styles.commentInputArea}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Add a comment..."
                                value={commentText}
                                onChangeText={setCommentText}
                            />
                            <TouchableOpacity onPress={handleAddComment} disabled={!commentText.trim()}>
                                <Send size={24} color={commentText.trim() ? '#ff758c' : '#ccc'} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    listContent: {
        padding: 15,
    },
    inputArea: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    input: {
        fontSize: 16,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    postButton: {
        backgroundColor: '#ff758c',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 15,
        marginTop: 10,
        gap: 8,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    postButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    activityCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    senderName: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333',
    },
    timeText: {
        fontSize: 12,
        color: '#999',
    },
    activityText: {
        fontSize: 16,
        color: '#444',
        lineHeight: 22,
        marginBottom: 10,
    },
    activityImage: {
        width: '100%',
        height: 200,
        borderRadius: 15,
        marginBottom: 10,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
    },
    reactions: {
        flexDirection: 'row',
        gap: 5,
    },
    reactionButton: {
        backgroundColor: '#f8f9fa',
        padding: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    commentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    commentCount: {
        fontSize: 14,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        height: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    commentsList: {
        paddingBottom: 20,
    },
    commentItem: {
        padding: 12,
        borderRadius: 15,
        marginBottom: 10,
        maxWidth: '85%',
    },
    myComment: {
        backgroundColor: '#e3f2fd',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 2,
    },
    theirComment: {
        backgroundColor: '#f5f5f5',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 2,
    },
    commentSender: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 4,
    },
    commentText: {
        fontSize: 15,
        color: '#333',
    },
    commentTime: {
        fontSize: 10,
        color: '#999',
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    emptyComments: {
        textAlign: 'center',
        color: '#999',
        marginTop: 50,
    },
    commentInputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
    },
    previewContainer: {
        marginTop: 10,
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 15,
        backgroundColor: '#e1e1e1',
    },
    removeImage: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 5,
        borderRadius: 12,
    },
    actionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f1f1',
    },
});
