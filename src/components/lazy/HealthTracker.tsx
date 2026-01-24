import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Utensils, Coffee, Moon, Sun, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Meal {
    id: string;
    description: string;
    calories?: number;
    time: string;
}

interface DayLog {
    date: string;
    water: number; // glasses
    meals: {
        breakfast?: Meal;
        lunch?: Meal;
        dinner?: Meal;
        snacks: Meal[];
    };
}

export default function HealthTracker({ onClose, role }: { onClose: () => void, role: string }) {
    const [waterCount, setWaterCount] = useState(0);
    const [meals, setMeals] = useState<{
        breakfast?: Meal;
        lunch?: Meal;
        dinner?: Meal;
        snacks: Meal[];
    }>({ snacks: [] });

    // In a real app, you'd fetch this from the API
    useEffect(() => {
        const today = new Date().toLocaleDateString();
        const stored = localStorage.getItem(`health_${role}_${today}`);
        if (stored) {
            const data = JSON.parse(stored);
            setWaterCount(data.water || 0);
            setMeals(data.meals || { snacks: [] });
        }
    }, [role]);

    const saveToday = (newWater: number, newMeals: any) => {
        const today = new Date().toLocaleDateString();
        localStorage.setItem(`health_${role}_${today}`, JSON.stringify({
            water: newWater,
            meals: newMeals
        }));
    };

    const addWater = () => {
        const newCount = waterCount + 1;
        setWaterCount(newCount);
        saveToday(newCount, meals);
    };

    const addMeal = (type: 'breakfast' | 'lunch' | 'dinner' | 'snack', description: string) => {
        const meal: Meal = {
            id: Date.now().toString(),
            description,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const newMeals = { ...meals };
        if (type === 'snack') {
            newMeals.snacks = [...newMeals.snacks, meal];
        } else {
            newMeals[type] = meal;
        }

        setMeals(newMeals);
        saveToday(waterCount, newMeals);
    };

    const [modalOpen, setModalOpen] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | null>(null);
    const [mealInput, setMealInput] = useState("");

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
                <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                    <div>
                        <h3 className="text-2xl font-black flex items-center gap-3">
                            <Droplets className="text-cyan-500 fill-current" />
                            Daily Wellness
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Stay hydrated & healthy</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                    {/* Water Tracker */}
                    <div className="bg-cyan-500/5 rounded-3xl p-6 border border-cyan-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-cyan-400 flex items-center gap-2">
                                <Droplets className="w-5 h-5" />
                                Water Intake
                            </h4>
                            <span className="text-2xl font-black text-white">{waterCount} <span className="text-sm font-medium text-muted-foreground">glasses</span></span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {Array.from({ length: Math.max(8, waterCount) }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={cn(
                                        "w-8 h-12 rounded-lg border-2 transition-all",
                                        i < waterCount
                                            ? "bg-cyan-500 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                            : "border-white/10 bg-white/5"
                                    )}
                                />
                            ))}
                        </div>
                        <button
                            onClick={addWater}
                            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Drink Water
                        </button>
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
                                const meal = item.id === 'snack' ? null : meals[item.id as keyof typeof meals] as Meal | undefined;
                                const snacks = item.id === 'snack' ? meals.snacks : [];

                                return (
                                    <div key={item.id} className={cn("p-4 rounded-2xl border transition-all", item.bg, item.border)}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("p-2 rounded-lg bg-black/20", item.color)}>
                                                    <item.icon className="w-5 h-5" />
                                                </div>
                                                <span className="font-bold text-sm tracking-wide uppercase">{item.label}</span>
                                            </div>
                                            <button
                                                onClick={() => setModalOpen(item.id as any)}
                                                className="p-1.5 hover:bg-black/20 rounded-lg transition-colors"
                                            >
                                                <Plus className="w-4 h-4 opacity-50" />
                                            </button>
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
