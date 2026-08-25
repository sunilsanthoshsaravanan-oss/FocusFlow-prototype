import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  CheckCircle2,
  Clock3,
  Download,
  Flame,
  Gamepad2,
  Home,
  Play,
  RotateCcw,
  Settings,
  Smartphone,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import {
  BarChart,
  Bar,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "./style.css";

/* ✅ CHANGE THIS LINE ONLY */
const API = import.meta.env.VITE_API_URL || "";

const GAMES = [
  "PUBG",
  "COD",
  "Genshin",
  "BGMI",
  "Free Fire",
  "Valorant Mobile",
];

const CATEGORIES = {
  Instagram: "social",
  YouTube: "streaming",
  WhatsApp: "social",
  Chrome: "work",
  Spotify: "streaming",
  PUBG: "gaming",
  COD: "gaming",
  Genshin: "gaming",
  BGMI: "gaming",
  "Free Fire": "gaming",
  "Valorant Mobile": "gaming",
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
