
import React, {useEffect, useMemo, useState} from "react";
import ReactDOM from "react-dom/client";
import {Activity, BarChart3, Bell, Brain, CheckCircle2, Clock3, Download, Flame, Gamepad2, Home, Play, RotateCcw, Settings, Smartphone, Sparkles, Target, Timer, TrendingDown, TrendingUp, Users, X} from "lucide-react";
import {BarChart, Bar, CartesianGrid, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import "./style.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const GAMES = ["PUBG","COD","Genshin","BGMI","Free Fire","Valorant Mobile"];
const CATEGORIES = {Instagram:"social",YouTube:"streaming",WhatsApp:"social",Chrome:"work",Spotify:"streaming",PUBG:"gaming",COD:"gaming",Genshin:"gaming",BGMI:"gaming","Free Fire":"gaming","Valorant Mobile":"gaming"};

async function api(path, options={}) {
  const r = await fetch(API + path, {headers:{"Content-Type":"application/json",...(options.headers||{})}, ...options});
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
const getSettings=()=>JSON.parse(localStorage.getItem("ff_settings")||'{"sensitivity":"Medium","favorites":[],"peak":"18:00-21:00","duration":25,"threshold":60,"notifications":true,"share":false}');
const saveSettings=s=>localStorage.setItem("ff_settings",JSON.stringify(s));

function notify(title,body){
  const s=getSettings();
  if(!s.notifications || !("Notification" in window)) return;
  if(Notification.permission==="granted") new Notification(title,{body});
}
async function enableNotifications(){
  if("Notification" in window) await Notification.requestPermission();
}

function Ring({score}){const r=62,c=2*Math.PI*r,o=c-score/100*c;return <div className="ring"><svg viewBox="0 0 150 150"><circle className="rb" cx="75" cy="75" r={r}/><circle className="rv" cx="75" cy="75" r={r} style={{strokeDasharray:c,strokeDashoffset:o}}/></svg><b>{score}</b><small>/ 100</small></div>}
function Top({title,onHome}){return <header><button className="icon" onClick={onHome}><Home size={17}/></button><strong><Target size={16}/> {title}</strong><span className="live">● LIVE</span></header>}
function Card({children,className=""}){return <section className={"card "+className}>{children}</section>}

function Dashboard({go,score,setScore,sessionId,setSessionId}){
 const [events,setEvents]=useState([]),[stats,setStats]=useState(null),[anomaly,setAnomaly]=useState(null),[monitor,setMonitor]=useState(false);
 const [settings]=useState(getSettings());
 useEffect(()=>{Promise.all([api("/api/stats/daily"),api("/api/stats/anomaly")]).then(([a,b])=>{setStats(a);setAnomaly(b)}).catch(()=>{});},[score]);
 const apps=["Instagram","YouTube","WhatsApp","Chrome","Spotify","BGMI"];
 async function switchApp(app){
   const cat=CATEGORIES[app]||"other"; let next=Math.min(100,score+(cat==="gaming"?10:7));
   setScore(next);
   const e=await api("/api/event",{method:"POST",body:JSON.stringify({session_id:sessionId,app_name:app,category:cat,distraction_score:next})}).catch(()=>null);
   setEvents(x=>[{app,cat,score:next,at:new Date().toLocaleTimeString()},...x].slice(0,5));
   if(next>=60){notify("FocusFlow warning","Your distraction score reached 60.");}
   if(cat==="gaming"){notify("Gaming Focus Mode","45-minute focus recommendation available.");}
 }
 async function auto(){
   setMonitor(true); for(const app of ["Instagram","YouTube","WhatsApp","Instagram","BGMI","Instagram"]){await new Promise(r=>setTimeout(r,500));await switchApp(app)} setMonitor(false);
 }
 return <><Top title="FocusFlow" onHome={()=>{}}/><main>
   <div className="hero"><span className="eyebrow"><Sparkles size={13}/> BEHAVIOR-AWARE PRODUCTIVITY</span><h1>Your attention, <em>protected.</em></h1><p>Detect distraction patterns, explain the score, and turn the signal into a focused action.</p></div>
   <Card><div className="row"><div><span className="eyebrow">LIVE DISTRACTION SCORE</span><h3 className={score>=60?"danger":"good"}>● {score>=60?"Distracted":"Focused"}</h3></div><Activity/></div><Ring score={score}/><div className="reason"><b>WHY</b> {events[0]?`Recent ${events[0].cat} activity increased the score.`:"No major distraction signal detected yet."}</div></Card>
   {anomaly?.anomaly_score>0&&<div className="alert"><TrendingUp size={17}/><div><b>{anomaly.message}</b><span>Baseline: {anomaly.user_baseline} switches/day • learned from {anomaly.learned_days} day(s).</span></div></div>}
   <Card><div className="row"><div><span className="eyebrow">SMART RECOMMENDATION</span><h2>{score>=60?"25":"10"}-minute Focus Session</h2><p>{score>=60?"Your distraction level is elevated. A deep-focus reset is recommended.":"Start small and build attention momentum."}</p></div><button className="round" onClick={()=>go("focus")}><Play size={16}/></button></div></Card>
   <div className="grid2">
    <button className="action" onClick={()=>go("analytics")}><BarChart3/><b>Analytics</b><span>Weekly trends & app patterns</span></button>
    <button className="action" onClick={()=>go("history")}><Clock3/><b>Session History</b><span>Review every focus session</span></button>
    <button className="action" onClick={()=>go("gaming")}><Gamepad2/><b>Gaming Focus</b><span>iQOO-aware gaming experience</span></button>
    <button className="action" onClick={()=>go("settings")}><Settings/><b>Settings</b><span>Personalize detection</span></button>
   </div>
   <div className="label">TRY THE LIVE SIMULATION</div>
   <Card><div className="row"><div><h2>Distraction Lab</h2><p>Simulate app switching and watch the score change.</p></div><button className="primary" onClick={auto} disabled={monitor}>{monitor?"Running…":"Run test"}</button></div><div className="appgrid">{apps.map(a=><button key={a} onClick={()=>switchApp(a)}><Smartphone size={15}/>{a}</button>)}</div>{events.length>0&&<div className="log">{events.map((e,i)=><div key={i}><span>{e.at}</span><b>{e.app}</b><small>{e.cat} • score {e.score}</small></div>)}</div>}</Card>
   <div className="two"><button className="secondary" onClick={()=>go("focus")}>Start Focus Mode</button><button className="secondary" onClick={()=>{setScore(18);setEvents([]);setSessionId(null)}}><RotateCcw size={14}/> Reset</button></div>
   <div className="honest"><CheckCircle2 size={16}/><span><b>Technically honest MVP:</b> the web version simulates device behavior. Android telemetry and hardware controls would require an Android integration/partner implementation.</span></div>
 </main></>
}

function Analytics({go}){
 const [data,setData]=useState(null);
 useEffect(()=>{api("/api/stats/analytics").then(setData).catch(()=>{})},[]);
 if(!data)return <Page title="Analytics" go={go}><Card>Loading analytics…</Card></Page>;
 return <Page title="Analytics" go={go}>
  <div className="grid4"><Metric icon={<Flame/>} value={data.daily_streak} label="Day streak"/><Metric icon={<Clock3/>} value={data.average_session_length+"m"} label="Avg session"/><Metric icon={<Target/>} value={data.personal_best_minutes+"m"} label="Personal best"/><Metric icon={<Timer/>} value={data.monthly_focus_minutes+"m"} label="Month focus"/></div>
  <Card><h2>Weekly distraction trend</h2><Chart data={data.weekly_trend} dataKey="avg_distraction" type="line"/></Card>
  <Card><h2>Most distracting apps</h2><Chart data={data.most_distracting_apps} dataKey="switches" type="bar" x="app"/></Card>
  <Card><h2>Best focus time of day</h2><div className="heat">{data.peak_hours.map(x=><div key={x.hour} title={`${x.hour}:00 • ${x.count} sessions`} style={{opacity:.18+Math.min(x.count,5)*.16}}>{x.hour}</div>)}</div><p className="muted">Darker cells represent more completed sessions.</p></Card>
 </Page>
}
function Chart({data,dataKey,type,x="label"}){return <div className="chart"><ResponsiveContainer width="100%" height={220}>{type==="line"?<LineChart data={data}><CartesianGrid stroke="#202a38"/><XAxis dataKey={x} stroke="#748095"/><YAxis stroke="#748095"/><Tooltip/><Line type="monotone" dataKey={dataKey} stroke="#72a4ff" strokeWidth={3}/></LineChart>:<BarChart data={data}><CartesianGrid stroke="#202a38"/><XAxis dataKey={x} stroke="#748095"/><YAxis stroke="#748095"/><Tooltip/><Bar dataKey={dataKey} fill="#72a4ff" radius={[6,6,0,0]}/></BarChart>}</ResponsiveContainer></div>}
function Metric({icon,value,label}){return <Card className="metric">{icon}<b>{value}</b><span>{label}</span></Card>}

function Focus({go,score,setScore}){
 const [selected,setSelected]=useState(score>=60?25:10),[left,setLeft]=useState(0),[run,setRun]=useState(false),[paused,setPaused]=useState(false),[sid,setSid]=useState(null),[startScore,setStartScore]=useState(score);
 useEffect(()=>{if(!run||paused||left<=0)return;const t=setInterval(()=>setLeft(v=>v-1),1000);return()=>clearInterval(t)},[run,paused,left]);
 useEffect(()=>{if(run&&left===0&&sid){setRun(false);setScore(Math.max(5,Math.round(startScore*.35)));api(`/api/session/${sid}`,{method:"PATCH",body:JSON.stringify({actual_minutes:selected,focus_score:Math.max(5,100-startScore),completed:true})}).catch(()=>{});notify("FocusFlow","Focus session completed! Great work.");}},[left,run,sid]);
 async function start(){const s=await api("/api/session",{method:"POST",body:JSON.stringify({planned_minutes:selected})}).catch(()=>null);setSid(s?.id||null);setStartScore(score);setLeft(selected*60);setRun(true);setPaused(false);}
 return <Page title="Focus Mode" go={go}><div className="focus"><div className="focusorb"><Target size={30}/></div><span className="eyebrow">FOCUS MODE</span><h1>{run?"You're in the flow.":"Choose your focus."}</h1><p>{run?"Stay focused on your current task.":"Pick a session that matches your energy."}</p>{!run?<><div className="durations">{[10,25,45].map(x=><button className={selected===x?"selected":""} onClick={()=>setSelected(x)} key={x}><b>{x}</b><small>minutes</small></button>)}</div><button className="primary wide" onClick={start}><Play size={15}/> Start session</button></>:<><div className="timer">{String(Math.floor(left/60)).padStart(2,"0")}:{String(left%60).padStart(2,"0")}</div><div className="progress"><i style={{width:`${100-left/(selected*60)*100}%`}}/></div><div className="two"><button className="secondary" onClick={()=>setPaused(!paused)}>{paused?"Resume":"Pause"}</button><button className="secondary" onClick={()=>{setRun(false);setLeft(0);go("history")}}>End</button></div></>}</div></Page>
}

function History({go}){
 const [period,setPeriod]=useState("month"),[data,setData]=useState(null);
 useEffect(()=>{api(`/api/history?period=${period}`).then(setData).catch(()=>{})},[period]);
 return <Page title="Session History" go={go}><div className="tabs">{["today","week","month"].map(x=><button className={period===x?"on":""} onClick={()=>setPeriod(x)} key={x}>{x}</button>)}</div><Card><h2>Total focus this period</h2><div className="big">{data?.total_focus_minutes||0} min</div></Card>{(data?.sessions||[]).map(s=><Card key={s.id}><div className="row"><div><span className="eyebrow">{new Date(s.date_time).toLocaleString()}</span><h3>{s.actual_minutes} / {s.planned_minutes} min</h3><p>{s.interruptions} interruptions • {s.apps.join(", ")||"No apps"}</p></div><b className={s.completed?"good":"warn"}>{Math.round(s.focus_score)}%</b></div></Card>)}</Page>
}

function Gaming({go,score,setScore}){
 const gaming=score>=0; return <Page title="iQOO Gaming Focus" go={go}><div className="gamingHero"><Gamepad2 size={32}/><span className="eyebrow">iQOO-READY CONCEPT</span><h1>Gaming Focus Mode</h1><p>Recommendations tailored for iQOO users and gaming sessions.</p></div><Card><h2>45-minute focus recommendation</h2><p>Gaming apps are categorized separately, so FocusFlow uses a longer intervention aligned with a typical gaming session.</p><button className="primary wide" onClick={()=>go("focus")}>Start 45-min Focus</button></Card><div className="grid2"><Card><Gamepad2/><h3>Performance Mode</h3><p>iQOO Performance Mode enabled — lower thermal throttling.</p></Card><Card><Bell/><h3>Notifications</h3><p>Disable notifications while gaming.</p></Card><Card><Sparkles/><h3>Gaming Session</h3><p>240Hz lock recommended.</p></Card><Card><TrendingUp/><h3>Post-session</h3><p>You maintained <b>87%</b> focus during ranked match.</p></Card></div><div className="honest"><CheckCircle2 size={16}/><span><b>Partner integration note:</b> 240Hz/thermal/haptic controls shown here are recommendations for iQOO users, not claims of browser hardware control. A future partner SDK/OTA could connect these controls.</span></div></Page>
}

function SettingsPage({go}){
 const [s,setS]=useState(getSettings()); const update=(k,v)=>setS(x=>({...x,[k]:v}));
 useEffect(()=>saveSettings(s),[s]);
 return <Page title="Settings" go={go}><Card><h2>Detection sensitivity</h2><div className="seg">{["Low","Medium","High"].map(x=><button className={s.sensitivity===x?"on":""} onClick={()=>update("sensitivity",x)} key={x}>{x}</button>)}</div></Card><Card><h2>Favorite apps / whitelist</h2><p className="muted">Whitelisted apps are not counted toward distraction in the production Android implementation.</p><div className="appgrid">{["Chrome","Spotify","WhatsApp"].map(x=><button className={s.favorites.includes(x)?"chosen":""} onClick={()=>update("favorites",s.favorites.includes(x)?s.favorites.filter(a=>a!==x):[...s.favorites,x])} key={x}>{x}</button>)}</div></Card><Card><h2>Peak productivity hours</h2><input value={s.peak} onChange={e=>update("peak",e.target.value)}/></Card><Card><h2>Default focus duration</h2><select value={s.duration} onChange={e=>update("duration",+e.target.value)}>{[10,20,25,45,50].map(x=><option key={x}>{x}</option>)}</select></Card><Card><h2>Auto-focus threshold</h2><input type="range" min="30" max="90" value={s.threshold} onChange={e=>update("threshold",+e.target.value)}/><b>{s.threshold}</b></Card><Card><h2>Notifications</h2><button className="secondary wide" onClick={async()=>{update("notifications",!s.notifications);if(!s.notifications)await enableNotifications()}}>{s.notifications?"Notifications enabled":"Notifications disabled"}</button></Card><Card><h2>Data export</h2><button className="secondary wide" onClick={()=>window.open(API+"/api/export.csv","_blank")}><Download size={15}/> Download weekly/monthly report CSV</button></Card></Page>
}

function Social({go}){return <Page title="Social Accountability" go={go}><Card><Users/><h2>Share your streak</h2><p>“I'm on a 7-day focus streak! 🔥”</p><button className="primary wide" onClick={()=>navigator.clipboard?.writeText("I'm on a 7-day focus streak! 🔥")}>Copy status</button></Card><Card><h2>Anonymous leaderboard</h2>{["FocusFox","PixelMind","QuietCoder","DeepWork","NightOwl"].map((x,i)=><div className="leader" key={x}><b>#{i+1}</b><span>{x}</span><strong>{30-i*4} days</strong></div>)}</Card><Card><h2>Achievements</h2><div className="badges"><span>🔥 1-day streak</span><span>🏆 7-day streak</span><span>⚡ Speed Focused</span><span>🎯 45-min record</span></div></Card></Page>}

function Page({title,go,children}){return <><Top title={title} onHome={()=>go("home")}/><main><button className="back" onClick={()=>go("home")}>← Dashboard</button>{children}</main></>}
function App(){
 const [screen,setScreen]=useState("home"),[score,setScore]=useState(18),[sid,setSid]=useState(null);
 const go=s=>setScreen(s);
 const props={go,score,setScore,sessionId:sid,setSessionId:setSid};
 if(screen==="analytics")return <Analytics go={go}/>;
 if(screen==="focus")return <Focus {...props}/>;
 if(screen==="history")return <History go={go}/>;
 if(screen==="gaming")return <Gaming {...props}/>;
 if(screen==="settings")return <SettingsPage go={go}/>;
 if(screen==="social")return <Social go={go}/>;
 return <Dashboard {...props}/>;
}
ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
