import React, { useEffect, useRef, useState } from "react";
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

/* =========================================================
   CONFIGURATION
   ========================================================= */

const API = import.meta.env.VITE_API_URL || "";

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

/* =========================================================
   FRONTEND / BACKEND API LAYER
   ========================================================= */

async function api(path, options = {}) {
  /*
   FRONTEND-ONLY MODE

   When VITE_API_URL is not configured, the application works
   entirely in the browser using demo data.
  */

  if (!API) {
    switch (true) {
      case path === "/api/stats/daily":
        return {};

      case path === "/api/stats/anomaly":
        return {
          anomaly_score: 0,
          message: "No anomaly detected.",
          user_baseline: 8,
          learned_days: 7,
        };

      case path === "/api/stats/analytics":
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
            count: Math.floor(Math.random() * 5),
          })),
        };

      case path.startsWith("/api/history"):
        return {
          total_focus_minutes: 120,
          sessions: [],
        };

      case path === "/api/session":
        return {
          id: Date.now(),
        };

      case path.startsWith("/api/session/"):
        return {
          success: true,
        };

      case path === "/api/event":
        return {
          id: Date.now(),
        };

      default:
        return {};
    }
  }

  /* BACKEND MODE */

  const response = await fetch(API + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

/* =========================================================
   SETTINGS
   ========================================================= */

const DEFAULT_SETTINGS = {
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

    if (!saved) {
      return DEFAULT_SETTINGS;
    }

    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(saved),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings) {
  localStorage.setItem("ff_settings", JSON.stringify(settings));
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function notify(title, body) {
  const settings = getSettings();

  if (!settings.notifications) return;

  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
    });
  }
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    return;
  }

  try {
    await Notification.requestPermission();
  } catch {
    // Browser may block notification permission.
  }
}

/* =========================================================
   SCORE RING
   ========================================================= */

function Ring({ score }) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

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

/* =========================================================
   TOP HEADER
   ========================================================= */

function Top({ title, onHome }) {
  return (
    <header>
      <button className="icon" onClick={onHome} aria-label="Home">
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

/* =========================================================
   CARD
   ========================================================= */

function Card({ children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      {children}
    </section>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

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

  const scoreRef = useRef(score);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    Promise.all([
      api("/api/stats/daily"),
      api("/api/stats/anomaly"),
    ])
      .then(([, anomalyData]) => {
        setAnomaly(anomalyData);
      })
      .catch(() => {});
  }, [score]);

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

    const increase = category === "gaming" ? 10 : 7;

    const nextScore = Math.min(
      100,
      scoreRef.current + increase
    );

    scoreRef.current = nextScore;
    setScore(nextScore);

    await api("/api/event", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        app_name: app,
        category,
        distraction_score: nextScore,
      }),
    }).catch(() => null);

    setEvents((current) => [
      {
        app,
        category,
        score: nextScore,
        time: new Date().toLocaleTimeString(),
      },
      ...current,
    ].slice(0, 5));

    if (nextScore >= 60) {
      notify(
        "FocusFlow warning",
        "Your distraction score reached 60."
      );
    }

    if (category === "gaming") {
      notify(
        "Gaming Focus Mode",
        "A 45-minute focus recommendation is available."
      );
    }
  }

  async function autoSimulation() {
    if (monitor) return;

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

  function resetDashboard() {
    setScore(18);
    scoreRef.current = 18;
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
        {/* HERO */}

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

        {/* SCORE */}

        <Card>
          <div className="row">
            <div>
              <span className="eyebrow">
                LIVE DISTRACTION SCORE
              </span>

              <h3
                className={
                  score >= 60 ? "danger" : "good"
                }
              >
                ● {score >= 60 ? "Distracted" : "Focused"}
              </h3>
            </div>

            <Activity />
          </div>

          <Ring score={score} />

          <div className="reason">
            <b>WHY</b>{" "}
            {events[0]
              ? `Recent ${events[0].category} activity increased the score.`
              : "No major distraction signal detected yet."}
          </div>
        </Card>

        {/* ANOMALY */}

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

        {/* RECOMMENDATION */}

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
              aria-label="Start focus"
            >
              <Play size={16} />
            </button>
          </div>
        </Card>

        {/* NAVIGATION */}

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

          <button
            className="action"
            onClick={() => go("social")}
          >
            <Users />
            <b>Social</b>
            <span>Streaks & achievements</span>
          </button>
        </div>

        {/* SIMULATION */}

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
              onClick={autoSimulation}
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
                <div key={`${event.time}-${index}`}>
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

        {/* ACTIONS */}

        <div className="two">
          <button
            className="secondary"
            onClick={() => go("focus")}
          >
            Start Focus Mode
          </button>

          <button
            className="secondary"
            onClick={resetDashboard}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        {/* HONEST MVP */}

        <div className="honest">
          <CheckCircle2 size={16} />

          <span>
            <b>Technically honest MVP:</b>{" "}
            the web version simulates device behavior.
            Android telemetry and hardware controls would
            require an Android integration or partner
            implementation.
          </span>
        </div>
      </main>
    </>
  );
}

/* =========================================================
   ANALYTICS
   ========================================================= */

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

/* =========================================================
   CHART
   ========================================================= */

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

/* =========================================================
   METRIC
   ========================================================= */

function Metric({ icon, value, label }) {
  return (
    <Card className="metric">
      {icon}

      <b>{value}</b>

      <span>{label}</span>
    </Card>
  );
}

/* =========================================================
   FOCUS MODE
   ========================================================= */

function Focus({ go, score, setScore }) {
  const [selected, setSelected] = useState(
    score >= 60 ? 25 : 10
  );

  const [left, setLeft] = useState(0);
  const [run, setRun] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sid, setSid] = useState(null);
  const [startScore, setStartScore] = useState(score);

  useEffect(() => {
    if (!run || paused || left <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [run, paused, left]);

  useEffect(() => {
    if (!(run && left === 0)) {
      return;
    }

    setRun(false);

    const improvedScore = Math.max(
      5,
      Math.round(startScore * 0.35)
    );

    setScore(improvedScore);

    notify(
      "FocusFlow",
      "Focus session completed! Great work."
    );

    if (sid) {
      api(`/api/session/${sid}`, {
        method: "PATCH",
        body: JSON.stringify({
          actual_minutes: selected,
          focus_score: Math.max(
            5,
            100 - startScore
          ),
          completed: true,
        }),
      }).catch(() => {});
    }
  }, [
    left,
    run,
    sid,
    selected,
    startScore,
    setScore,
  ]);

  async function start() {
    const session = await api("/api/session", {
      method: "POST",
      body: JSON.stringify({
        planned_minutes: selected,
      }),
    }).catch(() => null);

    setSid(session?.id || null);
    setStartScore(score);
    setLeft(selected * 60);
    setRun(true);
    setPaused(false);
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
          {run
            ? "You're in the flow."
            : "Choose your focus."}
        </h1>

        <p>
          {run
            ? "Stay focused on your current task."
            : "Pick a session that matches your energy."}
        </p>

        {!run ? (
          <>
            <div className="durations">
              {[10, 25, 45].map((minutes) => (
                <button
                  className={
                    selected === minutes
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setSelected(minutes)
                  }
                  key={minutes}
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
              {String(left % 60).padStart(2, "0")}
            </div>

            <div className="progress">
              <i
                style={{
                  width: `${
                    100 -
                    (left / (selected * 60)) *
                      100
                  }%`,
                }}
              />
            </div>

            <div className="two">
              <button
                className="secondary"
                onClick={() =>
                  setPaused((value) => !value)
                }
              >
                {paused ? "Resume" : "Pause"}
              </button>

              <button
                className="secondary"
                onClick={() => {
                  setRun(false);
                  setLeft(0);
                  go("history");
                }}
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

/* =========================================================
   HISTORY
   ========================================================= */

function History({ go }) {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState(null);

  useEffect(() => {
    api(`/api/history?period=${period}`)
      .then(setData)
      .catch(() => {});
  }, [period]);

  return (
    <Page title="Session History" go={go}>
      <div className="tabs">
        {["today", "week", "month"].map(
          (value) => (
            <button
              className={
                period === value ? "on" : ""
              }
              onClick={() =>
                setPeriod(value)
              }
              key={value}
            >
              {value}
            </button>
          )
        )}
      </div>

      <Card>
        <h2>Total focus this period</h2>

        <div className="big">
          {data?.total_focus_minutes || 0} min
        </div>
      </Card>

      {(data?.sessions || []).map((session) => (
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
                {session.interruptions} interruptions
                {" • "}
                {(session.apps || []).join(", ") ||
                  "No apps"}
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
      ))}
    </Page>
  );
}

/* =========================================================
   GAMING
   ========================================================= */

function Gaming({ go }) {
  return (
    <Page title="iQOO Gaming Focus" go={go}>
      <div className="gamingHero">
        <Gamepad2 size={32} />

        <span className="eyebrow">
          iQOO-READY CONCEPT
        </span>

        <h1>Gaming Focus Mode</h1>

        <p>
          Recommendations tailored for iQOO users
          and gaming sessions.
        </p>
      </div>

      <Card>
        <h2>45-minute focus recommendation</h2>

        <p>
          Gaming apps are categorized separately,
          so FocusFlow uses a longer intervention
          aligned with a typical gaming session.
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

          <h3>Performance Mode</h3>

          <p>
            iQOO Performance Mode enabled —
            lower thermal throttling.
          </p>
        </Card>

        <Card>
          <Bell />

          <h3>Notifications</h3>

          <p>
            Disable notifications while gaming.
          </p>
        </Card>

        <Card>
          <Sparkles />

          <h3>Gaming Session</h3>

          <p>
            240Hz lock recommended.
          </p>
        </Card>

        <Card>
          <TrendingUp />

          <h3>Post-session</h3>

          <p>
            You maintained <b>87%</b> focus during
            ranked match.
          </p>
        </Card>
      </div>

      <div className="honest">
        <CheckCircle2 size={16} />

        <span>
          <b>Partner integration note:</b>{" "}
          240Hz, thermal and haptic controls shown
          here are recommendations for iQOO users,
          not claims of browser hardware control.
          A future partner SDK/OTA could connect
          these controls.
        </span>
      </div>
    </Page>
  );
}

/* =========================================================
   SETTINGS
   ========================================================= */

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
        <h2>Detection sensitivity</h2>

        <div className="seg">
          {["Low", "Medium", "High"].map(
            (value) => (
              <button
                className={
                  settings.sensitivity === value
                    ? "on"
                    : ""
                }
                onClick={() =>
                  update("sensitivity", value)
                }
                key={value}
              >
                {value}
              </button>
            )
          )}
        </div>
      </Card>

      <Card>
        <h2>Favorite apps / whitelist</h2>

        <p className="muted">
          Whitelisted apps are not counted toward
          distraction in the production Android
          implementation.
        </p>

        <div className="appgrid">
          {[
            "Chrome",
            "Spotify",
            "WhatsApp",
          ].map((app) => {
            const chosen =
              settings.favorites.includes(app);

            return (
              <button
                className={
                  chosen ? "chosen" : ""
                }
                onClick={() =>
                  update(
                    "favorites",
                    chosen
                      ? settings.favorites.filter(
                          (item) => item !== app
                        )
                      : [
                          ...settings.favorites,
                          app,
                        ]
                  )
                }
                key={app}
              >
                {app}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2>Peak productivity hours</h2>

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
        <h2>Default focus duration</h2>

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
            (minutes) => (
              <option
                key={minutes}
                value={minutes}
              >
                {minutes}
              </option>
            )
          )}
        </select>
      </Card>

      <Card>
        <h2>Auto-focus threshold</h2>

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
        <h2>Notifications</h2>

        <button
          className="secondary wide"
          onClick={async () => {
            const enabling =
              !settings.notifications;

            update(
              "notifications",
              enabling
            );

            if (enabling) {
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
        <h2>Data export</h2>

        <button
          className="secondary wide"
          onClick={() => {
            if (!API) {
              alert(
                "CSV export requires the optional backend."
              );
              return;
            }

            window.open(
              `${API}/api/export.csv`,
              "_blank"
            );
          }}
        >
          <Download size={15} />
          Download weekly/monthly report CSV
        </button>
      </Card>
    </Page>
  );
}

/* =========================================================
   SOCIAL
   ========================================================= */

function Social({ go }) {
  const status =
    "I'm on a 7-day focus streak! 🔥";

  async function copyStatus() {
    try {
      await navigator.clipboard.writeText(status);
      alert("Status copied!");
    } catch {
      alert(status);
    }
  }

  return (
    <Page
      title="Social Accountability"
      go={go}
    >
      <Card>
        <Users />

        <h2>Share your streak</h2>

        <p>“{status}”</p>

        <button
          className="primary wide"
          onClick={copyStatus}
        >
          Copy status
        </button>
      </Card>

      <Card>
        <h2>Anonymous leaderboard</h2>

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
        <h2>Achievements</h2>

        <div className="badges">
          <span>🔥 1-day streak</span>
          <span>🏆 7-day streak</span>
          <span>⚡ Speed Focused</span>
          <span>🎯 45-min record</span>
        </div>
      </Card>
    </Page>
  );
}

/* =========================================================
   PAGE WRAPPER
   ========================================================= */

function Page({ title, go, children }) {
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

/* =========================================================
   APP
   ========================================================= */

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

  switch (screen) {
    case "analytics":
      return <Analytics go={go} />;

    case "focus":
      return <Focus {...props} />;

    case "history":
      return <History go={go} />;

    case "gaming":
      return <Gaming {...props} />;

    case "settings":
      return <SettingsPage go={go} />;

    case "social":
      return <Social go={go} />;

    case "home":
    default:
      return <Dashboard {...props} />;
  }
}

/* =========================================================
   REACT ROOT
   ========================================================= */

const rootElement =
  document.getElementById("root");

if (!rootElement) {
  throw new Error(
    'FocusFlow requires <div id="root"></div> in index.html.'
  );
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
