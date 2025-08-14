import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "@/firebase/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, getDocs, orderBy, query, Timestamp, where } from "firebase/firestore";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { db } from "@/firebase/firebase";

type SessionRow = {
  id: string;
  durationSec: number;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
};

const MySessions = () => {
  const [user, setUser] = useState<User | null>(null);
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [daily, setDaily] = useState<{ date: string; minutes: number }[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<{ day: string; minutes: number }[]>([]);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  useEffect(() => {
    async function load() {
      if (!user) { setRows([]); return; }
      setLoading(true);
      const since = Timestamp.fromDate(new Date(Date.now() - 35 * 86400000));
      const q = query(collection(db, "users", user.uid, "sessions"), where("startedAt", ">=", since), orderBy("startedAt", "desc"));
      const snap = await getDocs(q);
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
      // aggregate per day
      const perDay = new Map<string, number>();
      snap.docs.forEach((d) => {
        const v = d.data() as any;
        const t = (v.startedAt as Timestamp)?.toDate() ?? new Date();
        const key = t.toISOString().slice(0,10);
        perDay.set(key, (perDay.get(key) ?? 0) + Math.round((v.durationSec ?? 0) / 60));
      });
      const days: { date: string; minutes: number }[] = [];
      for (let i=34;i>=0;i--) {
        const d = new Date(Date.now() - i*86400000);
        const key = d.toISOString().slice(0,10);
        days.push({ date: key, minutes: perDay.get(key) ?? 0 });
      }
      setDaily(days);
      // last 7 days for area chart
      setWeeklyTrend(days.slice(-7).map((d, idx) => ({ day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][new Date(d.date).getDay()] , minutes: d.minutes })));
    }
    load();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center justify-between py-4">
          <a href="/" className="inline-flex items-center gap-2" aria-label="PointPulse home">
            <span className="text-xl sm:text-2xl font-bold text-gradient-brand">PointPulse</span>
          </a>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/">Home</Link>
            <Link to="/leaderboard">Leaderboard</Link>
            <Link to="/rooms">Rooms</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-10">
          <div className="container max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-semibold text-primary">My Sessions</h1>
            {!user && <div className="mt-4 text-sm text-muted-foreground">Sign in to view your sessions.</div>}
            {loading && <div className="mt-4 text-sm text-muted-foreground">Loading…</div>}

            {!loading && user && (
              <div className="mt-6 grid gap-6">
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground">Last 7 days</h2>
                  <div className="h-40 mt-2 border rounded-lg bg-card p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#g)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground">Calendar</h2>
                  <div className="mt-2 grid grid-cols-7 gap-1">
                    {daily.map((d, i) => (
                      <div key={i} title={`${d.date}: ${d.minutes} min`} className="w-8 h-8 rounded-sm" style={{ background: d.minutes===0?"#f1f5f9": `hsl(var(--primary) / ${Math.min(0.9, 0.2 + d.minutes/120)})` }} />
                    ))}
                  </div>
                </div>
                <ol className="space-y-2">
                {rows.map((r) => (
                  <li key={r.id} className="rounded-xl border bg-card p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{Math.round(r.durationSec / 60)} min</div>
                      <div className="text-xs text-muted-foreground">
                        {r.startedAt ? new Date(r.startedAt.toMillis()).toLocaleString() : ""}
                      </div>
                    </div>
                    <div className="text-sm">{Math.floor(r.durationSec / 3600)}h {Math.floor((r.durationSec % 3600) / 60)}m</div>
                  </li>
                ))}
                {rows.length === 0 && (
                  <li className="text-sm text-muted-foreground">No sessions yet.</li>
                )}
                </ol>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-muted/30 border-t">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 PointPulse — Built for students, by students.</p>
        </div>
      </footer>
    </div>
  );
};

export default MySessions;


