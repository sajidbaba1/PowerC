import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Utensils, Coffee, Moon, Sun, X, Plus, User, MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPusherClient } from "@/lib/pusher";

interface Meal {
    id: string;
    description: string;
    calories?: number;
    time: string;
}

interface HealthLogData {
    id?: string;
    water: number;
    meals: {
        breakfast?: Meal;
        lunch?: Meal;
        dinner?: Meal;
        snacks: Meal[];
    };
    comments: Comment[];
}

interface Comment {
    id: string;
    text: string;
    sender: string;
    createdAt: string;
}

export default function HealthTracker({ onClose, role }: { onClose: () => void, role: string }) {
    const [view, setView] = useState<'my' | 'partner'>('my');
    const [myLog, setMyLog] = useState<HealthLogData>({ water: 0, meals: { snacks: [] }, comments: [] });
    const [partnerLog, setPartnerLog] = useState<HealthLogData>({ water: 0, meals: { snacks: [] }, comments: [] });
    const [modalOpen, setModalOpen] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | null>(null);
    const [mealInput, setMealInput] = useState("");
    const [commentInput, setCommentInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const activeRole = view === 'my' ? role : (role === 'sajid' ? 'nasywa' : 'sajid');
    const activeLog = view === 'my' ? myLog : partnerLog;

    // Fetch data
    const fetchLog = async (targetRole: string) => {
        const today = new Date().toLocaleDateString();
        // Convert to ISO-ish YYYY-MM-DD for consistency with DB if needed, but local string is fine for now if consistent
        // Actually the API expects YYYY-MM-DD usually, let's use a simpler format or URL encoded
        // For simplicity let's stick to what we had or standard ISO date part
        const dateKey = new Date().toISOString().split('T')[0];

        try {
            const res = await fetch(`/api/health?role=${targetRole}&date=${dateKey}`);
            const data = await res.json();
            if (data && !data.error) {
                return {
                    id: data.id,
                    water: data.water,
                    meals: data.meals || { snacks: [] },
                    comments: data.comments || []
                };
            }
        } catch (e) {
            console.error("Fetch failed", e);
        }
        return { water: 0, meals: { snacks: [] }, comments: [] };
    };

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const mine = await fetchLog(role);
            const partners = await fetchLog(role === 'sajid' ? 'nasywa' : 'sajid');
            setMyLog(mine);
            setPartnerLog(partners);
            setIsLoading(false);
        };
        load();

        // Real-time updates
        const pusher = getPusherClient();
        if (pusher) {
            const channelName = `health-${role === 'sajid' ? 'nasywa' : 'sajid'}`; // Listen to partner's updates
            const channel = pusher.subscribe(channelName);

            // Listen to *own* updates too in case of multi-device? 
            // For now let's focus on partner updates
            channel.bind('update', (data: any) => {
                const dateKey = new Date().toISOString().split('T')[0];
                if (data.date === dateKey) {
                    setPartnerLog(prev => ({
                        ...prev,
                        ...data.log,
                        comments: data.log.comments || prev.comments // Preserve comments or merge? API sends proper structure
                    }));
                }
            });

            channel.bind('comment', (data: any) => {
                const dateKey = new Date().toISOString().split('T')[0];
                if (data.date === dateKey) {
                    setPartnerLog(prev => ({
                        ...prev,
                        comments: [...prev.comments, data.comment]
                    }));
                }
            });

            // Also subscribe to OWN channel to receive comments from partner
            const myChannelName = `health-${role}`;
            const myChannel = pusher.subscribe(myChannelName);
            myChannel.bind('comment', (data: any) => {
                const dateKey = new Date().toISOString().split('T')[0];
                if (data.date === dateKey) {
                    setMyLog(prev => ({
                        ...prev,
                        comments: [...prev.comments, data.comment]
                    }));
                }
            });

            return () => {
                pusher.unsubscribe(channelName);
                pusher.unsubscribe(myChannelName);
            };
        }
    }, [role]);

    const saveLog = async (newLog: HealthLogData) => {
        const dateKey = new Date().toISOString().split('T')[0];
        try {
            await fetch("/api/health", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role,
                    date: dateKey,
                    water: newLog.water,
                    meals: newLog.meals
                })
            });
        } catch (e) {
            console.error("Save failed", e);
        }
    };

    const addWater = () => {
        if (view !== 'my') return;
        const newLog = { ...myLog, water: myLog.water + 1 };
        setMyLog(newLog);
        saveLog(newLog);
    };

    const addMeal = (type: 'breakfast' | 'lunch' | 'dinner' | 'snack', description: string) => {
        if (view !== 'my') return;
        const meal: Meal = {
            id: Date.now().toString(),
            description,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const newMeals = { ...myLog.meals };
        if (type === 'snack') {
            newMeals.snacks = [...newMeals.snacks, meal];
        } else {
            newMeals[type] = meal;
        }

        const newLog = { ...myLog, meals: newMeals };
        setMyLog(newLog);
        saveLog(newLog);
    };

    const addComment = async () => {
        if (!commentInput.trim() || !activeLog.id) return; // Can't comment if log doesn't exist yet (partner hasn't started)

        try {
            const res = await fetch("/api/health/comment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    healthLogId: activeLog.id,
                    text: commentInput,
                    sender: role
                })
            });
            const comment = await res.json();

            // Optimistic update
            const updated = { ...activeLog, comments: [...activeLog.comments, comment] };
            if (view === 'my') setMyLog(updated);
            else setPartnerLog(updated);

            setCommentInput("");
        } catch (e) {
            console.error("Comment failed", e);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-card w-full max-w-lg max-h-[90vh] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Header with Tabs */}
                <div className="p-4 border-b border-border bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-black flex items-center gap-2">
                                <Droplets className="text-cyan-500 fill-current" />
                                Wellness Tracker
                            </h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex bg-black/20 p-1 rounded-xl">
                        <button
                            onClick={() => setView('my')}
                            className={cn(
                                "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                                view === 'my' ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            My Health
                        </button>
                        <button
                            onClick={() => setView('partner')}
                            className={cn(
                                "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                                view === 'partner' ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            {role === 'sajid' ? "Nasywa's" : "Sajid's"} Health
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                    {/* Water Tracker */}
                    <div className="bg-cyan-500/5 rounded-3xl p-6 border border-cyan-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-cyan-400 flex items-center gap-2">
                                <Droplets className="w-5 h-5" />
                                Water Intake
                            </h4>
                            <span className="text-2xl font-black text-white">{activeLog.water} <span className="text-sm font-medium text-muted-foreground">glasses</span></span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {Array.from({ length: Math.max(8, activeLog.water) }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={cn(
                                        "w-8 h-12 rounded-lg border-2 transition-all",
                                        i < activeLog.water
                                            ? "bg-cyan-500 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                            : "border-white/10 bg-white/5"
                                    )}
                                />
                            ))}
                        </div>
                        {view === 'my' && (
                            <button
                                onClick={addWater}
                                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Drink Water
                            </button>
                        )}
                    </div>

                    {/* Meal Tracker */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-white flex items-center gap-2 px-1">
                            <Utensils className="w-5 h-5" />
                            Today's Meals
                        </h4>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'breakfast', icon: Sun, label: 'Breakfast', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                                { id: 'lunch', icon: Sun, label: 'Lunch', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
                                { id: 'dinner', icon: Moon, label: 'Dinner', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                                { id: 'snack', icon: Coffee, label: 'Snacks', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                            ].map((item) => {
                                const meal = item.id === 'snack' ? null : activeLog.meals[item.id as keyof typeof activeLog.meals] as Meal | undefined;
                                const snacks = item.id === 'snack' ? activeLog.meals.snacks : [];

                                return (
                                    <div key={item.id} className={cn("p-4 rounded-2xl border transition-all", item.bg, item.border)}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("p-2 rounded-lg bg-black/20", item.color)}>
                                                    <item.icon className="w-5 h-5" />
                                                </div>
                                                <span className="font-bold text-sm tracking-wide uppercase">{item.label}</span>
                                            </div>
                                            {view === 'my' && (
                                                <button
                                                    onClick={() => setModalOpen(item.id as any)}
                                                    className="p-1.5 hover:bg-black/20 rounded-lg transition-colors"
                                                >
                                                    <Plus className="w-4 h-4 opacity-50" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Display content */}
                                        {item.id !== 'snack' && meal ? (
                                            <div className="pl-12">
                                                <p className="font-medium text-white">{meal.description}</p>
                                                <p className="text-xs opacity-50 font-mono mt-1">{meal.time}</p>
                                            </div>
                                        ) : item.id === 'snack' && snacks.length > 0 ? (
                                            <div className="pl-12 space-y-2">
                                                {snacks.map(s => (
                                                    <div key={s.id}>
                                                        <p className="font-medium text-white">{s.description}</p>
                                                        <p className="text-xs opacity-50 font-mono">{s.time}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="pl-12 text-sm italic opacity-30">No entry yet...</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>


                    {/* Comments Section - Only show if log exists */}
                    {activeLog.id && (
                        <div className="space-y-4 pt-4 border-t border-border">
                            <h4 className="font-bold text-white flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Comments & Encouragement
                            </h4>

                            <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {activeLog.comments.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">No comments yet. Cheer them on!</p>
                                ) : (
                                    activeLog.comments.map(c => (
                                        <div key={c.id} className={cn(
                                            "p-3 rounded-2xl text-sm",
                                            c.sender === role ? "bg-primary/20 ml-8 text-right" : "bg-muted mr-8 text-left"
                                        )}>
                                            <p>{c.text}</p>
                                            <p className="text-[10px] opacity-50 mt-1 uppercase font-bold">{c.sender}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                    placeholder="Write a supportive message..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-cyan-500"
                                    onKeyDown={(e) => e.key === 'Enter' && addComment()}
                                />
                                <button
                                    onClick={addComment}
                                    className="p-2.5 bg-cyan-500 text-black rounded-xl hover:bg-cyan-400 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Add Meal Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="absolute inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="w-full max-w-sm bg-zinc-900 border border-white/20 p-6 rounded-3xl shadow-2xl"
                        >
                            <h3 className="font-bold text-lg mb-4">Add {modalOpen.charAt(0).toUpperCase() + modalOpen.slice(1)}</h3>
                            <input
                                autoFocus
                                value={mealInput}
                                onChange={(e) => setMealInput(e.target.value)}
                                placeholder="What did you eat?"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors mb-4"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && mealInput.trim()) {
                                        addMeal(modalOpen, mealInput);
                                        setMealInput("");
                                        setModalOpen(null);
                                    }
                                }}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setModalOpen(null)}
                                    className="flex-1 py-3 items-center justify-center rounded-xl font-bold bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (mealInput.trim()) {
                                            addMeal(modalOpen, mealInput);
                                            setMealInput("");
                                            setModalOpen(null);
                                        }
                                    }}
                                    className="flex-1 py-3 items-center justify-center rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
