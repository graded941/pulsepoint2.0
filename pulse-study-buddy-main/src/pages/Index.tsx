import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Users, Trophy, Brain, BookOpen, Rocket, MessageSquare, Clock, Star, Target, Calendar, TrendingUp, X, Settings, Minus, Plus, Accessibility, Eye, Zap, Palette, MousePointer, ArrowRight } from "lucide-react";
import heroJpg from "@/assets/hero-study.jpg";
import heroWebp from "@/assets/hero-study.webp";
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

  // Accessibility preferences
  const [fontLevel, setFontLevel] = useState(() => Number(localStorage.getItem("pp_fontLevel") ?? 0));
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem("pp_reducedMotion") === "true");
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("pp_highContrast") === "true");
  const [dyslexicFont, setDyslexicFont] = useState(() => localStorage.getItem("pp_dyslexicFont") === "true");
  const [customCursor, setCustomCursor] = useState(() => localStorage.getItem("pp_customCursor") === "true");
  
  // Theme toggle
  const [darkMode, setDarkMode] = useState(() => 
    localStorage.getItem("pp_darkMode") === "true" || 
    (!("pp_darkMode" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  // Accessibility panel
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [sessionLocked, setSessionLocked] = useState(false);

  // Gamified XP
  const [xp, setXp] = useState(() => Number(localStorage.getItem("pp_xp") ?? 120));
  const [isLoading, setIsLoading] = useState(true);

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

  // Save accessibility preferences to localStorage
  useEffect(() => {
    localStorage.setItem("pp_fontLevel", String(fontLevel));
    localStorage.setItem("pp_reducedMotion", String(reducedMotion));
    localStorage.setItem("pp_highContrast", String(highContrast));
    localStorage.setItem("pp_dyslexicFont", String(dyslexicFont));
    localStorage.setItem("pp_customCursor", String(customCursor));
    localStorage.setItem("pp_darkMode", String(darkMode));
  }, [fontLevel, reducedMotion, highContrast, dyslexicFont, customCursor, darkMode]);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Font size
    const fontSize = 1 + (fontLevel * 0.1);
    root.style.fontSize = `${fontSize}rem`;
    
    // Dyslexic font
    if (dyslexicFont) {
      root.style.fontFamily = 'OpenDyslexic, Arial, sans-serif';
    } else {
      root.style.fontFamily = '';
    }
    
    // High contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Dark mode
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Custom cursor
    if (customCursor) {
      root.style.cursor = 'crosshair';
    } else {
      root.style.cursor = '';
    }
  }, [fontLevel, dyslexicFont, highContrast, darkMode, customCursor]);

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

  // Confetti animation (only if motion allowed)
  const confetti = () => {
    if (reducedMotion) return;
    const root = document.getElementById("confetti-root");
    if (!root) return;

    const palette = [
      "hsl(var(--accent))",
      "hsl(var(--primary))",
      "hsl(var(--destructive))",
      "hsl(var(--muted-foreground))",
    ];

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

  // Demo session handler
  const startDemoSession = () => {
    setSessionLocked(true);
    toast({
      title: "Demo Session Started!",
      description: "You're now in a demo study session. Explore the features!",
    });
    
    // Auto-unlock after 30 seconds
    setTimeout(() => {
      setSessionLocked(false);
      toast({
        title: "Demo Session Ended",
        description: "Session unlocked. Sign up to continue your journey!",
      });
    }, 30000);
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
      {/* 3D Background */}

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
          <div className="relative w-full">
            <picture>
              <source srcSet={heroWebp} type="image/webp" />
              <img 
                src={heroJpg} 
                alt="Students studying together" 
                className="w-full h-full object-cover absolute inset-0"
                loading="lazy"
                decoding="async"
              />
            </picture>
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
                  See who's studying live, join focus rooms, and stay motivated by the pulse of your classmates.
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
                  Build streaks and unlock achievements like "NAPLEX Pro" or "Night Owl".
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

        {/* Demo Section */}
        <section aria-labelledby="demo-heading" className="py-12 bg-background">
          <div className="container">
            <h2 id="demo-heading" className="text-2xl sm:text-3xl font-semibold text-center text-primary">
              Try a Tiny Demo — Earn XP
            </h2>
            <div className="mt-6 flex flex-wrap gap-4 justify-center">
              {[
                { label: "Flashcards", xp: 8, icon: BookOpen, color: "text-accent" },
                { label: "Tracker", xp: 12, icon: Rocket, color: "text-primary" },
                { label: "Group Chat", xp: 6, icon: MessageSquare, color: "text-muted-foreground" },
              ].map((item, index) => (
                <div
                  key={index}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    const amt = item.xp;
                    setXp((x) => {
                      const n = x + amt;
                      if (n % 100 < amt) confetti();
                      return n;
                    });
                    toast({
                      title: "XP Gained!",
                      description: `+${amt} XP from ${item.label}`,
                      duration: 2000,
                    });
                  }}
                  className="rounded-xl border bg-card p-4 w-40 flex flex-col items-center shadow-sm hover:scale-[1.05] transition-transform focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label={item.label}
                >
                  <item.icon className={item.color} />
                  <div className="mt-2 font-medium">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <strong>XP: {xp}</strong>
            </div>

            {/* Session Lock */}
            <div className="mt-8 text-center">
              <Button
                onClick={startDemoSession}
                disabled={sessionLocked}
                className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
              >
                {sessionLocked ? 'Demo Active' : 'Start Demo Session'}
              </Button>
              <p className="mt-2 text-sm text-muted-foreground">
                {sessionLocked 
                  ? 'Demo session active - explore features!' 
                  : 'Unlock free demo to try all features'}
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-secondary">
          <div className="container">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold text-primary">
                Trusted by Thousands of Students
              </h2>
              <p className="mt-2 text-muted-foreground">
                Join a growing community of medical and pharmacy students who are crushing their goals together.
              </p>
            </div>
            
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Active Students", value: "12,847", icon: Users },
                { label: "Study Hours", value: "486K", icon: Clock },
                { label: "XP Points", value: "2.3M", icon: Star },
                { label: "Success Rate", value: "94%", icon: Trophy }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    <stat.icon className="text-primary h-8 w-8" />
                  </div>
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Achievement System Preview */}
        <section className="py-16 bg-background">
          <div className="container">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold text-primary">
                Level Up Your Study Game
              </h2>
              <p className="mt-2 text-muted-foreground">
                Unlock achievements, earn badges, and track your progress with our gamified learning system.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Target, title: "Focus Master", desc: "Complete 50 study sessions", progress: 78 },
                { icon: Calendar, title: "Consistency King", desc: "Study 30 days in a row", progress: 65 },
                { icon: Users, title: "Team Player", desc: "Join 20 group sessions", progress: 90 },
                { icon: Brain, title: "Knowledge Seeker", desc: "Ask 100 AI questions", progress: 45 }
              ].map((achievement, index) => (
                <div key={index} className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <achievement.icon className="text-primary h-5 w-5" />
                    <div>
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.desc}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{achievement.progress}%</span>
                    </div>
                    <Progress value={achievement.progress} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Student Testimonials */}
        <section className="py-16 bg-secondary">
          <div className="container">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold text-primary">
                What Students Are Saying
              </h2>
              <p className="mt-2 text-muted-foreground">
                Real feedback from real students who are using PointPulse to excel in their studies.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Sarah Chen",
                  role: "PharmD Student, UCLA",
                  content: "PointPulse helped me stay consistent with my NAPLEX prep. The peer accountability made all the difference!",
                  rating: 5,
                  avatar: "SC"
                },
                {
                  name: "Marcus Rodriguez",
                  role: "Med Student, Johns Hopkins",
                  content: "I love seeing my classmates studying live. It's like a virtual library that never closes.",
                  rating: 5,
                  avatar: "MR"
                },
                {
                  name: "Priya Patel",
                  role: "PharmD Student, UCSF",
                  content: "The AI tutor is incredible for quick clarifications during study sessions. Game changer!",
                  rating: 5,
                  avatar: "PP"
                }
              ].map((testimonial, index) => (
                <div key={index} className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <blockquote className="text-muted-foreground mb-4">"{testimonial.content}"</blockquote>
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upcoming Features */}
        <section className="py-16 bg-background">
          <div className="container">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold text-primary">
                What's Coming Next
              </h2>
              <p className="mt-2 text-muted-foreground">
                We're constantly evolving. Here's a sneak peek at the exciting features we're building.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Smart Study Plans",
                  description: "AI-generated personalized study schedules based on your exam date and progress",
                  eta: "Coming Q2 2025",
                  icon: Brain
                },
                {
                  title: "Video Study Rooms",
                  description: "Face-to-face study sessions with classmates in virtual rooms",
                  eta: "Coming Q3 2025", 
                  icon: Users
                },
                {
                  title: "Performance Analytics",
                  description: "Detailed insights into your study patterns and productivity trends",
                  eta: "Coming Q1 2025",
                  icon: TrendingUp
                }
              ].map((feature, index) => (
                <div key={index} className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <feature.icon className="text-primary h-6 w-6" />
                    <div className="text-sm text-muted-foreground font-medium">
                      {feature.eta}
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <Button variant="outline" size="sm">
                    Learn more
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
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
      <div id="confetti-root" className="relative w-full h-0" />
    </div>
  );
};

export default Index;
