import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, X } from "lucide-react";

export default function JarOverlay({ notes, onClose, onAdd, role }: { notes: any[], onClose: () => void, onAdd: (content: string) => void, role: string }) {
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
                className="bg-card w-full max-w-2xl max-h-[90vh] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col"
            >
                <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                    <div>
                        <h3 className="text-2xl font-black flex items-center gap-3">
                            <Heart className="text-amber-500 fill-current" />
                            Jar of Hearts
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Daily gratitude & compliments</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
                    <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-sm font-bold mb-3 text-amber-500">✨ Write something you appreciate about your partner today:</p>
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Today I appreciate you for..."
                            className="w-full bg-transparent resize-none outline-none text-sm font-medium italic placeholder:text-muted-foreground/30 min-h-[80px]"
                        />
                        <button
                            onClick={() => {
                                if (newNote.trim()) {
                                    onAdd(newNote);
                                    setNewNote("");
                                }
                            }}
                            className="w-full py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2 mt-3"
                        >
                            <Heart className="w-4 h-4 fill-current" />
                            Add to Jar
                        </button>
                    </div>

                    <div className="space-y-4">
                        {notes.map((note, idx) => (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                            >
                                <p className="text-sm italic">"{note.content}"</p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-[10px] font-bold text-amber-500 uppercase">— {note.author}</span>
                                    <span className="text-[10px] text-muted-foreground">{new Date(note.createdAt).toLocaleDateString()}</span>
                                </div>
                            </motion.div>
                        ))}
                        {notes.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Heart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p className="text-sm">No notes yet. Be the first to add one!</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
