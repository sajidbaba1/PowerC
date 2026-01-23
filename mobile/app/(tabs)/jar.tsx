import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Modal, TextInput, RefreshControl, Dimensions, ImageBackground } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { jarApi } from '@/lib/api';
import { Plus, X, StickyNote, Star, Heart } from 'lucide-react-native';
import { format } from 'date-fns';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function JarScreen() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newNote, setNewNote] = useState('');

    const fetchNotes = async () => {
        try {
            const response = await jarApi.getNotes();
            setNotes(response.data);
        } catch (error) {
            console.error('Error fetching jar notes:', error);
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
            await jarApi.addNote(newNote, user.role);
            setNewNote('');
            setModalVisible(false);
            fetchNotes();
        } catch (error) {
            console.error('Error adding jar note:', error);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.noteItem}>
            <LinearGradient
                colors={['rgba(79, 172, 254, 0.1)', 'rgba(0, 242, 254, 0.05)']}
                style={styles.noteGradient}
            >
                <View style={styles.noteHeader}>
                    <Star size={14} color="#4facfe" fill="#4facfe" />
                    <Text style={styles.noteDate}>{format(new Date(item.createdAt), 'MMMM dd, yyyy')}</Text>
                </View>
                <Text style={styles.noteContent}>{item.content}</Text>
                <View style={styles.noteFooter}>
                    <Heart size={12} color="#ff758c" fill="#ff758c" />
                    <Text style={styles.noteAuthor}>Stored by {item.author === 'sajid' ? 'Sajid' : 'Nasywa'}</Text>
                </View>
            </LinearGradient>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.jarHeader}>
                <Text style={styles.jarTitle}>Memory Jar 🏺</Text>
                <Text style={styles.jarSubtitle}>Little moments captured in time.</Text>
            </View>

            <FlatList
                data={notes}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4facfe" />
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.fabGradient}>
                    <Plus size={30} color="white" />
                </LinearGradient>
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
                            <Text style={styles.modalTitle}>New Memory</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="rgba(255,255,255,0.6)" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.memoryInputContainer}>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="What's a memory you want to save?"
                                placeholderTextColor="rgba(255,255,255,0.3)"
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
                            <Text style={styles.modalButtonText}>Store in Jar</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    jarHeader: {
        padding: 24,
        paddingTop: 60,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    jarTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    jarSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 4,
    },
    listContent: {
        padding: 20,
    },
    noteItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
    },
    noteGradient: {
        padding: 20,
    },
    noteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    noteDate: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#4facfe',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    noteContent: {
        fontSize: 17,
        color: '#f0f0f0',
        lineHeight: 26,
    },
    noteFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 15,
        gap: 6,
    },
    noteAuthor: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        shadowColor: '#4facfe',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    fabGradient: {
        width: 65,
        height: 65,
        borderRadius: 32.5,
        justifyContent: 'center',
        alignItems: 'center',
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
    memoryInputContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 20,
        minHeight: 150,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalInput: {
        fontSize: 18,
        color: 'white',
        textAlignVertical: 'top',
        flex: 1,
    },
    modalButton: {
        backgroundColor: '#4facfe',
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
