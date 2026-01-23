import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/context/AuthContext';
import { profileApi } from '@/lib/api';
import { MapPin, Heart, Smile, LogOut, Zap, Music, Cloud } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SlideshowBackground from '@/components/SlideshowBackground';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfiles = async () => {
    try {
      const response = await profileApi.getProfiles();
      setProfiles(response.data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  useEffect(() => {
    fetchProfiles();
    const interval = setInterval(fetchProfiles, 10000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfiles();
    setRefreshing(false);
  };

  const partner = profiles.find((p: any) => p.role !== user?.role);
  const me = profiles.find((p: any) => p.role === user?.role);

  const moods = [
    { label: 'Happy', emoji: '😊' },
    { label: 'Miss You', emoji: '🥺' },
    { label: 'Tired', emoji: '😴' },
    { label: 'Busy', emoji: '💼' },
    { label: 'Need a Hug', emoji: '🫂' }
  ];

  const handleMoodUpdate = async (mood: string) => {
    if (!user) return;
    try {
      await profileApi.updateMood(user.role, mood);
      fetchProfiles();
    } catch (error) {
      console.error('Error updating mood:', error);
    }
  };

  return (
    <View style={styles.container}>
      <SlideshowBackground />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome home,</Text>
            <Text style={styles.userName}>{user?.name} ✨</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutIcon}>
            <LogOut size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Partner Glass Card */}
        {partner && (
          <View style={styles.glassCard}>
            <View style={styles.partnerHeader}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: partner.avatarUrl || 'https://via.placeholder.com/100' }}
                  style={styles.avatar}
                />
                <View style={styles.onlineBadge} />
              </View>
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerRole}>MY PARTNER</Text>
                <Text style={styles.partnerName}>{partner.name}</Text>
                <View style={styles.moodBadge}>
                  <Text style={styles.moodBadgeText}>{partner.mood || 'Chilling'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.partnerFooter}>
              <View style={styles.footerItem}>
                <MapPin size={16} color="#52525b" />
                <Text style={styles.footerText}>
                  {partner.role === 'sajid' ? 'Agra, IN' : 'Jakarta, ID'}
                </Text>
              </View>
              <View style={styles.footerItem}>
                <Cloud size={16} color="#52525b" />
                <Text style={styles.footerText}>
                  {partner.role === 'sajid' ? '28°C Haze' : '30°C Rain'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Mood Selector Glass Card */}
        <View style={styles.glassCard}>
          <Text style={styles.sectionLabel}>HOW ARE YOU FEELING?</Text>
          <View style={styles.moodGrid}>
            {moods.map((m) => (
              <TouchableOpacity
                key={m.label}
                onPress={() => handleMoodUpdate(m.label)}
                style={[
                  styles.moodButton,
                  me?.mood === m.label && styles.activeMoodButton
                ]}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  me?.mood === m.label && styles.activeMoodLabel
                ]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions/Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.glassCard, styles.statCard]}
            onPress={() => handleMoodUpdate('Miss You')}
          >
            <View style={styles.statIcon}>
              <Heart size={20} color="white" fill={me?.mood === 'Miss You' ? 'white' : 'none'} />
            </View>
            <Text style={styles.statValue}>124</Text>
            <Text style={styles.statLabel}>SEND LOVE</Text>
          </TouchableOpacity>

          <View style={[styles.glassCard, styles.statCard]}>
            <LinearGradient colors={['#4facfe', '#00f2fe'] as const} style={styles.statIcon}>
              <Zap size={20} color="white" />
            </LinearGradient>
            <Text style={styles.statValue}>850</Text>
            <Text style={styles.statLabel}>MESSAGES</Text>
          </View>
        </View>

        {/* Now Playing (Placeholder like Web App) */}
        <View style={styles.glassCard}>
          <View style={styles.nowPlayingRow}>
            <Music size={20} color="#ff758c" />
            <Text style={styles.nowPlayingText}>OUR SONG: "PERFECT" - ED SHEERAN</Text>
            <View style={styles.visualizer}>
              {[1, 2, 3, 4].map(i => <View key={i} style={[styles.visBar, { height: 10 + Math.random() * 15 }]} />)}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b', // Matte Black
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userName: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  logoutIcon: {
    padding: 10,
    backgroundColor: '#27272a',
    borderRadius: 15,
  },
  glassCard: {
    backgroundColor: '#18181b', // Surface
    borderRadius: 30,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    // No blur or transparency needed for matte look
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#27272a',
    backgroundColor: '#27272a',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4ade80',
    borderWidth: 3,
    borderColor: '#18181b',
  },
  partnerInfo: {
    marginLeft: 15,
    flex: 1,
  },
  partnerRole: {
    color: '#52525b', // Zinc 600
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  partnerName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
  },
  moodBadge: {
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  moodBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  partnerFooter: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    color: '#a1a1aa',
    fontSize: 13,
  },
  sectionLabel: {
    color: '#52525b',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 15,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodButton: {
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeMoodButton: {
    backgroundColor: '#3f3f46',
    borderColor: '#52525b',
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodLabel: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '600',
  },
  activeMoodLabel: {
    color: 'white',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 25,
  },
  statIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#27272a', // Replaces gradient
  },
  statValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#52525b',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  nowPlayingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nowPlayingText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  visBar: {
    width: 3,
    backgroundColor: '#ef4444',
    borderRadius: 2,
  }
});
