"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, LogOut, User, Menu, BookOpen, X, Mail } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SajidDashboardProps {
    user: { name: string; role: string };
    onLogout: () => void;
}

export default function SajidDashboard({ user, onLogout }: SajidDashboardProps) {
    const [activeChat, setActiveChat] = useState<"nasywa" | "admin">("nasywa");
    const [messages, setMessages] = useState<Record<string, any[]>>({
        nasywa: [],
        admin: []
    });
    const [inputValue, setInputValue] = useState("");
    const [selectedMessage, setSelectedMessage] = useState<any>(null);
    const [learnedWords, setLearnedWords] = useState<any[]>([]);
    const [userEmail, setUserEmail] = useState("");
    const [showEmailSettings, setShowEmailSettings] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showWordBucket, setShowWordBucket] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeChat]);

    useEffect(() => {
        const currentMessages = messages[activeChat];
        if (currentMessages.length > 0 && !selectedMessage) {
            setSelectedMessage(currentMessages[currentMessages.length - 1]);
        }
    }, [messages, activeChat]);

    // Fetch messages from server
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/messages?user1=sajid&user2=${activeChat}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setMessages((prev) => {
                        const localMessages = prev[activeChat] || [];
                        const messageMap = new Map();

                        data.forEach(m => messageMap.set(m.id, m));
                        localMessages.forEach(m => {
                            if (m.status === "sending" && !messageMap.has(m.id)) {
                                messageMap.set(m.id, m);
                            }
                        });

                        const merged = Array.from(messageMap.values()).sort((a, b) => {
                            return a.id.toString().localeCompare(b.id.toString());
                        });

                        return { ...prev, [activeChat]: merged };
                    });
                }
            } catch (e) {
                console.error("Failed to fetch messages", e);
            }
        };
        fetchMessages();

        const interval = setInterval(fetchMessages, 2000);
        return () => clearInterval(interval);
    }, [activeChat]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: inputValue,
            sender: "sajid",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: "sending"
        };

        setMessages((prev) => ({
            ...prev,
            [activeChat]: [...prev[activeChat], userMessage]
        }));
        setInputValue("");

        // 2. Persist to message store INSTANTLY (without translation)
        fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user1: "sajid",
                user2: activeChat,
                message: { ...userMessage, status: "sent" } // Set as sent immediately in store
            })
        }).catch(err => console.error("Initial sync failed:", err));

        // 3. Request translation (background)
        try {
            console.log("Requesting translation...");
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: inputValue,
                    sourceLang: "English",
                    targetLang: "Indonesian"
                }),
            });

            if (!response.ok) throw new Error("Translation failed");

            const data = await response.json();

            const updatedMessage = {
                ...userMessage,
                translation: data.translation || "No translation",
                hindiTranslation: data.hindiTranslation,
                wordBreakdown: data.wordBreakdown || [],
                status: "sent"
            };

            // Update local state with translation
            setMessages((prev) => ({
                ...prev,
                [activeChat]: prev[activeChat].map((msg) =>
                    msg.id === userMessage.id ? updatedMessage : msg
                )
            }));

            // Save translation back to store
            fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user1: "sajid",
                    user2: activeChat,
                    message: updatedMessage
                })
            }).catch(err => console.error("Final sync failed:", err));

            // Word breakdown logic
            if (data.wordBreakdown && Array.isArray(data.wordBreakdown)) {
                setLearnedWords((prev) => {
                    const newWords = data.wordBreakdown.filter((newWord: any) =>
                        !prev.some((w) => (w.word || "").toLowerCase() === (newWord.word || "").toLowerCase())
                    );
                    return [...prev, ...newWords];
                });
            }

        } catch (error: any) {
            console.error("Translation failed:", error);
            // English message is already saved and displayed, so we don't mark as error
        }
    };

    const chatPartners = [
        { id: "nasywa", name: "Nasywa", color: "from-pink-500 to-rose-500" },
        { id: "admin", name: "Admin", color: "from-purple-500 to-indigo-500" }
    ];

    return (
        <div className="flex h-screen bg-background overflow-hidden relative">
            {/* Mobile Overlay */}
            {(showSidebar || showWordBucket) && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => {
                        setShowSidebar(false);
                        setShowWordBucket(false);
                    }}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:relative inset-y-0 left-0 z-50 w-72 lg:w-80 border-r border-border bg-card/95 backdrop-blur-xl flex flex-col transition-transform duration-300",
                showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="p-4 lg:p-6 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-sm lg:text-base">{user.name}</h2>
                                <p className="text-xs text-muted-foreground">Learning Indonesian</p>
                            </div>
                        </div>
                        <button onClick={onLogout} className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <LogOut className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 lg:p-4">
                    <div className="space-y-2">
                        {chatPartners.map((partner) => (
                            <button
                                key={partner.id}
                                onClick={() => {
                                    setActiveChat(partner.id as any);
                                    setShowSidebar(false);
                                }}
                                className={cn(
                                    "w-full p-3 lg:p-4 rounded-2xl transition-all flex items-center gap-3",
                                    activeChat === partner.id
                                        ? "bg-primary/10 border-2 border-primary"
                                        : "glass border border-white/5 hover:border-white/20"
                                )}
                            >
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${partner.color} flex items-center justify-center relative`}>
                                    <User className="w-5 h-5 text-white" />
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-semibold text-sm">{partner.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {messages[partner.id as keyof typeof messages]?.length || 0} messages
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Chat */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-14 lg:h-16 border-b border-border flex items-center justify-between px-3 lg:px-6 bg-card/30 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br ${chatPartners.find(p => p.id === activeChat)?.color} flex items-center justify-center shrink-0`}>
                            <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-semibold text-sm lg:text-base capitalize truncate">{activeChat}</h2>
                            <p className="text-[10px] lg:text-xs text-green-500">Online</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowWordBucket(!showWordBucket)}
                        className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors relative shrink-0"
                    >
                        <BookOpen className="w-5 h-5" />
                        {learnedWords.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                                {learnedWords.length}
                            </span>
                        )}
                    </button>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 lg:p-6 space-y-3 lg:space-y-4">
                    {messages[activeChat].length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm">Start chatting with {activeChat}</p>
                        </div>
                    ) : (
                        messages[activeChat].map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "flex flex-col gap-1 max-w-[85%] lg:max-w-[75%]",
                                    msg.sender === "sajid" ? "ml-auto items-end" : "mr-auto items-start"
                                )}
                            >
                                <div className={cn(
                                    "p-3 lg:p-4 rounded-2xl glass transition-all",
                                    msg.sender === "sajid" ? "bg-primary/20 rounded-tr-none" : "bg-muted/50 rounded-tl-none"
                                )}>
                                    <p className="text-sm font-medium break-words">{msg.text}</p>
                                    {msg.status === "sending" && (
                                        <div className="mt-1 flex items-center gap-1">
                                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                                            <span className="text-[9px] text-muted-foreground ml-1">Translating...</span>
                                        </div>
                                    )}
                                    {msg.translation && (
                                        <div className="mt-2 pt-2 border-t border-white/5">
                                            <p className="text-xs text-indigo-300 italic">{msg.translation}</p>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-muted-foreground px-2">{msg.timestamp}</span>
                            </motion.div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 lg:p-6 lg:pt-0 shrink-0">
                    <div className="glass border border-white/10 rounded-2xl p-2 flex items-center gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder={`Message ${activeChat}...`}
                            className="flex-1 bg-transparent border-none outline-none text-sm px-2 lg:px-4 min-w-0"
                        />
                        <button
                            onClick={handleSend}
                            className="p-2 lg:p-3 bg-primary hover:bg-primary/90 rounded-xl transition-all neon-border shrink-0"
                        >
                            <Send className="w-4 h-4 lg:w-5 lg:h-5 text-primary-foreground" />
                        </button>
                    </div>
                </div>
            </main>

            {/* Word Bucket */}
            <aside className={cn(
                "fixed lg:relative inset-y-0 right-0 z-50 w-full sm:w-96 bg-background/95 backdrop-blur-2xl border-l border-border flex flex-col transition-transform duration-300",
                showWordBucket ? "translate-x-0" : "translate-x-full lg:translate-x-0"
            )}>
                <div className="p-4 lg:p-6 border-b border-border shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-semibold text-sm lg:text-base">Learning Indonesian 🇮🇩</h3>
                            <p className="text-xs text-muted-foreground">{learnedWords.length} words collected</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowEmailSettings(!showEmailSettings)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <Mail className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setShowWordBucket(false)}
                                className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showEmailSettings && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 overflow-hidden"
                            >
                                <input
                                    type="email"
                                    value={userEmail}
                                    onChange={(e) => setUserEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
                                />
                                <button
                                    onClick={async () => {
                                        if (!userEmail || learnedWords.length === 0) return;
                                        try {
                                            await fetch("/api/send-words", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ email: userEmail, words: learnedWords, user: "Sajid" })
                                            });
                                            alert("Word list sent to your email!");
                                        } catch (e) {
                                            alert("Failed to send email");
                                        }
                                    }}
                                    className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"
                                >
                                    Email My Word List
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2">
                    {learnedWords.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-8">
                            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm">Start chatting to collect Indonesian words!</p>
                        </div>
                    ) : (
                        learnedWords.map((item: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-xl glass border border-white/5 hover:border-primary/20 transition-all">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="font-bold text-sm">{item.word}</p>
                                    <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                                </div>
                                <p className="text-indigo-300 font-medium mb-1 text-sm">{item.indonesian}</p>
                                <p className="text-xs text-muted-foreground">{item.meaning}</p>
                            </div>
                        ))
                    )}
                </div>

                {learnedWords.length > 0 && (
                    <div className="p-3 lg:p-4 border-t border-border shrink-0">
                        <button
                            onClick={() => setLearnedWords([])}
                            className="w-full px-4 py-2 bg-destructive/10 text-destructive rounded-xl text-sm font-medium hover:bg-destructive/20 transition-all"
                        >
                            Clear All Words
                        </button>
                    </div>
                )}
            </aside>
        </div>
    );
}
