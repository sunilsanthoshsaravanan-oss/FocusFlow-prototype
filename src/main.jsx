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

/* =========================================================
   FOCUSFLOW
   FRONTEND-ONLY VERSION

   No backend
   No API
   No database
   No Python
   No fetch()
   Works with GitHub + Vercel
========================================================= */

/* =========================================================
   APP DATA
========================================================= */

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
   LOCAL STORAGE KEYS
========================================================= */

const SETTINGS_KEY = "focusflow_settings";
const HISTORY_KEY = "focusflow_history";

/* =========================================================
   DEFAULT SETTINGS
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

/* =========================================================
   SETTINGS HELPERS
========================================================= */

function getSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);

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
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // Ignore storage errors
  }
}

/* =========================================================
   HISTORY HELPERS
========================================================= */

function getHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history)
    );
  } catch {
    // Ignore storage errors
  }
}

function addSession(session) {
  const history = getHistory();

  const updated = [
    session,
    ...history,
  ].slice(0, 100);

  saveHistory(updated);

  return updated;
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function notify(title, body) {
  try {
    const settings = getSettings();

    if (!settings.notifications) {
      return;
    }

    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
      });
    }
  } catch {
    // Browser notification unavailable
  }
}

async function enableNotifications() {
  try {
    if ("Notification" in window) {
      await Notification.requestPermission();
    }
  } catch {
    // Ignore permission errors
  }
}

/* =========================================================
   ANALYTICS DATA
========================================================= */

function getAnalyticsData() {
  const history = getHistory();

  const completedSessions = history.filter(
    (session) => session.completed
  );

  const totalMinutes = completedSessions.reduce(
    (sum, session) =>
      sum + Number(session.actual_minutes || 0),
    0
  );

  const averageSession =
    completedSessions.length > 0
      ? Math.round(
          totalMinutes /
            completedSessions.length
        )
      : 25;

  const personalBest =
    completedSessions.length > 0
      ? Math.max(
          ...completedSessions.map(
            (session) =>
              Number(
                session.actual_minutes || 0
              )
          )
        )
      : 90;

  const now = new Date();

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const monthlySessions =
    completedSessions.filter(
      (session) =>
        new Date(session.date_time) >=
        startOfMonth
    );

  const monthlyMinutes =
    monthlySessions.reduce(
      (sum, session) =>
        sum +
        Number(session.actual_minutes || 0),
      0
    );

  const days = new Set(
    completedSessions.map((session) =>
      new Date(session.date_time)
        .toDateString()
    )
  );

  return {
    daily_streak:
      completedSessions.length > 0
        ? Math.min(days.size, 7)
        : 0,

    average_session_length:
      averageSession,

    personal_best_minutes:
      personalBest,

    monthly_focus_minutes:
      monthlyMinutes,

    weekly_trend: [
      {
        label: "Mon",
        avg_distraction: 20,
      },
      {
        label: "Tue",
        avg_distraction: 35,
      },
      {
        label: "Wed",
        avg_distraction: 28,
      },
      {
        label: "Thu",
        avg_distraction: 40,
      },
      {
        label: "Fri",
        avg_distraction: 32,
      },
      {
        label: "Sat",
        avg_distraction: 18,
      },
      {
        label: "Sun",
        avg_distraction: 15,
      },
    ],

    most_distracting_apps: [
      {
        app: "Instagram",
        switches: 18,
      },
      {
        app: "YouTube",
        switches: 12,
      },
      {
        app: "WhatsApp",
        switches: 9,
      },
      {
        app: "BGMI",
        switches: 6,
      },
    ],

    peak_hours: Array.from(
      { length: 24 },
      (_, hour) => ({
        hour,
        count:
          completedSessions.filter(
            (session) =>
              new Date(
                session.date_time
              ).getHours() === hour
          ).length,
      })
    ),
  };
}

/* =========================================================
   RING
========================================================= */

function Ring({ score }) {
  const radius = 62;

  const circumference =
    2 * Math.PI * radius;

  const safeScore = Math.max(
    0,
    Math.min(score, 100)
  );

  const offset =
    circumference -
    (safeScore / 100) *
      circumference;

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
            strokeDasharray:
              circumference,
            strokeDashoffset:
              offset,
          }}
        />
      </svg>

      <b>{safeScore}</b>

      <small>/ 100</small>
    </div>
  );
}

/* =========================================================
   TOP BAR
========================================================= */

function Top({
  title,
  onHome,
}) {
  return (
    <header>
      <button
        className="icon"
        onClick={onHome}
        aria-label="Go home"
      >
        <Home size={17} />
      </button>

      <strong>
        <Target size={16} />
        {title}
      </strong>

      <span className="live">
        ● LIVE
      </span>
    </header>
  );
}

/* =========================================================
   CARD
========================================================= */

function Card({
  children,
  className = "",
}) {
  return (
    <section
      className={`card ${className}`}
    >
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
  setSessionId,
}) {
  const [events, setEvents] =
    useState([]);

  const [monitor, setMonitor] =
    useState(false);

  const apps = [
    "Instagram",
    "YouTube",
    "WhatsApp",
    "Chrome",
    "Spotify",
    "BGMI",
  ];

  function switchApp(app) {
    const category =
      CATEGORIES[app] || "other";

    const increase =
      category === "gaming"
        ? 10
        : 7;

    const nextScore = Math.min(
      100,
      score + increase
    );

    setScore(nextScore);

    const event = {
      app,
      cat: category,
      score: nextScore,
      at: new Date().toLocaleTimeString(),
    };

    setEvents((previous) =>
      [event, ...previous].slice(0, 5)
    );

    if (nextScore >= 60) {
      notify(
        "FocusFlow warning",
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

  async function auto() {
    if (monitor) {
      return;
    }

    setMonitor(true);

    const simulation = [
      "Instagram",
      "YouTube",
      "WhatsApp",
      "Instagram",
      "BGMI",
      "Instagram",
    ];

    for (const app of simulation) {
      await new Promise(
        (resolve) =>
          setTimeout(resolve, 500)
      );

      switchApp(app);
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
            Your attention,{" "}
            <em>protected.</em>
          </h1>

          <p>
            Detect distraction patterns,
            explain the score, and turn the
            signal into a focused action.
          </p>
        </div>

        <Card>
          <div className="row">
            <div>
              <span className="eyebrow">
                LIVE DISTRACTION SCORE
              </span>

              <h3
                className={
                  score >= 60
                    ? "danger"
                    : "good"
                }
              >
                ●{" "}
                {score >= 60
                  ? "Distracted"
                  : "Focused"}
              </h3>
            </div>

            <Activity />
          </div>

          <Ring score={score} />

          <div className="reason">
            <b>WHY</b>{" "}
            {events.length > 0
              ? `Recent ${events[0].cat} activity increased the score.`
              : "No major distraction signal detected yet."}
          </div>
        </Card>

        {score >= 80 && (
          <div className="alert">
            <TrendingUp size={17} />

            <div>
              <b>
                High distraction detected
              </b>

              <span>
                Your current score is{" "}
                {score}/100. Consider
                starting a focus session.
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
                {score >= 60
                  ? "25"
                  : "10"}
                -minute Focus Session
              </h2>

              <p>
                {score >= 60
                  ? "Your distraction level is elevated. A deep-focus reset is recommended."
                  : "Start small and build attention momentum."}
              </p>
            </div>

            <button
              className="round"
              onClick={() =>
                go("focus")
              }
            >
              <Play size={16} />
            </button>
          </div>
        </Card>

        <div className="grid2">
          <button
            className="action"
            onClick={() =>
              go("analytics")
            }
          >
            <BarChart3 />

            <b>Analytics</b>

            <span>
              Weekly trends & app
              patterns
            </span>
          </button>

          <button
            className="action"
            onClick={() =>
              go("history")
            }
          >
            <Clock3 />

            <b>Session History</b>

            <span>
              Review every focus
              session
            </span>
          </button>

          <button
            className="action"
            onClick={() =>
              go("gaming")
            }
          >
            <Gamepad2 />

            <b>Gaming Focus</b>

            <span>
              iQOO-aware gaming
              experience
            </span>
          </button>

          <button
            className="action"
            onClick={() =>
              go("settings")
            }
          >
            <Settings />

            <b>Settings</b>

            <span>
              Personalize detection
            </span>
          </button>

          <button
            className="action"
            onClick={() =>
              go("social")
            }
          >
            <Users />

            <b>Social</b>

            <span>
              Share your focus streak
            </span>
          </button>
        </div>

        <div className="label">
          TRY THE LIVE SIMULATION
        </div>

        <Card>
          <div className="row">
            <div>
              <h2>
                Distraction Lab
              </h2>

              <p>
                Simulate app switching
                and watch the score
                change.
              </p>
            </div>

            <button
              className="primary"
              onClick={auto}
              disabled={monitor}
            >
              {monitor
                ? "Running…"
                : "Run test"}
            </button>
          </div>

          <div className="appgrid">
            {apps.map((app) => (
              <button
                key={app}
                onClick={() =>
                  switchApp(app)
                }
              >
                <Smartphone
                  size={15}
                />

                {app}
              </button>
            ))}
          </div>

          {events.length > 0 && (
            <div className="log">
              {events.map(
                (event, index) => (
                  <div
                    key={`${event.at}-${index}`}
                  >
                    <span>
                      {event.at}
                    </span>

                    <b>
                      {event.app}
                    </b>

                    <small>
                      {event.cat} • score{" "}
                      {event.score}
                    </small>
                  </div>
                )
              )}
            </div>
          )}
        </Card>

        <div className="two">
          <button
            className="secondary"
            onClick={() =>
              go("focus")
            }
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
            <b>
              Technically honest MVP:
            </b>{" "}
            the web version simulates
            device behavior. Android
            telemetry and hardware
            controls would require a
            native Android integration.
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
  const data =
    getAnalyticsData();

  return (
    <Page
      title="Analytics"
      go={go}
    >
      <div className="grid4">
        <Metric
          icon={<Flame />}
          value={
            data.daily_streak
          }
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
        <h2>
          Weekly distraction trend
        </h2>

        <Chart
          data={
            data.weekly_trend
          }
          dataKey="avg_distraction"
          type="line"
        />
      </Card>

      <Card>
        <h2>
          Most distracting apps
        </h2>

        <Chart
          data={
            data.most_distracting_apps
          }
          dataKey="switches"
          type="bar"
          x="app"
        />
      </Card>

      <Card>
        <h2>
          Best focus time of day
        </h2>

        <div className="heat">
          {data.peak_hours.map(
            (item) => (
              <div
                key={item.hour}
                title={`${item.hour}:00 • ${item.count} sessions`}
                style={{
                  opacity:
                    0.18 +
                    Math.min(
                      item.count,
                      5
                    ) *
                      0.16,
                }}
              >
                {item.hour}
              </div>
            )
          )}
        </div>

        <p className="muted">
          Darker cells represent
          more completed sessions.
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
            <CartesianGrid
              stroke="#202a38"
            />

            <XAxis
              dataKey={x}
              stroke="#748095"
            />

            <YAxis
              stroke="#748095"
            />

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
            <CartesianGrid
              stroke="#202a38"
            />

            <XAxis
              dataKey={x}
              stroke="#748095"
            />

            <YAxis
              stroke="#748095"
            />

            <Tooltip />

            <Bar
              dataKey={dataKey}
              fill="#72a4ff"
              radius={[
                6,
                6,
                0,
                0,
              ]}
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

function Metric({
  icon,
  value,
  label,
}) {
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

function Focus({
  go,
  score,
  setScore,
}) {
  const settings =
    getSettings();

  const [selected, setSelected] =
    useState(
      score >= 60
        ? 25
        : settings.duration || 10
    );

  const [left, setLeft] =
    useState(0);

  const [run, setRun] =
    useState(false);

  const [paused, setPaused] =
    useState(false);

  const [startScore, setStartScore] =
    useState(score);

  const [sessionStartedAt, setSessionStartedAt] =
    useState(null);

  useEffect(() => {
    if (
      !run ||
      paused ||
      left <= 0
    ) {
      return undefined;
    }

    const timer =
      setInterval(() => {
        setLeft(
          (value) =>
            Math.max(
              0,
              value - 1
            )
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [
    run,
    paused,
    left,
  ]);

  useEffect(() => {
    if (
      !run ||
      left !== 0
    ) {
      return;
    }

    const newScore =
      Math.max(
        5,
        Math.round(
          startScore * 0.35
        )
      );

    const startedAt =
      sessionStartedAt ||
      new Date().toISOString();

    const session = {
      id:
        Date.now().toString(),

      date_time:
        new Date().toISOString(),

      started_at:
        startedAt,

      planned_minutes:
        selected,

      actual_minutes:
        selected,

      interruptions: 0,

      apps: [],

      focus_score:
        Math.max(
          5,
          100 - startScore
        ),

      completed: true,
    };

    addSession(session);

    setRun(false);

    setScore(newScore);

    notify(
      "FocusFlow",
      "Focus session completed! Great work."
    );
  }, [
    left,
    run,
    startScore,
    selected,
    sessionStartedAt,
    setScore,
  ]);

  function start() {
    setStartScore(score);

    setSessionStartedAt(
      new Date().toISOString()
    );

    setLeft(
      selected * 60
    );

    setRun(true);

    setPaused(false);
  }

  function endSession() {
    const elapsedSeconds =
      selected * 60 - left;

    const actualMinutes =
      Math.max(
        0,
        Math.floor(
          elapsedSeconds / 60
        )
      );

    if (actualMinutes > 0) {
      addSession({
        id:
          Date.now().toString(),

        date_time:
          new Date().toISOString(),

        started_at:
          sessionStartedAt ||
          new Date().toISOString(),

        planned_minutes:
          selected,

        actual_minutes:
          actualMinutes,

        interruptions: 0,

        apps: [],

        focus_score:
          Math.max(
            5,
            100 - startScore
          ),

        completed: false,
      });
    }

    setRun(false);
    setPaused(false);
    setLeft(0);

    go("history");
  }

  return (
    <Page
      title="Focus Mode"
      go={go}
    >
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
              {[10, 25, 45].map(
                (minutes) => (
                  <button
                    className={
                      selected ===
                      minutes
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setSelected(
                        minutes
                      )
                    }
                    key={minutes}
                  >
                    <b>
                      {minutes}
                    </b>

                    <small>
                      minutes
                    </small>
                  </button>
                )
              )}
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
                Math.floor(
                  left / 60
                )
              ).padStart(2, "0")}
              :
              {String(
                left % 60
              ).padStart(2, "0")}
            </div>

            <div className="progress">
              <i
                style={{
                  width: `${
                    100 -
                    (left /
                      (selected *
                        60)) *
                      100
                  }%`,
                }}
              />
            </div>

            <div className="two">
              <button
                className="secondary"
                onClick={() =>
                  setPaused(
                    (value) =>
                      !value
                  )
                }
              >
                {paused
                  ? "Resume"
                  : "Pause"}
              </button>

              <button
                className="secondary"
                onClick={
                  endSession
                }
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
  const [period, setPeriod] =
    useState("month");

  const [refresh, setRefresh] =
    useState(0);

  const sessions =
    getHistory();

  function isInPeriod(session) {
    const date =
      new Date(
        session.date_time
      );

    const now =
      new Date();

    if (period === "today") {
      return (
        date.toDateString() ===
        now.toDateString()
      );
    }

    if (period === "week") {
      const weekAgo =
        new Date(now);

      weekAgo.setDate(
        now.getDate() - 7
      );

      return date >= weekAgo;
    }

    const monthStart =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

    return date >= monthStart;
  }

  const filtered =
    sessions.filter(
      isInPeriod
    );

  const totalFocus =
    filtered.reduce(
      (sum, session) =>
        sum +
        Number(
          session.actual_minutes ||
            0
        ),
      0
    );

  return (
    <Page
      title="Session History"
      go={go}
    >
      <div className="tabs">
        {[
          "today",
          "week",
          "month",
        ].map((item) => (
          <button
            className={
              period === item
                ? "on"
                : ""
            }
            onClick={() => {
              setPeriod(item);
              setRefresh(
                (value) =>
                  value + 1
              );
            }}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>

      <Card>
        <h2>
          Total focus this period
        </h2>

        <div className="big">
          {totalFocus} min
        </div>
      </Card>

      {filtered.length ===
        0 && (
        <Card>
          <div className="empty">
            <Clock3 size={30} />

            <h3>
              No sessions yet
            </h3>

            <p>
              Complete a focus
              session and your
              history will appear
              here.
            </p>
          </div>
        </Card>
      )}

      {filtered.map(
        (session) => (
          <Card
            key={
              session.id
            }
          >
            <div className="row">
              <div>
                <span className="eyebrow">
                  {new Date(
                    session.date_time
                  ).toLocaleString()}
                </span>

                <h3>
                  {
                    session.actual_minutes
                  }{" "}
                  /{" "}
                  {
                    session.planned_minutes
                  }{" "}
                  min
                </h3>

                <p>
                  {
                    session.interruptions
                  }{" "}
                  interruptions •{" "}
                  {session.apps
                    ?.length > 0
                    ? session.apps.join(
                        ", "
                      )
                    : "No apps"}
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
                  session.focus_score ||
                    0
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

/* =========================================================
   GAMING
========================================================= */

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
          Recommendations tailored
          for iQOO users and gaming
          sessions.
        </p>
      </div>

      <Card>
        <h2>
          45-minute focus
          recommendation
        </h2>

        <p>
          Gaming apps are
          categorized separately,
          so FocusFlow uses a
          longer intervention
          aligned with a typical
          gaming session.
        </p>

        <button
          className="primary wide"
          onClick={() =>
            go("focus")
          }
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
            Recommended
            performance settings
            for gaming.
          </p>
        </Card>

        <Card>
          <Bell />

          <h3>
            Notifications
          </h3>

          <p>
            Disable notifications
            while gaming.
          </p>
        </Card>

        <Card>
          <Sparkles />

          <h3>
            Gaming Session
          </h3>

          <p>
            High-refresh-rate
            display recommended.
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
          <b>
            Partner integration
            note:
          </b>{" "}
          Hardware controls shown
          here are recommendations,
          not browser hardware-control
          claims.
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
    useState(
      getSettings()
    );

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  function update(
    key,
    value
  ) {
    setSettings(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );
  }

  function toggleFavorite(
    app
  ) {
    const exists =
      settings.favorites.includes(
        app
      );

    update(
      "favorites",
      exists
        ? settings.favorites.filter(
            (item) =>
              item !== app
          )
        : [
            ...settings.favorites,
            app,
          ]
    );
  }

  function exportReport() {
    const history =
      getHistory();

    const totalMinutes =
      history.reduce(
        (sum, session) =>
          sum +
          Number(
            session.actual_minutes ||
              0
          ),
        0
      );

    const completed =
      history.filter(
        (session) =>
          session.completed
      ).length;

    const report = [
      "FocusFlow Report",
      "=================",
      "",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      `Total sessions: ${history.length}`,
      `Completed sessions: ${completed}`,
      `Total focus minutes: ${totalMinutes}`,
      "",
      "Settings",
      "--------",
      `Sensitivity: ${settings.sensitivity}`,
      `Peak hours: ${settings.peak}`,
      `Default duration: ${settings.duration} minutes`,
      `Auto-focus threshold: ${settings.threshold}`,
      "",
      "Session History",
      "---------------",
      ...history.map(
        (session) =>
          `${new Date(
            session.date_time
          ).toLocaleString()} | ${session.actual_minutes}/${session.planned_minutes} min | ${session.completed ? "Completed" : "Ended early"}`
      ),
    ].join("\n");

    const blob =
      new Blob(
        [report],
        {
          type: "text/plain",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      "focusflow-report.txt";

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url
    );
  }

  return (
    <Page
      title="Settings"
      go={go}
    >
      <Card>
        <h2>
          Detection sensitivity
        </h2>

        <div className="seg">
          {[
            "Low",
            "Medium",
            "High",
          ].map((level) => (
            <button
              className={
                settings.sensitivity ===
                level
                  ? "on"
                  : ""
              }
              onClick={() =>
                update(
                  "sensitivity",
                  level
                )
              }
              key={level}
            >
              {level}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2>
          Favorite apps /
          whitelist
        </h2>

        <p className="muted">
          Whitelisted apps are
          excluded from
          distraction scoring in
          the planned Android
          implementation.
        </p>

        <div className="appgrid">
          {[
            "Chrome",
            "Spotify",
            "WhatsApp",
          ].map((app) => (
            <button
              className={
                settings.favorites.includes(
                  app
                )
                  ? "chosen"
                  : ""
              }
              onClick={() =>
                toggleFavorite(
                  app
                )
              }
              key={app}
            >
              {app}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2>
          Peak productivity
          hours
        </h2>

        <input
          value={
            settings.peak
          }
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
          Default focus
          duration
        </h2>

        <select
          value={
            settings.duration
          }
          onChange={(event) =>
            update(
              "duration",
              Number(
                event.target
                  .value
              )
            )
          }
        >
          {[
            10,
            20,
            25,
            45,
            50,
          ].map((minutes) => (
            <option
              key={minutes}
              value={minutes}
            >
              {minutes}
            </option>
          ))}
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
          value={
            settings.threshold
          }
          onChange={(event) =>
            update(
              "threshold",
              Number(
                event.target
                  .value
              )
            )
          }
        />

        <b>
          {settings.threshold}
        </b>
      </Card>

      <Card>
        <h2>
          Notifications
        </h2>

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
        <h2>
          Data export
        </h2>

        <button
          className="secondary wide"
          onClick={
            exportReport
          }
        >
          <Download
            size={15}
          />

          Download report
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

  function copyStatus() {
    try {
      if (
        navigator.clipboard &&
        navigator.clipboard
          .writeText
      ) {
        navigator.clipboard.writeText(
          status
        );
      }

      notify(
        "FocusFlow",
        "Status copied!"
      );
    } catch {
      // Ignore clipboard errors
    }
  }

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
          onClick={
            copyStatus
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
        ].map(
          (name, index) => (
            <div
              className="leader"
              key={name}
            >
              <b>
                #{index + 1}
              </b>

              <span>
                {name}
              </span>

              <strong>
                {30 -
                  index * 4}{" "}
                days
              </strong>
            </div>
          )
        )}
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

/* =========================================================
   PAGE
========================================================= */

function Page({
  title,
  go,
  children,
}) {
  return (
    <>
      <Top
        title={title}
        onHome={() =>
          go("home")
        }
      />

      <main>
        <button
          className="back"
          onClick={() =>
            go("home")
          }
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

  const [
    sessionId,
    setSessionId,
  ] = useState(null);

  function go(nextScreen) {
    setScreen(
      nextScreen
    );
  }

  const commonProps = {
    go,
    score,
    setScore,
    sessionId,
    setSessionId,
  };

  if (
    screen ===
    "analytics"
  ) {
    return (
      <Analytics
        go={go}
      />
    );
  }

  if (
    screen === "focus"
  ) {
    return (
      <Focus
        {...commonProps}
      />
    );
  }

  if (
    screen === "history"
  ) {
    return (
      <History
        go={go}
      />
    );
  }

  if (
    screen === "gaming"
  ) {
    return (
      <Gaming
        go={go}
      />
    );
  }

  if (
    screen === "settings"
  ) {
    return (
      <SettingsPage
        go={go}
      />
    );
  }

  if (
    screen === "social"
  ) {
    return (
      <Social
        go={go}
      />
    );
  }

  return (
    <Dashboard
      {...commonProps}
    />
  );
}

/* =========================================================
   START REACT
========================================================= */

const root =
  document.getElementById(
    "root"
  );

if (!root) {
  throw new Error(
    "FocusFlow: #root element was not found in index.html"
  );
}

ReactDOM.createRoot(
  root
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
