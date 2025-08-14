import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "@/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { resolveRoomIdByShortId, joinRoom } from "@/firebase/rooms";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Brain, BookOpen, Rocket, MessageSquare, Clock, Star, Target, Calendar, TrendingUp, X, Settings, Minus, Plus, Accessibility, Eye, Zap, Palette, MousePointer, ArrowRight, Crown, Users2, Target as TargetIcon, Award, Copy, QrCode, Plus as PlusIcon, Search, Home, BarChart3, Calendar as CalendarIcon, ArrowRight as ArrowRightIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Invite = () => {
  const { shortId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("Resolving invite…");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ name?: string; icon?: string; members?: number } | null>(null);
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
    let unsub = () => {};
    (async () => {
      if (!shortId) return;
      const rid = await resolveRoomIdByShortId(shortId);
      if (!rid) {
        setStatus("Invite not found");
        return;
      }
      setRoomId(rid);
      try {
        const membersSnap = await getDocs(collection(db, "rooms", rid, "members"));
        setMeta({ name: undefined, icon: "📚", members: membersSnap.size });
        setStatus("");
      } catch (error) {
        console.error('Error loading room:', error);
        setStatus("");
      }
      unsub = onAuthStateChanged(auth, () => {});
    })();
    return () => unsub();
  }, [shortId, navigate]);

  const onJoin = async () => {
    if (!shortId || !roomId) return;
    const u = auth.currentUser;
    if (!u) { 
      navigate(`/rooms?join=${shortId}`); 
      toast({
        title: "Sign In Required",
        description: "Please sign in to join the room.",
      });
      return; 
    }
    try { 
      await joinRoom(u.uid, roomId); 
      toast({
        title: "Room Joined!",
        description: "You've successfully joined the room.",
      });
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "Join Failed",
        description: "Unable to join the room. Please try again.",
        variant: "destructive",
      });
    }
    navigate(`/rooms?open=${roomId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center justify-between py-4">
          <a href="/" className="inline-flex items-center gap-2" aria-label="PointPulse home">
            <span className="text-xl sm:text-2xl font-bold text-gradient-brand">PointPulse</span>
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {status && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{status}</p>
            </div>
          )}
          
          {!status && (
            <div className="rounded-2xl border bg-card p-8 text-center shadow-lg">
              <div className="text-6xl mb-6" aria-hidden>{meta?.icon ?? "📚"}</div>
              <h1 className="text-2xl font-bold text-primary mb-2">Join Study Room</h1>
              <p className="text-muted-foreground mb-4">{meta?.name ?? shortId}</p>
              
              {typeof meta?.members === "number" && (
                <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
                  <Users2 className="h-4 w-4" />
                  <span>{meta.members} members</span>
                </div>
              )}
              
              <div className="space-y-4">
                <Button 
                  onClick={onJoin} 
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  Join Room
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </Button>
                
                <div className="text-xs text-muted-foreground">
                  You may be asked to sign in if you haven't already.
                </div>
              </div>
              
              {/* Room Benefits */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-semibold text-primary mb-3">What you'll get:</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-accent" />
                    <span>Study with peers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-3 w-3 text-accent" />
                    <span>Earn XP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-accent" />
                    <span>Track progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-3 w-3 text-accent" />
                    <span>AI support</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-muted/30 border-t">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 PointPulse — Built for students, by students.</p>
        </div>
      </footer>
    </div>
  );
};

export default Invite;


