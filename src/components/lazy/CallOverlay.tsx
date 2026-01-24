'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, X, Mic, MicOff, VideoOff, PhoneOff, User, Volume2, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'audio' | 'video';
    role: 'caller' | 'receiver';
    partnerName: string;
    partnerAvatar?: string;
    onAccept?: () => void;
    onDecline?: () => void;
    onHangup?: () => void;
    localStream?: MediaStream | null;
    remoteStream?: MediaStream | null;
}

export default function CallOverlay({
    isOpen,
    onClose,
    type,
    role,
    partnerName,
    partnerAvatar,
    onAccept,
    onDecline,
    onHangup,
    localStream,
    remoteStream
}: CallOverlayProps) {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isMaximized, setIsMaximized] = useState(true);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        let interval: any;
        if (remoteStream) {
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [remoteStream]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, isOpen]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, isOpen]);

    // Handle Mute/Unmute
    useEffect(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    }, [isMuted, localStream]);

    // Handle Video On/Off
    useEffect(() => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !isVideoOff;
            });
        }
    }, [isVideoOff, localStream]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={cn(
                    "fixed z-[2000] flex flex-col transition-all duration-500 overflow-hidden shadow-2xl border border-white/20",
                    isMaximized
                        ? "inset-0 md:inset-10 md:rounded-[2.5rem] bg-zinc-950"
                        : "bottom-6 right-6 w-72 h-48 rounded-2xl bg-zinc-900"
                )}
            >
                {/* Background Video (Remote) */}
                <div className="absolute inset-0 z-0 bg-zinc-900 flex items-center justify-center">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={cn(
                            "w-full h-full object-cover absolute inset-0 transition-opacity duration-500",
                            (type !== 'video' || !remoteStream) ? "opacity-0" : "opacity-100"
                        )}
                    />

                    {(type !== 'video' || !remoteStream) && (
                        <div className="flex flex-col items-center gap-6 z-10 relative">
                            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-primary to-blue-600 p-1 animate-pulse shadow-2xl">
                                <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden border-4 border-white/10">
                                    {partnerAvatar ? (
                                        <img src={partnerAvatar} alt={partnerName} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-16 h-16 md:w-24 md:h-24 text-white/20" />
                                    )}
                                </div>
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{partnerName}</h2>
                                <p className="text-sm font-bold text-primary animate-pulse tracking-widest uppercase">
                                    {remoteStream ? formatDuration(callDuration) : (role === 'caller' ? 'Calling...' : 'Inbound Call')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Local Video (Self) */}
                {type === 'video' && localStream && (
                    <motion.div
                        drag
                        dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
                        className={cn(
                            "absolute z-20 border-2 border-white/20 shadow-2xl overflow-hidden bg-zinc-800 transition-all",
                            isMaximized ? "top-8 right-8 w-32 h-48 md:w-48 md:h-72 rounded-3xl" : "top-2 right-2 w-16 h-24 rounded-lg"
                        )}
                    >
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={cn("w-full h-full object-cover", isVideoOff && "hidden")}
                        />
                        {isVideoOff && (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                <User className="w-8 h-8 text-white/10" />
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Overlay Controls */}
                <div className="absolute inset-x-0 bottom-0 z-30 p-8 md:p-12 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex flex-col items-center gap-8">

                        {/* Status for Audio Calls */}
                        {type === 'audio' && remoteStream && (
                            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                                <div className="flex gap-1 items-center">
                                    <div className="w-1 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1 h-5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1 h-3 bg-primary rounded-full animate-bounce" />
                                </div>
                                <span className="text-sm font-black text-white/60 tracking-widest">{formatDuration(callDuration)}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-4 md:gap-8">
                            {remoteStream ? (
                                <>
                                    <button
                                        onClick={() => setIsMuted(!isMuted)}
                                        className={cn(
                                            "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all",
                                            isMuted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                                        )}
                                    >
                                        {isMuted ? <MicOff /> : <Mic />}
                                    </button>
                                    {type === 'video' && (
                                        <button
                                            onClick={() => setIsVideoOff(!isVideoOff)}
                                            className={cn(
                                                "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all",
                                                isVideoOff ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                                            )}
                                        >
                                            {isVideoOff ? <VideoOff /> : <Video />}
                                        </button>
                                    )}
                                    <button
                                        onClick={onHangup}
                                        className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-destructive text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl shadow-destructive/30"
                                    >
                                        <PhoneOff />
                                    </button>
                                    <button
                                        onClick={() => setIsMaximized(!isMaximized)}
                                        className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                                    >
                                        {isMaximized ? <Minimize2 /> : <Maximize2 />}
                                    </button>
                                </>
                            ) : role === 'receiver' ? (
                                <>
                                    <button
                                        onClick={onAccept}
                                        className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-500 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-green-500/30 animate-bounce"
                                    >
                                        {type === 'video' ? <Video className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
                                    </button>
                                    <button
                                        onClick={onDecline}
                                        className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-destructive text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-destructive/30"
                                    >
                                        <PhoneOff className="w-8 h-8" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={onHangup}
                                    className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-destructive text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-destructive/30"
                                >
                                    <PhoneOff className="w-8 h-8" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Controls */}
                <div className="absolute top-8 left-8 z-30 flex items-center gap-4">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-lg flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-black text-white/60 tracking-tighter uppercase">Secure Call</span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 z-30 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
                >
                    <X className="w-6 h-6" />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
