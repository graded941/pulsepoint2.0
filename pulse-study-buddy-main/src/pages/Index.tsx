import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Users, Trophy, Brain, BookOpen, Rocket, MessageSquare } from "lucide-react";
import heroImage from "@/assets/hero-study.jpg";
import UserMenu from "@/components/UserMenu";
import { FormEvent, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth, googleProvider } from "@/firebase/firebase";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { ensureUserProfile, saveStudySession } from "@/firebase/study";
import { Link } from "react-router-dom";
import AuthPanel from "@/components/AuthPanel";

const Index = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [sessionElapsed, setSessionElapsed] = useState<number>(0);
  const [sessionTicking, setSessionTicking] = useState<boolean>(false);

  // Accessibility handled globally by AccessibilityDock

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log("User is signed in:", currentUser.email);
        ensureUserProfile(currentUser.uid, { email: currentUser.email, displayName: currentUser.displayName }).catch(console.error);
      } else {
        console.log("User is signed out");
      }
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Simple session timer
  useEffect(() => {
    if (!sessionTicking || sessionStart === null) return;
    const handle = setInterval(() => setSessionElapsed(Date.now() - sessionStart), 1000);
    return () => clearInterval(handle);
  }, [sessionTicking, sessionStart]);

  function startSession() {
    setSessionStart(Date.now());
    setSessionElapsed(0);
    setSessionTicking(true);
  }

  async function stopSession() {
    if (!user || sessionStart === null) return;
    const durationSec = Math.max(1, Math.floor((Date.now() - sessionStart) / 1000));
    try {
      await saveStudySession({
        uid: user.uid,
        durationSec,
        startedAt: new Date(sessionStart),
        endedAt: new Date(),
      });
      toast({ title: "Session saved", description: `Saved ${Math.round(durationSec / 60)} min` });
    } catch (err) {
      console.error(err);
      toast({ title: "Could not save session", description: "Please try again" });
    } finally {
      setSessionTicking(false);
      setSessionStart(null);
      setSessionElapsed(0);
    }
  }

  // Gamified XP
  const [xp, setXp] = useState<number>(() => Number(localStorage.getItem("pp_xp") ?? 120));
  useEffect(() => {
    localStorage.setItem("pp_xp", String(xp));
  }, [xp]);

  const confetti = () => {
    if (reducedMotion) return;
    const root = document.getElementById("confetti-root");
    if (!root) return;
    const palette = ["hsl(var(--accent))", "hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];
    for (let i = 0; i < 12; i++) {
      const d = document.createElement("div");
      d.style.position = "absolute";
      d.style.left = 30 + Math.random() * 40 + "%";
      d.style.top = "10%";
      d.style.width = "8px";
      d.style.height = "10px";
      d.style.background = palette[Math.floor(Math.random() * palette.length)];
      d.style.borderRadius = "2px";
      d.style.opacity = "0.95";
      d.style.transform = "translateY(0px)";
      d.style.transition = "transform 900ms cubic-bezier(.2,.8,.2,1), opacity 900ms";
      root.appendChild(d);
      setTimeout(() => {
        d.style.transform = "translateY(380px) rotate(180deg)";
        d.style.opacity = "0";
      }, 40 + Math.random() * 200);
      setTimeout(() => d.remove(), 1200);
    }
  };
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("email", email);
      const res = await fetch("https://formspree.io/f/xyyljvqz", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        toast({
          title: "You're on the list!",
          description: "We\u2019ll email you as soon as PointPulse opens.",
        });
        setEmail("");
      } else {
        toast({
          title: "Something went wrong",
          description: "Please try again in a moment.",
        });
      }
    } catch (err) {
      toast({
        title: "Network error",
        description: "Please check your connection and try again.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Accessibility controls are provided by the global AccessibilityDock */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center justify-between py-4">
          <a href="#home" className="inline-flex items-center gap-2" aria-label="PointPulse home">
            <span className="text-xl sm:text-2xl font-bold text-gradient-brand">PointPulse</span>
          </a>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#waitlist" className="hover:text-foreground transition-colors">Waitlist</a>
            <Link to="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link>
            {/* UserMenu appears on detail pages; simplified header here */}
            {user ? (
              sessionTicking ? (
                <Button size="sm" variant="destructive" onClick={stopSession}>Stop & Save</Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={startSession}>Start Session</Button>
              )
            ) : null}
          </nav>
        </div>
      </header>

      <main id="home" className="flex-1">
        {/* Hero */}
        <section
          aria-labelledby="hero-heading"
          className="relative"
        >
          <div className="relative w-full" style={{ backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }}>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/85 to-accent/80" />
            <div className="relative container text-primary-foreground py-24 sm:py-32">
              <h1 id="hero-heading" className="max-w-3xl text-4xl sm:text-5xl font-bold leading-tight">
                Study Accountability for Med & Pharm Students
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-primary-foreground/90">
                Stay focused. Earn points. Study with peers. PointPulse helps you build accountability, beat isolation, and crush your exams.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a href="#waitlist">
                  <Button size="lg">Join the Waitlist</Button>
                </a>
                <a href="#how-it-works">
                  <Button size="lg" variant="hero">How It Works</Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" aria-labelledby="features-heading" className="py-16 bg-background">
          <div className="container">
            <h2 id="features-heading" className="text-2xl sm:text-3xl font-semibold text-center text-primary">
              Why Students Love PointPulse
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow" aria-label="Study with peers">
                <div className="flex justify-center">
                  <Users className="text-primary" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-center text-lg font-semibold text-primary">Study With Peers</h3>
                <p className="mt-2 text-center text-muted-foreground">
                  See who’s studying live, join focus rooms, and stay motivated by the pulse of your classmates.
                </p>
                <div className="mt-4">
                  <Progress value={70} aria-label="Example progress 70%" />
                </div>
              </article>
              <article className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow" aria-label="Earn points and badges">
                <div className="flex justify-center">
                  <Trophy className="text-primary" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-center text-lg font-semibold text-primary">Earn Points & Badges</h3>
                <p className="mt-2 text-center text-muted-foreground">
                  Build streaks and unlock achievements like “NAPLEX Pro” or “Night Owl”.
                </p>
                <div className="mt-4">
                  <Progress value={50} aria-label="Example progress 50%" />
                </div>
              </article>
              <article className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow" aria-label="AI-powered study help">
                <div className="flex justify-center">
                  <Brain className="text-primary" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-center text-lg font-semibold text-primary">AI-Powered Study Help</h3>
                <p className="mt-2 text-center text-muted-foreground">
                  Ask questions and get instant answers from an AI tutor trained on pharmacology and medicine.
                </p>
                <div className="mt-4">
                  <Progress value={90} aria-label="Example progress 90%" />
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" aria-labelledby="how-heading" className="py-16 bg-secondary">
          <div className="container">
            <h2 id="how-heading" className="text-2xl sm:text-3xl font-semibold text-center text-primary">
              How It Works — 3 Simple Steps
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl bg-card border p-6 shadow-sm hover:scale-[1.01] transition-transform">
                <strong className="text-primary">1. Sign Up & Set Goals</strong>
                <p className="mt-2 text-muted-foreground">Choose your course, exam date, and daily focus target.</p>
              </div>
              <div className="rounded-xl bg-card border p-6 shadow-sm hover:scale-[1.01] transition-transform">
                <strong className="text-primary">2. Join a Focus Session</strong>
                <p className="mt-2 text-muted-foreground">Start studying and appear in the Study Wall.</p>
              </div>
              <div className="rounded-xl bg-card border p-6 shadow-sm hover:scale-[1.01] transition-transform">
                <strong className="text-primary">3. Earn & Level Up</strong>
                <p className="mt-2 text-muted-foreground">Collect points and track your progress with weekly insights.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo */}
        <section aria-labelledby="demo-heading" className="py-12 bg-background">
          <div className="container">
            <h2 id="demo-heading" className="text-2xl sm:text-3xl font-semibold text-center text-primary">Try a tiny demo — earn XP</h2>
            <div className="mt-6 flex flex-wrap gap-4 justify-center">
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  const amt = 8; setXp((x) => { const n = x + amt; if (n % 100 < amt) confetti(); return n; });
                }}
                className="rounded-xl border bg-card p-4 w-40 flex flex-col items-center shadow-sm hover:scale-[1.03] transition-transform focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Flashcards"
              >
                <BookOpen className="text-accent" />
                <div className="mt-2 font-medium">Flashcards</div>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  const amt = 12; setXp((x) => { const n = x + amt; if (n % 100 < amt) confetti(); return n; });
                }}
                className="rounded-xl border bg-card p-4 w-40 flex flex-col items-center shadow-sm hover:scale-[1.03] transition-transform focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Tracker"
              >
                <Rocket className="text-primary" />
                <div className="mt-2 font-medium">Tracker</div>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  const amt = 6; setXp((x) => { const n = x + amt; if (n % 100 < amt) confetti(); return n; });
                }}
                className="rounded-xl border bg-card p-4 w-40 flex flex-col items-center shadow-sm hover:scale-[1.03] transition-transform focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Group Chat"
              >
                <MessageSquare className="text-muted-foreground" />
                <div className="mt-2 font-medium">Group Chat</div>
              </div>
            </div>
            <div className="mt-4 text-center"><strong>XP:</strong> <span>{xp}</span></div>
            <div id="confetti-root" className="relative w-full h-0" />
          </div>
        </section>

        {/* CTA */}
        <section id="waitlist" aria-labelledby="cta-heading" className="py-16 bg-background">
          <div className="container">
            <div className="max-w-3xl mx-auto rounded-2xl border bg-card p-8 shadow-sm">
              <h2 id="cta-heading" className="text-2xl sm:text-3xl font-semibold text-center text-primary">
                Be the First to Study with PointPulse
              </h2>
              <p className="mt-2 text-center text-muted-foreground">
                We're launching soon for pharmacy and medical students. Join the waitlist for early access.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Input
                  type="email"
                  name="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full sm:w-80"
                  aria-label="Email address"
                />
                <Button type="submit" className="w-full sm:w-auto">
                  Get Early Access
                </Button>
              </form>
            </div>
            <div className="mt-8 max-w-3xl mx-auto">
              <AuthPanel />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-muted/30 border-t">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 PointPulse — Built for students, by students.</p>
        </div>
      </footer>
      <div className="fixed bottom-4 right-4 z-40 rounded-xl border bg-card px-3 py-2 shadow-sm">
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">XP: {xp}</span>
          {sessionTicking && (
            <span>Session: {Math.floor(sessionElapsed / 60000)}:{String(Math.floor((sessionElapsed % 60000) / 1000)).padStart(2, "0")}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
