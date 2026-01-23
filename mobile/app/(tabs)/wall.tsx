import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ImageBackground, TouchableOpacity, Modal, TextInput, RefreshControl, Dimensions, Animated, Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { loveNotesApi } from '@/lib/api';
import { Plus, X, Heart } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function WallScreen() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newNote, setNewNote] = useState('');

    const fetchNotes = async () => {
        try {
            const response = await loveNotesApi.getNotes();
            setNotes(response.data);
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotes();
        setRefreshing(false);
    };

    const handleAddNote = async () => {
        if (!newNote.trim() || !user) return;
        try {
            await loveNotesApi.addNote({
                content: newNote,
                sender: user.role,
                x: Math.random() * 80,
                y: Math.random() * 80,
                rotation: (Math.random() - 0.5) * 15,
            });
            setNewNote('');
            setModalVisible(false);
            fetchNotes();
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[
            styles.note,
            { transform: [{ rotate: `${item.rotation || 0}deg` }] }
        ]}>
            <View style={styles.pin} />
            <Text style={styles.noteText}>{item.content}</Text>
            <View style={styles.noteFooter}>
                <Heart size={10} color="#ff758c" fill="#ff758c" />
                <Text style={styles.noteAuthor}>{item.sender === 'sajid' ? 'Sajid' : 'Nasywa'}</Text>
            </View>
        </View>
    );

    return (
        <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1586075010620-225f446045d6?q=80&w=1080&auto=format&fit=crop' }}
            style={styles.container}
        >
            <FlatList
                data={notes}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <Plus size={30} color="white" />
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <BlurView intensity={90} tint="dark" style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Love Note</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="rgba(255,255,255,0.6)" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.stickyInputContainer}>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Write something sweet..."
                                placeholderTextColor="rgba(0,0,0,0.3)"
                                multiline
                                value={newNote}
                                onChangeText={setNewNote}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.modalButton, !newNote.trim() && styles.disabledButton]}
                            onPress={handleAddNote}
                            disabled={!newNote.trim()}
                        >
                            <Text style={styles.modalButtonText}>Pin to Wall</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </Modal>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 15,
        paddingTop: 40,
    },
    note: {
        width: (width - 60) / 2,
        backgroundColor: '#fff9c4', // Classic sticky note yellow
        margin: 10,
        padding: 15,
        borderRadius: 2,
        minHeight: 140,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        position: 'relative',
    },
    pin: {
        position: 'absolute',
        top: 5,
        left: '50%',
        marginLeft: -4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f43f5e',
        zIndex: 1,
    },
    noteText: {
        fontSize: 15,
        fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
        textAlign: 'center',
        color: '#5d4037',
        marginTop: 10,
        flex: 1,
    },
    noteFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        gap: 4,
    },
    noteAuthor: {
        fontSize: 11,
        color: '#8d6e63',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        backgroundColor: '#8b5cf6',
        width: 65,
        height: 65,
        borderRadius: 32.5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    stickyInputContainer: {
        backgroundColor: '#fff9c4',
        borderRadius: 4,
        padding: 20,
        minHeight: 180,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    modalInput: {
        fontSize: 18,
        color: '#5d4037',
        textAlignVertical: 'top',
        flex: 1,
    },
    modalButton: {
        backgroundColor: '#8b5cf6',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    modalButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
