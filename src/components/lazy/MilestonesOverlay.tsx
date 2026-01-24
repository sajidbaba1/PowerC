import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MilestonesOverlay({ milestones, onClose, onAdd, role }: { milestones: any[], onClose: () => void, onAdd: (data: any) => void, role: string }) {
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-8"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-card w-full max-w-2xl max-h-[90vh] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col"
            >
                <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                    <div>
                        <h3 className="text-2xl font-black flex items-center gap-3">
                            <Calendar className="text-indigo-500" />
                            Our Journey
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Every step of the way</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
                    <div className="space-y-8 relative">
                        {/* Timeline line */}
                        <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-500/50 to-purple-500/50" />

                        {milestones.map((m, idx) => {
                            const mDate = new Date(m.date);
                            const diff = mDate.getTime() - Date.now();
                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                            const isPast = days < 0;

                            return (
                                <motion.div
                                    key={m.id}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex gap-6 relative"
                                >
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border-2 border-background z-10 shrink-0 mt-1",
                                        isPast ? "bg-indigo-500" : "bg-white border-indigo-500 animate-pulse"
                                    )} />
                                    <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
                                        <h4 className="font-black text-sm uppercase tracking-wider">{m.title}</h4>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{mDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                            <span className={cn(
                                                "text-[10px] font-black px-2 py-0.5 rounded-full",
                                                isPast ? "bg-white/10 text-white/50" : "bg-green-500/20 text-green-500"
                                            )}>
                                                {isPast ? "COMPLETED" : `${Math.abs(days)} DAYS TO GO`}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        <div className="flex gap-6 relative">
                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-indigo-500/50 z-10 shrink-0 mt-1" />
                            <div className="flex-1 p-6 rounded-2xl bg-indigo-500/5 border-2 border-dashed border-indigo-500/20 flex flex-col gap-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Event Name"
                                        className="bg-transparent border-b border-white/10 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                                    />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="bg-transparent border-b border-white/10 py-2 text-sm outline-none focus:border-indigo-500 transition-colors text-white/70"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        if (title && date) {
                                            onAdd({ title, date });
                                            setTitle("");
                                            setDate("");
                                        }
                                    }}
                                    className="w-full py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Milestone
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
