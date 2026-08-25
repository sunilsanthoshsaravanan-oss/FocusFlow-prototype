import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  Activity,
  BarChart3,
  Bell,
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
  TrendingUp,
  Users,
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

/* =========================
   FRONTEND-ONLY DEMO API
========================= */

const API = "";

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

async function api(path, options = {}) {
  // Frontend-only demo data.
  // No backend or environment variable required.

  if (path === "/api/stats/daily") {
    return {
      focus_minutes: 120,
      distraction_score: 18,
    };
  }

  if (path === "/api/stats/anomaly") {
    return {
      anomaly_score: 0,
      message: "No anomaly detected.",
      user_baseline: 8,
      learned_days: 7,
    };
  }

  if (path === "/api/stats/analytics") {
    return {
      daily_streak: 7,
      average_session_length: 25,
      personal_best_minutes: 90,
      monthly_focus_minutes: 420,

      weekly_trend: [
        { label: "Mon", avg_distraction: 20 },
        { label: "Tue", avg_distraction: 35 },
        { label: "Wed", avg_distraction: 28 },
        { label: "Thu", avg_distraction: 40 },
        { label: "Fri", avg_distraction: 32 },
        { label: "Sat", avg_distraction: 18 },
        { label: "Sun", avg_distraction: 15 },
      ],

      most_distracting_apps: [
        { app: "Instagram", switches: 18 },
        { app: "YouTube", switches: 12 },
        { app: "WhatsApp", switches: 9 },
        { app: "BGMI", switches: 6 },
      ],

      peak_hours: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: (i * 3) % 6,
      })),
    };
  }

  if (path.startsWith("/api/history")) {
    return {
      total_focus_minutes: 120,
      sessions: [],
    };
  }

  if (path === "/api/session") {
    return {
      id: Date.now(),
    };
  }

  if (path.startsWith("/api/session/")) {
    return {
      success: true,
    };
  }

  if (path === "/api/event") {
    return {
      id: Date.now(),
      success: true,
    };
  }

  return {};
}

/* =========================
   SETTINGS
========================= */

const defaultSettings = {
  sensitivity: "Medium",
  favorites: [],
  peak: "18:00-21:00",
  duration: 25,
  threshold: 60,
  notifications: true,
  share: false,
};

function getSettings() {
  try {
    const saved = localStorage.getItem("ff_settings");
    return saved ? JSON.parse(saved) : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings) {
  localStorage.setItem("ff_settings", JSON.stringify(settings));
}

/* =========================
   NOTIFICATIONS
========================= */

function notify(title, body) {
  const settings = getSettings();

  if (!settings.notifications) return;

  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

async function enableNotifications() {
  if ("Notification" in window) {
    await Notification.requestPermission();
  }
}

/* =========================
   UI COMPONENTS
========================= */

function Ring({ score }) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="ring">
      <svg viewBox="0 0 150 150">
        <circle
          className="rb"
          cx="75"
          cy="75"
          r={radius}
        />

        <circle
          className="rv"
          cx="75"
          cy="75"
          r={radius}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>

      <b>{score}</b>
      <small>/ 100</small>
    </div>
  );
}

function Top({ title, onHome }) {
  return (
    <header>
      <button className="icon" onClick={onHome}>
        <Home size={17} />
      </button>

      <strong>
        <Target size={16} />
        {title}
      </strong>

      <span className="live">● LIVE</span>
    </header>
  );
}

function Card({ children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      {children}
    </section>
  );
}

/* =========================
   DASHBOARD
========================= */

function Dashboard({
  go,
  score,
  setScore,
  sessionId,
  setSessionId,
}) {
  const [events, setEvents] = useState([]);
  const [anomaly, setAnomaly] = useState(null);
  const [monitor, setMonitor] = useState(false);

  useEffect(() => {
    Promise.all([
      api("/api/stats/daily"),
      api("/api/stats/anomaly"),
    ])
      .then(([, anomalyData]) => {
        setAnomaly(anomalyData);
      })
      .catch(() => {});
  }, []);

  const apps = [
    "Instagram",
    "YouTube",
    "WhatsApp",
    "Chrome",
    "Spotify",
    "BGMI",
  ];

  async function switchApp(app) {
    const category = CATEGORIES[app] || "other";

    const increase =
      category === "gaming" ? 10 : 7;

    const next = Math.min(100, score + increase);

    setScore(next);

    await api("/api/event", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        app_name: app,
        category,
        distraction_score: next,
      }),
    });

    setEvents((current) => [
      {
        app,
        category,
        score: next,
        time: new Date().toLocaleTimeString(),
      },
      ...current,
    ].slice(0, 5));

    if (next >= 60) {
      notify(
        "FocusFlow Warning",
        "Your distraction score reached 60."
      );
    }

    if (category === "gaming") {
      notify(
        "Gaming Focus Mode",
        "45-minute focus recommendation available."
      );
    }
  }

  async function autoTest() {
    setMonitor(true);

    const sequence = [
      "Instagram",
      "YouTube",
      "WhatsApp",
      "Instagram",
      "BGMI",
      "Instagram",
    ];

    for (const app of sequence) {
      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      await switchApp(app);
    }

    setMonitor(false);
  }

  function reset() {
    setScore(18);
    setEvents([]);
    setSessionId(null);
  }

  return (
    <>
      <Top
        title="FocusFlow"
        onHome={() => {}}
      />

      <main>
        <div className="hero">
          <span className="eyebrow">
            <Sparkles size={13} />
            BEHAVIOR-AWARE PRODUCTIVITY
          </span>

          <h1>
            Your attention, <em>protected.</em>
          </h1>

          <p>
            Detect distraction patterns, explain the score,
            and turn the signal into a focused action.
          </p>
        </div>

        <Card>
          <div className="row">
            <div>
              <span className="eyebrow">
                LIVE DISTRACTION SCORE
              </span>

              <h3 className={score >= 60 ? "danger" : "good"}>
                ● {score >= 60 ? "Distracted" : "Focused"}
              </h3>
            </div>

            <Activity />
          </div>

          <Ring score={score} />

          <div className="reason">
            <b>WHY</b>{" "}
            {events.length > 0
              ? `Recent ${events[0].category} activity increased the score.`
              : "No major distraction signal detected yet."}
          </div>
        </Card>

        {anomaly?.anomaly_score > 0 && (
          <div className="alert">
            <TrendingUp size={17} />

            <div>
              <b>{anomaly.message}</b>

              <span>
                Baseline: {anomaly.user_baseline} switches/day
                {" • "}
                learned from {anomaly.learned_days} day(s).
              </span>
            </div>
          </div>
        )}

        <Card>
          <div className="row">
            <div>
              <span className="eyebrow">
                SMART RECOMMENDATION
              </span>

              <h2>
                {score >= 60 ? "25" : "10"}-minute Focus Session
              </h2>

              <p>
                {score >= 60
                  ? "Your distraction level is elevated. A deep-focus reset is recommended."
                  : "Start small and build attention momentum."}
              </p>
            </div>

            <button
              className="round"
              onClick={() => go("focus")}
            >
              <Play size={16} />
            </button>
          </div>
        </Card>

        <div className="grid2">
          <button
            className="action"
            onClick={() => go("analytics")}
          >
            <BarChart3 />
            <b>Analytics</b>
            <span>Weekly trends & app patterns</span>
          </button>

          <button
            className="action"
            onClick={() => go("history")}
          >
            <Clock3 />
            <b>Session History</b>
            <span>Review every focus session</span>
          </button>

          <button
            className="action"
            onClick={() => go("gaming")}
          >
            <Gamepad2 />
            <b>Gaming Focus</b>
            <span>iQOO-aware gaming experience</span>
          </button>

          <button
            className="action"
            onClick={() => go("settings")}
          >
            <Settings />
            <b>Settings</b>
            <span>Personalize detection</span>
          </button>
        </div>

        <div className="label">
          TRY THE LIVE SIMULATION
        </div>

        <Card>
          <div className="row">
            <div>
              <h2>Distraction Lab</h2>

              <p>
                Simulate app switching and watch the score change.
              </p>
            </div>

            <button
              className="primary"
              onClick={autoTest}
              disabled={monitor}
            >
              {monitor ? "Running…" : "Run test"}
            </button>
          </div>

          <div className="appgrid">
            {apps.map((app) => (
              <button
                key={app}
                onClick={() => switchApp(app)}
              >
                <Smartphone size={15} />
                {app}
              </button>
            ))}
          </div>

          {events.length > 0 && (
            <div className="log">
              {events.map((event, index) => (
                <div key={index}>
                  <span>{event.time}</span>

                  <b>{event.app}</b>

                  <small>
                    {event.category} • score {event.score}
                  </small>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="two">
          <button
            className="secondary"
            onClick={() => go("focus")}
          >
            Start Focus Mode
          </button>

          <button
            className="secondary"
            onClick={reset}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        <div className="honest">
          <CheckCircle2 size={16} />

          <span>
            <b>Technically honest MVP:</b>{" "}
            the web version simulates device behavior.
            Android telemetry and hardware controls would
            require an Android integration/partner implementation.
          </span>
        </div>
      </main>
    </>
  );
}

/* =========================
   ANALYTICS
========================= */

function Analytics({ go }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/api/stats/analytics")
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <Page title="Analytics" go={go}>
        <Card>Loading analytics…</Card>
      </Page>
    );
  }

  return (
    <Page title="Analytics" go={go}>
      <div className="grid4">
        <Metric
          icon={<Flame />}
          value={data.daily_streak}
          label="Day streak"
        />

        <Metric
          icon={<Clock3 />}
          value={`${data.average_session_length}m`}
          label="Avg session"
        />

        <Metric
          icon={<Target />}
          value={`${data.personal_best_minutes}m`}
          label="Personal best"
        />

        <Metric
          icon={<Timer />}
          value={`${data.monthly_focus_minutes}m`}
          label="Month focus"
        />
      </div>

      <Card>
        <h2>Weekly distraction trend</h2>

        <Chart
          data={data.weekly_trend}
          dataKey="avg_distraction"
          type="line"
        />
      </Card>

      <Card>
        <h2>Most distracting apps</h2>

        <Chart
          data={data.most_distracting_apps}
          dataKey="switches"
          type="bar"
          x="app"
        />
      </Card>

      <Card>
        <h2>Best focus time of day</h2>

        <div className="heat">
          {data.peak_hours.map((item) => (
            <div
              key={item.hour}
              title={`${item.hour}:00 • ${item.count} sessions`}
              style={{
                opacity:
                  0.18 +
                  Math.min(item.count, 5) * 0.16,
              }}
            >
              {item.hour}
            </div>
          ))}
        </div>

        <p className="muted">
          Darker cells represent more completed sessions.
        </p>
      </Card>
    </Page>
  );
}

function Chart({
  data,
  dataKey,
  type,
  x = "label",
}) {
  return (
    <div className="chart">
      <ResponsiveContainer
        width="100%"
        height={220}
      >
        {type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid stroke="#202a38" />
            <XAxis
              dataKey={x}
              stroke="#748095"
            />
            <YAxis stroke="#748095" />
            <Tooltip />

            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#72a4ff"
              strokeWidth={3}
            />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid stroke="#202a38" />

            <XAxis
              dataKey={x}
              stroke="#748095"
            />

            <YAxis stroke="#748095" />

            <Tooltip />

            <Bar
              dataKey={dataKey}
              fill="#72a4ff"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function Metric({ icon, value, label }) {
  return (
    <Card className="metric">
      {icon}
      <b>{value}</b>
      <span>{label}</span>
    </Card>
  );
}

/* =========================
   FOCUS MODE
========================= */

function Focus({ go, score, setScore }) {
  const [selected, setSelected] = useState(
    score >= 60 ? 25 : 10
  );

  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [startScore, setStartScore] = useState(score);

  useEffect(() => {
    if (
      !running ||
      paused ||
      left <= 0
    ) {
      return;
    }

    const timer = setInterval(() => {
      setLeft((value) =>
        Math.max(0, value - 1)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [running, paused, left]);

  useEffect(() => {
    if (!running || left !== 0) {
      return;
    }

    setRunning(false);

    const newScore = Math.max(
      5,
      Math.round(startScore * 0.35)
    );

    setScore(newScore);

    notify(
      "FocusFlow",
      "Focus session completed! Great work."
    );
  }, [
    left,
    running,
    startScore,
    setScore,
  ]);

  function start() {
    setStartScore(score);
    setLeft(selected * 60);
    setRunning(true);
    setPaused(false);
  }

  function endSession() {
    setRunning(false);
    setLeft(0);
    go("history");
  }

  return (
    <Page title="Focus Mode" go={go}>
      <div className="focus">
        <div className="focusorb">
          <Target size={30} />
        </div>

        <span className="eyebrow">
          FOCUS MODE
        </span>

        <h1>
          {running
            ? "You're in the flow."
            : "Choose your focus."}
        </h1>

        <p>
          {running
            ? "Stay focused on your current task."
            : "Pick a session that matches your energy."}
        </p>

        {!running ? (
          <>
            <div className="durations">
              {[10, 25, 45].map((minutes) => (
                <button
                  key={minutes}
                  className={
                    selected === minutes
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setSelected(minutes)
                  }
                >
                  <b>{minutes}</b>
                  <small>minutes</small>
                </button>
              ))}
            </div>

            <button
              className="primary wide"
              onClick={start}
            >
              <Play size={15} />
              Start session
            </button>
          </>
        ) : (
          <>
            <div className="timer">
              {String(
                Math.floor(left / 60)
              ).padStart(2, "0")}
              :
              {String(left % 60).padStart(
                2,
                "0"
              )}
            </div>

            <div className="progress">
              <i
                style={{
                  width: `${
                    100 -
                    (left /
                      (selected * 60)) *
                      100
                  }%`,
                }}
              />
            </div>

            <div className="two">
              <button
                className="secondary"
                onClick={() =>
                  setPaused(!paused)
                }
              >
                {paused ? "Resume" : "Pause"}
              </button>

              <button
                className="secondary"
                onClick={endSession}
              >
                End
              </button>
            </div>
          </>
        )}
      </div>
    </Page>
  );
}

/* =========================
   HISTORY
========================= */

function History({ go }) {
  const [period, setPeriod] =
    useState("month");

  const [data, setData] =
    useState(null);

  useEffect(() => {
    api(`/api/history?period=${period}`)
      .then(setData)
      .catch(() => {});
  }, [period]);

  return (
    <Page
      title="Session History"
      go={go}
    >
      <div className="tabs">
        {["today", "week", "month"].map(
          (item) => (
            <button
              key={item}
              className={
                period === item
                  ? "on"
                  : ""
              }
              onClick={() =>
                setPeriod(item)
              }
            >
              {item}
            </button>
          )
        )}
      </div>

      <Card>
        <h2>
          Total focus this period
        </h2>

        <div className="big">
          {data?.total_focus_minutes || 0} min
        </div>
      </Card>

      {(data?.sessions || []).map(
        (session) => (
          <Card key={session.id}>
            <div className="row">
              <div>
                <span className="eyebrow">
                  {new Date(
                    session.date_time
                  ).toLocaleString()}
                </span>

                <h3>
                  {session.actual_minutes} /{" "}
                  {session.planned_minutes} min
                </h3>

                <p>
                  {session.interruptions}{" "}
                  interruptions •{" "}
                  {(session.apps || []).join(
                    ", "
                  ) || "No apps"}
                </p>
              </div>

              <b
                className={
                  session.completed
                    ? "good"
                    : "warn"
                }
              >
                {Math.round(
                  session.focus_score
                )}
                %
              </b>
            </div>
          </Card>
        )
      )}
    </Page>
  );
}

/* =========================
   GAMING
========================= */

function Gaming({ go }) {
  return (
    <Page
      title="iQOO Gaming Focus"
      go={go}
    >
      <div className="gamingHero">
        <Gamepad2 size={32} />

        <span className="eyebrow">
          iQOO-READY CONCEPT
        </span>

        <h1>
          Gaming Focus Mode
        </h1>

        <p>
          Recommendations tailored for
          iQOO users and gaming sessions.
        </p>
      </div>

      <Card>
        <h2>
          45-minute focus recommendation
        </h2>

        <p>
          Gaming apps are categorized
          separately, so FocusFlow uses a
          longer intervention aligned with
          a typical gaming session.
        </p>

        <button
          className="primary wide"
          onClick={() => go("focus")}
        >
          Start 45-min Focus
        </button>
      </Card>

      <div className="grid2">
        <Card>
          <Gamepad2 />
          <h3>
            Performance Mode
          </h3>
          <p>
            iQOO Performance Mode
            recommendation.
          </p>
        </Card>

        <Card>
          <Bell />
          <h3>
            Notifications
          </h3>
          <p>
            Disable notifications while
            gaming.
          </p>
        </Card>

        <Card>
          <Sparkles />
          <h3>
            Gaming Session
          </h3>
          <p>
            High-refresh-rate mode
            recommended.
          </p>
        </Card>

        <Card>
          <TrendingUp />
          <h3>
            Post-session
          </h3>
          <p>
            Example focus score:
            <b> 87%</b>
          </p>
        </Card>
      </div>

      <div className="honest">
        <CheckCircle2 size={16} />

        <span>
          <b>Partner integration note:</b>{" "}
          hardware controls shown here
          are recommendations, not browser
          hardware-control claims.
        </span>
      </div>
    </Page>
  );
}

/* =========================
   SETTINGS
========================= */

function SettingsPage({ go }) {
  const [settings, setSettings] =
    useState(getSettings());

  function update(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  return (
    <Page title="Settings" go={go}>
      <Card>
        <h2>
          Detection sensitivity
        </h2>

        <div className="seg">
          {["Low", "Medium", "High"].map(
            (value) => (
              <button
                key={value}
                className={
                  settings.sensitivity ===
                  value
                    ? "on"
                    : ""
                }
                onClick={() =>
                  update(
                    "sensitivity",
                    value
                  )
                }
              >
                {value}
              </button>
            )
          )}
        </div>
      </Card>

      <Card>
        <h2>
          Favorite apps / whitelist
        </h2>

        <p className="muted">
          Whitelisted apps are not counted
          toward distraction in the
          production Android implementation.
        </p>

        <div className="appgrid">
          {[
            "Chrome",
            "Spotify",
            "WhatsApp",
          ].map((app) => {
            const selected =
              settings.favorites.includes(
                app
              );

            return (
              <button
                key={app}
                className={
                  selected
                    ? "chosen"
                    : ""
                }
                onClick={() =>
                  update(
                    "favorites",
                    selected
                      ? settings.favorites.filter(
                          (item) =>
                            item !== app
                        )
                      : [
                          ...settings.favorites,
                          app,
                        ]
                  )
                }
              >
                {app}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2>
          Peak productivity hours
        </h2>

        <input
          value={settings.peak}
          onChange={(event) =>
            update(
              "peak",
              event.target.value
            )
          }
        />
      </Card>

      <Card>
        <h2>
          Default focus duration
        </h2>

        <select
          value={settings.duration}
          onChange={(event) =>
            update(
              "duration",
              Number(event.target.value)
            )
          }
        >
          {[10, 20, 25, 45, 50].map(
            (value) => (
              <option
                key={value}
                value={value}
              >
                {value}
              </option>
            )
          )}
        </select>
      </Card>

      <Card>
        <h2>
          Auto-focus threshold
        </h2>

        <input
          type="range"
          min="30"
          max="90"
          value={settings.threshold}
          onChange={(event) =>
            update(
              "threshold",
              Number(event.target.value)
            )
          }
        />

        <b>{settings.threshold}</b>
      </Card>

      <Card>
        <h2>
          Notifications
        </h2>

        <button
          className="secondary wide"
          onClick={async () => {
            const enable =
              !settings.notifications;

            update(
              "notifications",
              enable
            );

            if (enable) {
              await enableNotifications();
            }
          }}
        >
          {settings.notifications
            ? "Notifications enabled"
            : "Notifications disabled"}
        </button>
      </Card>

      <Card>
        <h2>
          Data export
        </h2>

        <button
          className="secondary wide"
          onClick={() => {
            alert(
              "CSV export will be available in the Android/backend version."
            );
          }}
        >
          <Download size={15} />
          Download report CSV
        </button>
      </Card>
    </Page>
  );
}

/* =========================
   SOCIAL
========================= */

function Social({ go }) {
  const status =
    "I'm on a 7-day focus streak! 🔥";

  return (
    <Page
      title="Social Accountability"
      go={go}
    >
      <Card>
        <Users />

        <h2>
          Share your streak
        </h2>

        <p>
          “{status}”
        </p>

        <button
          className="primary wide"
          onClick={() =>
            navigator.clipboard?.writeText(
              status
            )
          }
        >
          Copy status
        </button>
      </Card>

      <Card>
        <h2>
          Anonymous leaderboard
        </h2>

        {[
          "FocusFox",
          "PixelMind",
          "QuietCoder",
          "DeepWork",
          "NightOwl",
        ].map((name, index) => (
          <div
            className="leader"
            key={name}
          >
            <b>#{index + 1}</b>
            <span>{name}</span>
            <strong>
              {30 - index * 4} days
            </strong>
          </div>
        ))}
      </Card>

      <Card>
        <h2>
          Achievements
        </h2>

        <div className="badges">
          <span>
            🔥 1-day streak
          </span>

          <span>
            🏆 7-day streak
          </span>

          <span>
            ⚡ Speed Focused
          </span>

          <span>
            🎯 45-min record
          </span>
        </div>
      </Card>
    </Page>
  );
}

/* =========================
   PAGE
========================= */

function Page({
  title,
  go,
  children,
}) {
  return (
    <>
      <Top
        title={title}
        onHome={() => go("home")}
      />

      <main>
        <button
          className="back"
          onClick={() => go("home")}
        >
          ← Dashboard
        </button>

        {children}
      </main>
    </>
  );
}

/* =========================
   APP
========================= */

function App() {
  const [screen, setScreen] =
    useState("home");

  const [score, setScore] =
    useState(18);

  const [sessionId, setSessionId] =
    useState(null);

  function go(screenName) {
    setScreen(screenName);
  }

  const props = {
    go,
    score,
    setScore,
    sessionId,
    setSessionId,
  };

  if (screen === "analytics") {
    return <Analytics go={go} />;
  }

  if (screen === "focus") {
    return <Focus {...props} />;
  }

  if (screen === "history") {
    return <History go={go} />;
  }

  if (screen === "gaming") {
    return <Gaming go={go} />;
  }

  if (screen === "settings") {
    return <SettingsPage go={go} />;
  }

  if (screen === "social") {
    return <Social go={go} />;
  }

  return <Dashboard {...props} />;
}

/* =========================
   START REACT
========================= */

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
