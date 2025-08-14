import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "@/firebase/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, getDocs, orderBy, query, Timestamp, where } from "firebase/firestore";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Trophy, Brain, BookOpen, Rocket, MessageSquare, Clock, Star, Target, Calendar, TrendingUp, X, Settings, Minus, Plus, Accessibility, Eye, Zap, Palette, MousePointer, ArrowRight, Crown, Users2, Target as TargetIcon, Award, Copy, QrCode, Plus as PlusIcon, Search, Home, BarChart3, Calendar as CalendarIcon, Activity, Target as TargetIcon2, TrendingUp as TrendingUpIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  // Accessibility preferences (same as landing page)
  const [fontLevel, setFontLevel] = useState(() => Number(localStorage.getItem("pp_fontLevel") ?? 0));
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem("pp_reducedMotion") === "true");
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("pp_highContrast") === "true");
  const [dyslexicFont, setDyslexicFont] = useState(() => localStorage.getItem("pp_dyslexicFont") === "true");
  const [customCursor, setCustomCursor] = useState(() => localStorage.getItem("pp_customCursor") === "true");
  const [darkMode, setDarkMode] = useState(() => 
    localStorage.getItem("pp_darkMode") === "true" || 
    (!("pp_darkMode" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const [showAccessibility, setShowAccessibility] = useState(false);

  // Apply accessibility settings
  useEffect(() => {
    const root = document.documentElement;
    const fontSize = 1 + (fontLevel * 0.1);
    root.style.fontSize = `${fontSize}rem`;
    if (dyslexicFont) root.style.fontFamily = 'OpenDyslexic, Arial, sans-serif';
    else root.style.fontFamily = '';
    if (highContrast) root.classList.add('high-contrast');
    else root.classList.remove('high-contrast');
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    if (customCursor) root.style.cursor = 'crosshair';
    else root.style.cursor = '';
  }, [fontLevel, dyslexicFont, highContrast, darkMode, customCursor]);

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
      {/* Accessibility Panel */}
      {showAccessibility && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Accessibility Settings</h2>
              <Button
                onClick={() => setShowAccessibility(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Typography */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Typography
                </h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Font Size</label>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setFontLevel(prev => Math.max(-2, prev - 1))}
                      className="h-8 w-8 p-0"
                    >
                      A-
                    </Button>
                    <span className="min-w-[2rem] text-center">{fontLevel}</span>
                    <Button
                      onClick={() => setFontLevel(prev => Math.min(3, prev + 1))}
                      className="h-8 w-8 p-0"
                    >
                      A+
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dyslexic Font</label>
                  <Button
                    onClick={() => setDyslexicFont(!dyslexicFont)}
                    className="h-8"
                  >
                    {dyslexicFont ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>
              
              {/* Visual */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Visual
                </h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dark Mode</label>
                  <Button
                    onClick={() => setDarkMode(!darkMode)}
                    className="h-8"
                  >
                    {darkMode ? 'Light' : 'Dark'}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">High Contrast</label>
                  <Button
                    onClick={() => setHighContrast(!highContrast)}
                    className="h-8"
                  >
                    {highContrast ? 'On' : 'Off'}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reduced Motion</label>
                  <Button
                    onClick={() => setReducedMotion(!reducedMotion)}
                    className="h-8"
                  >
                    {reducedMotion ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>
              
              {/* Interaction */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  Interaction
                </h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Cursor</label>
                  <Button
                    onClick={() => setCustomCursor(!customCursor)}
                    className="h-8"
                  >
                    {customCursor ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t">
              <Button
                onClick={() => {
                  setFontLevel(0);
                  setReducedMotion(false);
                  setHighContrast(false);
                  setDyslexicFont(false);
                  setCustomCursor(false);
                }}
                variant="outline"
                className="w-full"
              >
                Reset All Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Icon (Floating) */}
      <Button
        onClick={() => setShowAccessibility(!showAccessibility)}
        className="fixed bottom-6 left-6 z-40 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
        aria-label="Toggle accessibility panel"
      >
        <Accessibility className="h-5 w-5" />
      </Button>

      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="inline-flex items-center gap-2" aria-label="PointPulse home">
            <span className="text-xl sm:text-2xl font-bold text-gradient-brand">PointPulse</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link to="/leaderboard" className="hover:text-foreground transition-colors flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Leaderboard
            </Link>
            <Link to="/rooms" className="hover:text-foreground transition-colors flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              Rooms
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-4">
                My Study Sessions
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Track your study progress, analyze your patterns, and celebrate your achievements.
              </p>
            </div>

            {!user && (
              <div className="max-w-md mx-auto rounded-xl border bg-card p-6 text-center shadow-sm">
                <Activity className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Sign in to View Sessions</h2>
                <p className="text-muted-foreground mb-4">
                  Start tracking your study sessions and see your progress over time.
                </p>
                <Button asChild>
                  <Link to="/">Get Started</Link>
                </Button>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your study data...</p>
              </div>
            )}

            {!loading && user && (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Weekly Trend Chart */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUpIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">Weekly Study Trend</h2>
                  </div>
                  <div className="h-64">
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

                {/* Study Calendar */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Calendar className="h-6 w-6 text-accent" />
                    </div>
                    <h2 className="text-xl font-semibold">Study Calendar</h2>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {daily.map((d, i) => (
                      <div 
                        key={i} 
                        title={`${d.date}: ${d.minutes} min`} 
                        className="w-8 h-8 rounded-sm transition-colors hover:scale-110" 
                        style={{ 
                          background: d.minutes === 0 
                            ? "#f1f5f9" 
                            : `hsl(var(--primary) / ${Math.min(0.9, 0.2 + d.minutes/120)})` 
                        }} 
                      />
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Last 35 days of study activity
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Session History */}
        {!loading && user && (
          <section className="py-16 bg-background">
            <div className="container max-w-6xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-semibold text-primary mb-2">Session History</h2>
                <p className="text-muted-foreground">Your recent study sessions and achievements</p>
              </div>

              <div className="grid gap-4">
                {rows.map((r) => (
                  <div key={r.id} className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Clock className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{Math.round(r.durationSec / 60)} minutes</div>
                          <div className="text-sm text-muted-foreground">
                            {r.startedAt ? new Date(r.startedAt.toMillis()).toLocaleString() : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {Math.floor(r.durationSec / 3600)}h {Math.floor((r.durationSec % 3600) / 60)}m
                        </div>
                        <div className="text-sm text-muted-foreground">Total Duration</div>
                      </div>
                    </div>
                    
                    {/* Progress indicator */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Session Progress</span>
                        <span>{Math.round((r.durationSec / (60 * 60)) * 100)}%</span>
                      </div>
                      <Progress value={Math.min(100, (r.durationSec / (60 * 60)) * 100)} />
                    </div>
                  </div>
                ))}
                
                {rows.length === 0 && (
                  <div className="text-center py-12">
                    <TargetIcon2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Sessions Yet</h3>
                    <p className="text-muted-foreground">Start your first study session to see your progress here!</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
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


