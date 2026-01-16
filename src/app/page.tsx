"use client";

import { useState } from "react";
import LoginScreen from "@/components/LoginScreen";
import SajidDashboard from "@/components/SajidDashboard";
import NasywaDashboard from "@/components/NasywaDashboard";
import AdminDashboard from "@/components/AdminDashboard";

export default function Home() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  const handleLogin = (userData: { name: string; role: string }) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (user.role === "sajid") {
    return <SajidDashboard user={user} onLogout={handleLogout} />;
  }

  if (user.role === "nasywa") {
    return <NasywaDashboard user={user} onLogout={handleLogout} />;
  }

  if (user.role === "admin") {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  return null;
}
