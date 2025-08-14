import { useEffect, useState } from "react";
import { db } from "@/firebase/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Trophy, Brain, BookOpen, Rocket, MessageSquare, Clock, Star, Target, Calendar, TrendingUp, X, Settings, Minus, Plus, Accessibility, Eye, Zap, Palette, MousePointer, ArrowRight, Crown, Users2, Target as TargetIcon, Award, Copy, QrCode, Plus as PlusIcon, Search, Home, BarChart3, Calendar as CalendarIcon, Medal, TrendingUp as TrendingUpIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UserRank = {
  id: string;
  displayName: string | null | undefined;
  email: string | null | undefined;
  totalXp: number;
  totalFocusSec: number;
};

const Leaderboard = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<UserRank[]>([]);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, "users"),
          orderBy("totalXp", "desc"),
          limit(20)
        );
        const snap = await getDocs(q);
        const rows: UserRank[] = snap.docs.map((d) => {
          const v = d.data() as any;
          return {
            id: d.id,
            displayName: (v.nickname as string) ?? (v.displayName as string) ?? null,
            email: v.email ?? null,
            totalXp: Number(v.totalXp ?? 0),
            totalFocusSec: Number(v.totalFocusSec ?? 0),
          };
        });
        setUsers(rows);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
          <a href="/" className="inline-flex items-center gap-2" aria-label="PointPulse home">
            <span className="text-xl sm:text-2xl font-bold text-gradient-brand">PointPulse</span>
          </a>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/" className="hover:text-foreground transition-colors flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container max-w-6xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-4">
                Global Leaderboard
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                See who's leading the study game. Compete with students worldwide and climb the ranks.
              </p>
            </div>

            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading leaderboard...</p>
              </div>
            )}

            {error && (
              <div className="max-w-md mx-auto rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
                <p className="text-destructive">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="grid gap-6">
                {/* Top 3 Podium */}
                {users.length >= 3 && (
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {/* 2nd Place */}
                    <div className="order-2 md:order-1">
                      <div className="rounded-xl border bg-card p-6 shadow-sm text-center">
                        <div className="relative mb-4">
                          <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-600 grid place-items-center font-bold text-xl mx-auto">
                            2
                          </div>
                          <Medal className="h-6 w-6 text-slate-400 absolute -top-2 -right-2" />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">
                          {users[1].displayName || users[1].email || "Anonymous"}
                        </h3>
                        <p className="text-2xl font-bold text-slate-600 mb-2">{users[1].totalXp} XP</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.floor(users[1].totalFocusSec / 3600)}h {Math.floor((users[1].totalFocusSec % 3600) / 60)}m
                        </p>
                      </div>
                    </div>

                    {/* 1st Place */}
                    <div className="order-1 md:order-2">
                      <div className="rounded-xl border bg-card p-6 shadow-lg text-center relative">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Crown className="h-8 w-8 text-yellow-500" />
                        </div>
                        <div className="relative mb-4">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white grid place-items-center font-bold text-2xl mx-auto">
                            1
                          </div>
                        </div>
                        <h3 className="font-semibold text-xl mb-1">
                          {users[0].displayName || users[0].email || "Anonymous"}
                        </h3>
                        <p className="text-3xl font-bold text-yellow-600 mb-2">{users[0].totalXp} XP</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.floor(users[0].totalFocusSec / 3600)}h {Math.floor((users[0].totalFocusSec % 3600) / 60)}m
                        </p>
                      </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="order-3">
                      <div className="rounded-xl border bg-card p-6 shadow-sm text-center">
                        <div className="relative mb-4">
                          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 grid place-items-center font-bold text-xl mx-auto">
                            3
                          </div>
                          <Medal className="h-6 w-6 text-amber-500 absolute -top-2 -right-2" />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">
                          {users[2].displayName || users[2].email || "Anonymous"}
                        </h3>
                        <p className="text-2xl font-bold text-amber-600 mb-2">{users[2].totalXp} XP</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.floor(users[2].totalFocusSec / 3600)}h {Math.floor((users[2].totalFocusSec % 3600) / 60)}m
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Leaderboard */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Trophy className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">Complete Leaderboard</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {users.map((u, idx) => (
                      <div
                        key={u.id}
                        className="rounded-lg border bg-background p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold text-lg">
                              {idx + 1}
                            </div>
                            {idx === 0 && (
                              <Crown className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-lg">
                              {u.displayName || u.email || "Anonymous"}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {Math.floor(u.totalFocusSec / 3600)}h {Math.floor((u.totalFocusSec % 3600) / 60)}m
                              </span>
                              <span className="flex items-center gap-1">
                                <TargetIcon className="h-4 w-4" />
                                Focus Time
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{u.totalXp}</div>
                          <div className="text-sm text-muted-foreground">XP Points</div>
                        </div>
                      </div>
                    ))}
                    
                    {users.length === 0 && (
                      <div className="text-center py-12">
                        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Data Yet</h3>
                        <p className="text-muted-foreground">Start your first session to appear on the leaderboard!</p>
                      </div>
                    )}
                  </div>
                </div>
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

export default Leaderboard;


