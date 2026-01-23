import React from 'react';
import { Tabs } from 'expo-router';
import { Heart, MessageCircle, Image, StickyNote, Calendar, Zap } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff', // White active icon
        tabBarInactiveTintColor: '#52525b', // Zinc 600 inactive
        headerShown: false, // Hide default headers for a cleaner feel
        tabBarStyle: {
          backgroundColor: '#09090b', // Matte Black
          borderTopWidth: 1,
          borderTopColor: '#27272a',
          height: 60,
          paddingBottom: 10,
          elevation: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Power Couple',
          tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pulse"
        options={{
          title: 'Pulse',
          tabBarIcon: ({ color }) => <Zap size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wall"
        options={{
          title: 'Wall',
          tabBarIcon: ({ color }) => <Image size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jar"
        options={{
          title: 'Jar',
          tabBarIcon: ({ color }) => <StickyNote size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
