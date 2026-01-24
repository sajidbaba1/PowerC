import React, { useMemo, useRef, useEffect, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, MessageSquare } from 'lucide-react';
import MessageBubble from './MessageBubble';

interface MessageListProps {
    messages: any[];
    activeChat: string;
    userRole: string;
    profiles: Record<string, any>;
    activeMessageActions: string | null;
    setActiveMessageActions: (id: string | null) => void;
    setReplyingTo: (msg: any) => void;
    onReact: (id: string, emoji: string) => void;
    onPin: (id: string, isPinned: boolean) => void;
    onImageClick: (url: string) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string, text: string) => void;
    onDeleteForEveryone: (id: string) => void;
    chatWallpaper: string | null;
    isOtherTyping: boolean;
}

const MessageList = memo(({
    messages,
    activeChat,
    userRole,
    profiles,
    activeMessageActions,
    setActiveMessageActions,
    setReplyingTo,
    onReact,
    onPin,
    onImageClick,
    onDelete,
    onEdit,
    onDeleteForEveryone,
    chatWallpaper,
    isOtherTyping
}: MessageListProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = React.useState(false);

    // Memoize the message map to avoid O(N) ops on every render
    const messageMap = useMemo(() => {
        return new Map(messages.map(m => [m.id, m]));
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowScrollButton(false);
    };

    // Scroll to bottom on new messages if near bottom
    useEffect(() => {
        if (!showScrollButton) {
            scrollToBottom();
        }
    }, [messages.length, activeChat]);

    const handleScroll = () => {
        if (containerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            const distanceToBottom = scrollHeight - scrollTop - clientHeight;
            setShowScrollButton(distanceToBottom > 200);
        }
    };

    if (messages.length === 0) {
        return (
            <div
                className="flex-1 overflow-y-auto p-3 lg:p-6 space-y-3 lg:space-y-4 pb-24 lg:pb-6 relative"
                onClick={() => setActiveMessageActions(null)}
                style={{
                    backgroundImage: chatWallpaper ? `url(${chatWallpaper})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {chatWallpaper && <div className="absolute inset-0 bg-background/60 pointer-events-none" />}
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground relative z-10">
                    <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm">Start chatting with {activeChat}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-3 lg:p-6 space-y-3 lg:space-y-4 pb-24 lg:pb-6 relative custom-scrollbar transform-gpu" // transform-gpu forces hardware acceleration
            onClick={() => setActiveMessageActions(null)}
            style={{
                backgroundImage: chatWallpaper ? `url(${chatWallpaper})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {chatWallpaper && <div className="absolute inset-0 bg-background/60 pointer-events-none" />}

            {/* 
                Performance Note: AnimatePresence with mode="popLayout" is great for UX used here.
                For extremely large lists (>500 items), consider disabling animations or using virtualization.
                Current implementation optimized with memoization.
            */}
            <AnimatePresence mode="popLayout" initial={false}>
                {messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        msg={msg}
                        userRole={userRole}
                        activeChat={activeChat}
                        senderProfile={profiles[msg.sender]}
                        parentMessage={msg.parentId ? messageMap.get(msg.parentId) : undefined}
                        isActive={activeMessageActions === msg.id}
                        setActiveMessageActions={setActiveMessageActions}
                        setReplyingTo={setReplyingTo}
                        onReact={onReact}
                        onPin={onPin}
                        onImageClick={onImageClick}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onDeleteForEveryone={onDeleteForEveryone}
                    />
                ))}
            </AnimatePresence>

            {isOtherTyping && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-2 relative z-10"
                >
                    <div className="flex gap-1">
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                    </div>
                    <span className="text-xs text-muted-foreground italic">Partner is typing...</span>
                </motion.div>
            )}

            <div ref={messagesEndRef} />

            <AnimatePresence>
                {showScrollButton && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        onClick={scrollToBottom}
                        className="fixed bottom-24 lg:bottom-32 right-4 lg:right-8 z-30 p-3 bg-white/10 hover:bg-white/20 text-primary rounded-full shadow-2xl border border-white/10 backdrop-blur-xl transition-all hover:scale-110 active:scale-95"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
});

MessageList.displayName = "MessageList";

export default MessageList;
