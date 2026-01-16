'use client';
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Play, Pause, Volume2, VolumeX, SkipForward } from 'lucide-react';

// Dynamic import for ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

import { LOCAL_SONGS, Song, EffectType } from '@/lib/songs';

interface MusicPlayerProps {
    activeChat: string;
    pusherClient: any;
    currentEffect: EffectType;
    onEffectChange: (effect: EffectType) => void;
    onPlayingChange?: (isPlaying: boolean) => void;
    userRole?: string;
}

export default function MusicPlayer({ activeChat, pusherClient, currentEffect, onEffectChange, onPlayingChange, userRole }: MusicPlayerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [manualEffect, setManualEffect] = useState<EffectType | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Report state changes to parent (fixes slideshow bug)
    useEffect(() => {
        if (onPlayingChange) onPlayingChange(isPlaying);
    }, [isPlaying, onPlayingChange]);

    // Sync via Pusher
    useEffect(() => {
        if (!pusherClient || !activeChat) return;

        let chatKey = activeChat;
        if (activeChat.includes("nasywa") || activeChat.includes("sajid")) {
            const sorted = ["sajid", "nasywa"].sort();
            chatKey = `${sorted[0]}-${sorted[1]}`;
        }

        const channel = pusherClient.subscribe(chatKey);
        channel.bind("music-update", (data: any) => {
            console.log("🎵 Remote Music Update:", data);
            if (data.index !== undefined) {
                setCurrentIndex(data.index);
            }
            if (data.isPlaying !== undefined) {
                setIsPlaying(data.isPlaying);
                // Note: We don't setHasInteracted(true) here because browser will still block audio.play()
                // Instead, the UI will change to prompt the user to click.
            }
            if (data.effect !== undefined) {
                if (data.effect === 'auto') {
                    setManualEffect(null);
                } else {
                    setManualEffect(data.effect as EffectType);
                    onEffectChange(data.effect as EffectType);
                }
            }

            if (userRole === 'sajid' && data.sajidVolume !== undefined) setVolume(data.sajidVolume);
            if (userRole === 'nasywa' && data.nasywaVolume !== undefined) setVolume(data.nasywaVolume);
        });

        return () => channel.unbind("music-update");
    }, [pusherClient, activeChat, onEffectChange, userRole]);

    // Apply Effect when song changes - ONLY if no manual override
    useEffect(() => {
        const song = LOCAL_SONGS[currentIndex];
        if (song && isPlaying && !manualEffect) {
            onEffectChange(song.effect);
        }
    }, [currentIndex, isPlaying, onEffectChange, manualEffect]);

    const broadcastState = async (updates: Partial<{ index: number, isPlaying: boolean, effect?: string }>) => {
        if (updates.index !== undefined) {
            setCurrentIndex(updates.index);
            setManualEffect(null);
        }
        if (updates.isPlaying !== undefined) setIsPlaying(updates.isPlaying);

        const sorted = ["sajid", "nasywa"].sort();
        const chatKey = sorted.join('-');

        await fetch("/api/chat/music", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chatKey,
                index: updates.index !== undefined ? updates.index : currentIndex,
                isPlaying: updates.isPlaying !== undefined ? updates.isPlaying : isPlaying,
                effect: updates.effect || (updates.index !== undefined ? LOCAL_SONGS[updates.index].effect : undefined),
                playlist: []
            })
        });
    };

    const handleStart = () => {
        setHasInteracted(true);
        if (!isPlaying) broadcastState({ isPlaying: true });
    };

    const handleNext = () => {
        const nextIndex = (currentIndex + 1) % LOCAL_SONGS.length;
        broadcastState({ index: nextIndex });
    };

    // Capture global interaction for browser autoplay policy
    useEffect(() => {
        const handleInteraction = () => {
            setHasInteracted(true);
            // Once interacted, we can remove the listeners
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);
        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, []);

    const audioRef = useRef<HTMLAudioElement>(null);

    // Handle Native Audio Playback
    useEffect(() => {
        if (!audioRef.current) return;

        if (isPlaying) {
            // Even if not interacted, we try to play. If it fails, hasInteracted listener will catch the next click.
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch((error: any) => {
                    console.log("🎵 Autoplay blocked, waiting for next user interaction...");
                });
            }
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, hasInteracted, currentIndex]);

    // Update volume based on mute and current volume set by admin
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [isMuted, volume]);

    if (!mounted) return null;

    return (
        <>
            <audio
                ref={audioRef}
                src={LOCAL_SONGS[currentIndex]?.url}
                onEnded={handleNext}
                onPlay={() => console.log("🎵 Native Playback Started")}
                onError={(e) => console.error("🎵 Native Audio Error:", e)}
                preload="auto"
                style={{ display: 'none' }}
            />

            <div className="fixed bottom-24 left-4 z-[9999]">
                {isPlaying && (
                    <div className="flex items-center gap-2 bg-zinc-900/90 border border-pink-500/30 backdrop-blur-md p-2 rounded-full shadow-2xl hover:scale-105 transition-all">
                        <div className="flex items-center gap-2 px-2 max-w-[140px]">
                            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shrink-0" />
                            <div className="truncate text-[10px] text-white font-bold uppercase tracking-wider">
                                {LOCAL_SONGS[currentIndex]?.title}
                            </div>
                        </div>
                        <button onClick={() => setIsMuted(!isMuted)} className="p-1.5 text-white/80 hover:text-white transition-colors">
                            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                        {userRole === 'admin' && (
                            <button onClick={handleNext} className="p-1.5 text-white/80 hover:text-white transition-colors border-l border-white/10 ml-1">
                                <SkipForward className="w-3.5 h-3.5 fill-current" />
                            </button>
                        )}
                    </div>
                )}

                {!isPlaying && userRole === 'admin' && (
                    <button
                        onClick={handleStart}
                        className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce flex items-center gap-2 transition-all text-sm"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Start Vibes 🎵
                    </button>
                )}
            </div>
        </>
    );
}

