import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth } from "@/firebase/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { createRoom, getRoomLeaderboard, joinRoom, leaveRoom, listUserRooms, type RoomMemberWithStats, resolveRoomIdByShortId, updateRoomMetadata } from "@/firebase/rooms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Users, Trophy, Brain, BookOpen, Rocket, MessageSquare, Clock, Star, Target, Calendar, TrendingUp, X, Settings, Minus, Plus, Accessibility, Eye, Zap, Palette, MousePointer, ArrowRight, Crown, Users2, Target as TargetIcon, Award, Copy, QrCode, Plus as PlusIcon, Search, Home, BarChart3, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Rooms = () => {
  const [user, setUser] = useState<User | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomIcon, setRoomIcon] = useState("📚");
  const [joinId, setJoinId] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<RoomMemberWithStats[]>([]);
  const [myRooms, setMyRooms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
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
  
  // Honor query params: ?join=SHORT_OR_ID or ?open=ROOM_ID
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const join = params.get("join");
    const open = params.get("open");
    (async () => {
      if (open) {
        setCurrentRoomId(open);
      }
      if (join && user) {
        let resolved = join;
        if (resolved.length <= 8) {
          const viaShort = await resolveRoomIdByShortId(resolved);
          if (viaShort) resolved = viaShort;
        }
        try { 
          await joinRoom(user.uid, resolved); 
          setCurrentRoomId(resolved);
          toast({
            title: "Room Joined!",
            description: "You've successfully joined the room.",
          });
        }
        catch (error) {
          console.error('Error joining room:', error);
          toast({
            title: "Join Failed",
            description: "Unable to join the room. Please check the room ID.",
            variant: "destructive",
          });
        }
      }
    })();
  }, [location.search, user, toast]);

  useEffect(() => {
    async function loadRooms() {
      if (!user) return;
      const rows = await listUserRooms(user.uid);
      setMyRooms(rows.map((r) => r.roomId));
    }
    loadRooms();
  }, [user]);

  useEffect(() => {
    async function loadLB() {
      if (!currentRoomId) { setLeaderboard([]); return; }
      setLoading(true); setError(null);
      try {
        const rows = await getRoomLeaderboard(currentRoomId);
        setLeaderboard(rows);
      } catch (e: unknown) { 
        const error = e as Error;
        setError(error?.message ?? "Failed to load leaderboard"); 
      }
      finally { setLoading(false); }
    }
    loadLB();
  }, [currentRoomId]);

  const canManage = useMemo(() => Boolean(user), [user]);

  async function handleCreate() {
    if (!user || !roomName.trim()) return;
    setLoading(true); setError(null);
    try {
      const { roomId, shortId } = await createRoom(user.uid, roomName.trim(), roomIcon);
      setRoomName("");
      setRoomIcon("📚");
      setMyRooms((x) => Array.from(new Set([...x, roomId])));
      setCurrentRoomId(roomId);
      toast({
        title: "Room Created!",
        description: `Room "${roomName.trim()}" has been created successfully.`,
      });
    } catch (e: unknown) { 
      const error = e as Error;
      setError(error?.message ?? "Create failed"); 
      toast({
        title: "Creation Failed",
        description: "Unable to create room. Please try again.",
        variant: "destructive",
      });
    }
    finally { setLoading(false); }
  }

  async function handleJoin() {
    if (!user || !joinId.trim()) return;
    setLoading(true); setError(null);
    try {
      let resolved = joinId.trim();
      if (resolved.length <= 8) {
        const viaShort = await resolveRoomIdByShortId(resolved);
        if (viaShort) resolved = viaShort;
      }
      await joinRoom(user.uid, resolved);
      setMyRooms((x) => Array.from(new Set([...x, resolved])));
      setCurrentRoomId(resolved);
      setJoinId("");
      toast({
        title: "Room Joined!",
        description: "You've successfully joined the room.",
      });
    } catch (e: unknown) { 
      const error = e as Error;
      setError(error?.message ?? "Join failed"); 
      toast({
        title: "Join Failed",
        description: "Unable to join the room. Please check the room ID.",
        variant: "destructive",
      });
    }
    finally { setLoading(false); }
  }

  async function handleLeave(id: string) {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      await leaveRoom(user.uid, id);
      setMyRooms((x) => x.filter((r) => r !== id));
      if (currentRoomId === id) setCurrentRoomId("");
      toast({
        title: "Room Left",
        description: "You've left the room successfully.",
      });
    } catch (e: unknown) { 
      const error = e as Error;
      setError(error?.message ?? "Leave failed"); 
    }
    finally { setLoading(false); }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard?.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Room ID copied to clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    });
  }

  function RoomBadge({ id, onOpen, onLeave }: { id: string; onOpen: () => void; onLeave: () => void }) {
    const [meta, setMeta] = useState<{ shortId?: string; name?: string; icon?: string } | null>(null);
    useEffect(() => {
      (async () => {
        setMeta(null);
        try {
          const resp = await fetch(`/__room_meta?id=${id}`);
        } catch {}
      })();
    }, [id]);
    
    return (
      <div className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="text-2xl" aria-hidden>{meta?.icon ?? "📚"}</div>
          <div className="flex-1">
            <button 
              className="font-semibold text-primary hover:underline" 
              onClick={onOpen}
            >
              {meta?.name ?? id}
            </button>
            <div className="text-xs text-muted-foreground">Room ID: {id}</div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(id)}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onLeave}
              className="h-8"
            >
              Leave
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function RoomHeader({ roomId }: { roomId: string }) {
    const [meta, setMeta] = useState<{ name?: string; shortId?: string; icon?: string } | null>(null);
    const [newName, setNewName] = useState("");
    const [newIcon, setNewIcon] = useState("📚");
    const [saving, setSaving] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

    useEffect(() => {
      (async () => {
        setSaving(false);
        const res = await fetch(`/__room/${roomId}`);
        setMeta({});
      })();
    }, [roomId]);

    const joinUrl = `${location.origin}/rooms?join=${roomId}`;

    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl" aria-hidden>{meta?.icon ?? "📚"}</div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-primary">{meta?.name ?? "Room Leaderboard"}</h2>
            <p className="text-sm text-muted-foreground">Room ID: {roomId}</p>
          </div>
        </div>
        
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => copyToClipboard(roomId)}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Room ID
          </Button>
          <Button
            variant="outline"
            onClick={() => copyToClipboard(joinUrl)}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Invite Link
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const { toDataURL } = await import("qrcode");
                const dataUrl = await toDataURL(joinUrl, { margin: 1, width: 180 });
                setQrDataUrl(dataUrl);
              } catch {}
            }}
            className="flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            Show QR
          </Button>
        </div>
        
        {qrDataUrl && (
          <div className="mb-6 text-center">
            <img src={qrDataUrl} alt="Room invite QR" className="border rounded-lg p-2 bg-background mx-auto" />
          </div>
        )}
        
        {user && (
          <div className="grid sm:grid-cols-[80px,1fr,auto] gap-4 items-center p-4 bg-muted/30 rounded-lg">
            <Input
              className="text-center"
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              maxLength={4}
              placeholder="Icon"
            />
            <Input
              placeholder="New room name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Button
              disabled={saving || (!newName.trim() && !newIcon.trim())}
              onClick={async () => {
                setSaving(true);
                try { 
                  await updateRoomMetadata(roomId, { name: newName || undefined, icon: newIcon || undefined }); 
                  setNewName("");
                  toast({
                    title: "Room Updated",
                    description: "Room settings have been updated.",
                  });
                }
                finally { setSaving(false); }
              }}
            >
              Save
            </Button>
          </div>
        )}
      </div>
    );
  }

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
            <Link to="/sessions" className="hover:text-foreground transition-colors flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              My Sessions
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
                Private Study Rooms
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Create or join private rooms and compete with friends. Build accountability, track progress, and stay motivated together.
              </p>
            </div>

            {!user && (
              <div className="max-w-md mx-auto rounded-xl border bg-card p-6 text-center shadow-sm">
                <Users2 className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Sign in to Manage Rooms</h2>
                <p className="text-muted-foreground mb-4">
                  Create your own study rooms or join existing ones to start collaborating with peers.
                </p>
                <Button asChild>
                  <Link to="/">Get Started</Link>
                </Button>
              </div>
            )}

            {canManage && (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Create Room */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <PlusIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">Create a Private Room</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-[80px,1fr] gap-4 items-center">
                      <Input
                        className="text-center text-lg"
                        placeholder="Icon"
                        value={roomIcon}
                        onChange={(e) => setRoomIcon(e.target.value)}
                        maxLength={4}
                      />
                      <Input
                        placeholder="Room name"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={handleCreate} 
                      disabled={loading || !roomName.trim()}
                      className="w-full"
                    >
                      {loading ? "Creating..." : "Create Room"}
                    </Button>
                  </div>
                </div>

                {/* Join Room */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Search className="h-6 w-6 text-accent" />
                    </div>
                    <h2 className="text-xl font-semibold">Join a Room</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <Input
                      placeholder="Room ID or Short ID"
                      value={joinId}
                      onChange={(e) => setJoinId(e.target.value)}
                    />
                    <Button 
                      onClick={handleJoin} 
                      disabled={loading || !joinId.trim()}
                      className="w-full"
                    >
                      {loading ? "Joining..." : "Join Room"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* My Rooms Section */}
        {myRooms.length > 0 && (
          <section className="py-16 bg-background">
            <div className="container max-w-6xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-semibold text-primary mb-2">Your Study Rooms</h2>
                <p className="text-muted-foreground">Manage your rooms and track member progress</p>
              </div>
              
              <div className="grid gap-4">
                {myRooms.map((id) => (
                  <RoomBadge 
                    key={id} 
                    id={id} 
                    onOpen={() => setCurrentRoomId(id)} 
                    onLeave={() => handleLeave(id)} 
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Current Room Leaderboard */}
        {currentRoomId && (
          <section className="py-16 bg-secondary">
            <div className="container max-w-6xl">
              <RoomHeader roomId={currentRoomId} />
              
              {loading && (
                <div className="mt-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading leaderboard...</p>
                </div>
              )}
              
              {error && (
                <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
                  <p className="text-destructive">{error}</p>
                </div>
              )}
              
              {!loading && !error && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-primary mb-6">Room Leaderboard</h3>
                  <div className="grid gap-4">
                    {leaderboard.map((u, idx) => (
                      <div key={u.uid} className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
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
                                {u.displayName || u.email || u.uid}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {Math.floor(u.totalFocusSec / 3600)}h {Math.floor((u.totalFocusSec % 3600) / 60)}m
                                </span>
                                <span className="flex items-center gap-1">
                                  <TargetIcon className="h-4 w-4" />
                                  {Math.floor(u.totalFocusSec / 3600)}h {Math.floor((u.totalFocusSec % 3600) / 60)}m
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{u.totalXp}</div>
                            <div className="text-sm text-muted-foreground">XP Points</div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{Math.round((u.totalFocusSec / (24 * 3600)) * 100)}%</span>
                          </div>
                          <Progress value={Math.min(100, (u.totalFocusSec / (24 * 3600)) * 100)} />
                        </div>
                      </div>
                    ))}
                    
                    {leaderboard.length === 0 && (
                      <div className="text-center py-12">
                        <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Members Yet</h3>
                        <p className="text-muted-foreground">Invite friends to join your study room!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
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

export default Rooms;


