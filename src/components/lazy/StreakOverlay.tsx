"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Flame, Heart, Calendar, Trophy, TrendingUp } from "lucide-react";

interface StreakOverlayProps {
    onClose: () => void;
}

interface HeatmapData {
    date: string;
    level: number;
    count: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StreakOverlay({ onClose }: StreakOverlayProps) {
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [totalActiveDays, setTotalActiveDays] = useState(0);
    const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
    const [todayActive, setTodayActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hoveredDay, setHoveredDay] = useState<HeatmapData | null>(null);

    useEffect(() => {
        fetchStreakData();
    }, []);

    const fetchStreakData = async () => {
        try {
            const res = await fetch("/api/streak");
            const data = await res.json();
            setCurrentStreak(data.currentStreak || 0);
            setLongestStreak(data.longestStreak || 0);
            setTotalActiveDays(data.totalActiveDays || 0);
            setHeatmapData(data.heatmapData || []);
            setTodayActive(data.todayActive || false);
        } catch (error) {
            console.error("Failed to fetch streak data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Get level color
    const getLevelColor = (level: number) => {
        switch (level) {
            case 0: return "bg-white/5";
            case 1: return "bg-pink-500/30";
            case 2: return "bg-pink-500/50";
            case 3: return "bg-pink-500/70";
            case 4: return "bg-pink-500";
            default: return "bg-white/5";
        }
    };

    // Organize data into weeks for the heatmap grid
    const getWeeks = () => {
        const weeks: HeatmapData[][] = [];
        let currentWeek: HeatmapData[] = [];

        // Find the starting day of the week for the first date
        if (heatmapData.length > 0) {
            const firstDate = new Date(heatmapData[0].date);
            const startDay = firstDate.getDay();

            // Add empty slots for days before the first date
            for (let i = 0; i < startDay; i++) {
                currentWeek.push({ date: '', level: -1, count: 0 });
            }
        }

        heatmapData.forEach((data) => {
            currentWeek.push(data);
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });

        // Add remaining days
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        return weeks;
    };

    // Get month labels for the heatmap
    const getMonthLabels = () => {
        const labels: { month: string; index: number }[] = [];
        let lastMonth = -1;

        heatmapData.forEach((data, index) => {
            if (data.date) {
                const month = new Date(data.date).getMonth();
                if (month !== lastMonth) {
                    labels.push({ month: MONTHS[month], index: Math.floor(index / 7) });
                    lastMonth = month;
                }
            }
        });

        return labels;
    };

    const weeks = getWeeks();
    const monthLabels = getMonthLabels();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 lg:p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-card w-full max-w-4xl max-h-[90vh] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="p-4 lg:p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-pink-500/10 shrink-0">
                    <div>
                        <h3 className="text-xl lg:text-2xl font-black flex items-center gap-3">
                            <Flame className="text-orange-500" />
                            Love Streak
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">
                            Every day we talk, our bond grows stronger
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="p-4 lg:p-6 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 shrink-0">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Flame className="w-5 h-5 text-orange-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Streak</span>
                        </div>
                        <div className="text-3xl lg:text-4xl font-black text-orange-500">
                            {loading ? "..." : currentStreak}
                            <span className="text-sm font-bold text-muted-foreground ml-1">days</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Longest Streak</span>
                        </div>
                        <div className="text-3xl lg:text-4xl font-black text-yellow-500">
                            {loading ? "..." : longestStreak}
                            <span className="text-sm font-bold text-muted-foreground ml-1">days</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Heart className="w-5 h-5 text-pink-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Days</span>
                        </div>
                        <div className="text-3xl lg:text-4xl font-black text-pink-500">
                            {loading ? "..." : totalActiveDays}
                            <span className="text-sm font-bold text-muted-foreground ml-1">total</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-5 h-5 text-green-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Today</span>
                        </div>
                        <div className="text-xl lg:text-2xl font-black text-green-500">
                            {loading ? "..." : (todayActive ? "💕 Active!" : "Chat to streak!")}
                        </div>
                    </div>
                </div>

                {/* Heatmap Container */}
                <div className="flex-1 overflow-auto p-4 lg:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-bold text-muted-foreground">
                            <TrendingUp className="w-4 h-4 inline mr-2" />
                            Chat Activity - Last 365 Days
                        </span>
                        {hoveredDay && hoveredDay.date && (
                            <span className="text-xs bg-white/10 px-3 py-1 rounded-full">
                                {new Date(hoveredDay.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })} - {hoveredDay.count} messages
                            </span>
                        )}
                    </div>

                    {/* Month Labels */}
                    <div className="flex mb-1 ml-8 lg:ml-10">
                        <div className="flex relative w-full" style={{ minWidth: weeks.length * 12 + 'px' }}>
                            {monthLabels.map((label, i) => (
                                <span
                                    key={i}
                                    className="text-[10px] text-muted-foreground absolute"
                                    style={{ left: label.index * 12 + 'px' }}
                                >
                                    {label.month}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Heatmap Grid */}
                    <div className="flex gap-1 overflow-x-auto pb-4 custom-scrollbar">
                        {/* Day labels */}
                        <div className="flex flex-col gap-1 shrink-0 mr-1">
                            {DAYS.map((day, i) => (
                                <div key={day} className="h-2.5 lg:h-3 flex items-center">
                                    {i % 2 === 1 && (
                                        <span className="text-[8px] lg:text-[10px] text-muted-foreground w-6 lg:w-8">{day}</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Week columns */}
                        <div className="flex gap-[2px]">
                            {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="flex flex-col gap-[2px]">
                                    {week.map((day, dayIndex) => (
                                        <div
                                            key={`${weekIndex}-${dayIndex}`}
                                            className={`w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-sm cursor-pointer transition-all hover:scale-125 hover:ring-2 hover:ring-white/30 ${day.level === -1 ? 'invisible' : getLevelColor(day.level)
                                                }`}
                                            onMouseEnter={() => day.level !== -1 && setHoveredDay(day)}
                                            onMouseLeave={() => setHoveredDay(null)}
                                            title={day.date ? `${day.date}: ${day.count} messages` : ''}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-end gap-2 mt-4">
                        <span className="text-[10px] text-muted-foreground">Less</span>
                        <div className="flex gap-1">
                            {[0, 1, 2, 3, 4].map(level => (
                                <div
                                    key={level}
                                    className={`w-3 h-3 rounded-sm ${getLevelColor(level)}`}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">More</span>
                    </div>

                    {/* Motivational Message */}
                    <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 to-orange-500/10 border border-white/10 text-center">
                        {currentStreak >= 30 ? (
                            <p className="text-sm">🔥 Amazing! You've been chatting for <strong>{currentStreak} days</strong> straight! Your love is on fire!</p>
                        ) : currentStreak >= 7 ? (
                            <p className="text-sm">💫 Great going! <strong>{currentStreak} days</strong> of beautiful conversations. Keep it up!</p>
                        ) : currentStreak >= 1 ? (
                            <p className="text-sm">💕 {currentStreak} day{currentStreak > 1 ? 's' : ''} and counting! Every message brings you closer.</p>
                        ) : (
                            <p className="text-sm">💌 Start your streak today! Send a message to your love and watch the flame grow!</p>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
