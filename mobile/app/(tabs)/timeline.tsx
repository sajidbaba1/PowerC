import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl, Dimensions } from 'react-native';
import { milestoneApi } from '@/lib/api';
import { Calendar, Star, Heart, Camera, PartyPopper } from 'lucide-react-native';
import { format, differenceInDays } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function TimelineScreen() {
    const [milestones, setMilestones] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMilestones = async () => {
        try {
            const response = await milestoneApi.getMilestones();
            setMilestones(response.data);
        } catch (error) {
            console.error('Error fetching milestones:', error);
        }
    };

    useEffect(() => {
        fetchMilestones();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMilestones();
        setRefreshing(false);
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'anniversary': return ['#ff758c', '#ff7eb3'];
            case 'birthday': return ['#fcd34d', '#fbbf24'];
            case 'date': return ['#4facfe', '#00f2fe'];
            default: return ['#8b5cf6', '#a78bfa'];
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'anniversary': return <Heart size={20} color="white" fill="white" />;
            case 'birthday': return <PartyPopper size={20} color="white" />;
            case 'date': return <Camera size={20} color="white" />;
            default: return <Star size={20} color="white" fill="white" />;
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const date = new Date(item.date);
        const daysDiff = differenceInDays(date, new Date());
        const isPast = daysDiff < 0;
        const colorTuple = getTypeColor(item.type) as [string, string];

        return (
            <View style={styles.milestoneRow}>
                <View style={styles.timelineLine}>
                    <LinearGradient
                        colors={colorTuple}
                        style={styles.dot}
                    />
                    {index !== milestones.length - 1 && <View style={styles.line} />}
                </View>

                <View style={styles.cardContainer}>
                    <View style={styles.glassCard}>
                        <View style={styles.cardHeader}>
                            <LinearGradient colors={colorTuple} style={styles.iconBox}>
                                {getTypeIcon(item.type)}
                            </LinearGradient>
                            <View>
                                <Text style={styles.milestoneDate}>{format(date, 'MMMM dd, yyyy')}</Text>
                                <Text style={styles.milestoneTitle}>{item.title}</Text>
                            </View>
                        </View>

                        <View style={styles.cardFooter}>
                            <View style={[styles.statusBadge, isPast ? styles.pastBadge : styles.futureBadge]}>
                                <Text style={[styles.statusText, isPast ? styles.pastText : styles.futureText]}>
                                    {isPast ? `Happened ${Math.abs(daysDiff)} days ago` : `In ${daysDiff} days`}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Our Journey 🛣️</Text>
                <Text style={styles.headerSubtitle}>Every milestone, every memory.</Text>
            </View>

            <FlatList
                data={milestones}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        padding: 24,
        paddingTop: 60,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 4,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    milestoneRow: {
        flexDirection: 'row',
        minHeight: 140,
    },
    timelineLine: {
        width: 40,
        alignItems: 'center',
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 3,
        borderColor: '#0f172a',
        zIndex: 1,
        marginTop: 5,
    },
    line: {
        flex: 1,
        width: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 4,
    },
    cardContainer: {
        flex: 1,
        marginLeft: 10,
        marginBottom: 24,
    },
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 15,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    milestoneDate: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    milestoneTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 2,
    },
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 12,
        flexDirection: 'row',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },
    futureBadge: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
    pastBadge: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    futureText: {
        color: '#a78bfa',
    },
    pastText: {
        color: 'rgba(255,255,255,0.4)',
    },
});
