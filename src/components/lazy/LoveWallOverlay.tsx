import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoveWallOverlay({ notes, onClose, onAdd, onDelete, role }: { notes: any[], onClose: () => void, onAdd: (text: string) => void, onDelete: (id: string) => void, role: string }) {
    const [newNote, setNewNote] = useState("");

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
                className="bg-card w-full max-w-4xl max-h-[90vh] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col"
            >
                <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-pink-500/10 to-rose-500/10">
                    <div>
                        <h3 className="text-2xl font-black flex items-center gap-3">
                            <Heart className="text-pink-500 fill-current" />
                            Our Love Wall
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Capture every sweet moment</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-6 rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col gap-4">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="I love when you..."
                                className="flex-1 bg-transparent resize-none outline-none text-sm font-medium italic placeholder:text-muted-foreground/30"
                            />
                            <button
                                onClick={() => {
                                    if (newNote.trim()) {
                                        onAdd(newNote);
                                        setNewNote("");
                                    }
                                }}
                                className="w-full py-2.5 bg-pink-500 text-white rounded-xl text-xs font-bold hover:bg-pink-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Note
                            </button>
                        </div>

                        {notes.map((note) => (
                            <motion.div
                                key={note.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-6 rounded-3xl bg-gradient-to-br from-pink-500/5 to-rose-500/5 border border-pink-500/20 shadow-lg relative group overflow-hidden"
                            >
                                <div className="absolute -top-4 -right-4 w-12 h-12 bg-pink-500/10 rounded-full blur-xl group-hover:bg-pink-500/20 transition-all" />
                                <p className="text-sm font-medium italic mb-4 leading-relaxed">{note.content || note.text}</p>
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black uppercase text-white", (note.sender || note.author) === 'sajid' ? 'bg-blue-500' : 'bg-pink-500')}>
                                            {(note.sender || note.author)?.[0] || '?'}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{new Date(note.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {(note.sender || note.author) === role && (
                                        <button
                                            onClick={() => onDelete(note.id)}
                                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-500 rounded-lg transition-all"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
