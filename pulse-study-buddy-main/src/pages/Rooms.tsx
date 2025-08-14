import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth } from "@/firebase/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { createRoom, getRoomLeaderboard, joinRoom, leaveRoom, listUserRooms, type RoomMemberWithStats, resolveRoomIdByShortId, updateRoomMetadata } from "@/firebase/rooms";

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
        try { await joinRoom(user.uid, resolved); setCurrentRoomId(resolved); }
        catch (error) {
          console.error('Error joining room:', error);
        }
      }
    })();
  }, [location.search, user]);

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
    } catch (e: unknown) { 
      const error = e as Error;
      setError(error?.message ?? "Create failed"); 
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
    } catch (e: unknown) { 
      const error = e as Error;
      setError(error?.message ?? "Join failed"); 
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
    } catch (e: unknown) { 
      const error = e as Error;
      setError(error?.message ?? "Leave failed"); 
    }
    finally { setLoading(false); }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {
      // ignore
    });
  }

  function RoomBadge({ id, onOpen, onLeave }: { id: string; onOpen: () => void; onLeave: () => void }) {
    const [meta, setMeta] = useState<{ shortId?: string; name?: string; icon?: string } | null>(null);
    useEffect(() => {
      (async () => {
        // reuse listUserRooms to fetch meta per id if needed
        setMeta(null);
        // quick fetch for meta
        try {
          const resp = await fetch(`/__room_meta?id=${id}`);
        } catch {}
      })();
    }, [id]);
    // Fallback display with id only; meta is rendered in header when selected
    return (
      <div className="border rounded-md px-3 py-2 bg-card flex items-center gap-2">
        <button className="underline" onClick={onOpen} title="View leaderboard">{id}</button>
        <button className="text-xs" onClick={() => copyToClipboard(id)}>Copy ID</button>
        <button className="text-xs" onClick={onLeave}>Leave</button>
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
        // Note: we don't have an API; display minimal header without network
        setMeta({});
      })();
    }, [roomId]);

    const joinUrl = `${location.origin}/rooms?join=${roomId}`;
    const copy = (t: string) => navigator.clipboard?.writeText(t).catch(() => {});

    return (
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="text-2xl" aria-hidden> {meta?.icon ?? "📚"} </div>
          <h2 className="text-xl font-semibold">{meta?.name ?? "Room Leaderboard"}</h2>
        </div>
        <div className="text-xs text-muted-foreground break-all">Room ID: {roomId}</div>
        <div className="flex gap-2 flex-wrap text-xs">
          <button className="px-2 py-1 border rounded" onClick={() => copy(roomId)}>Copy Room ID</button>
          <button className="px-2 py-1 border rounded" onClick={() => copy(joinUrl)}>Copy Invite Link</button>
          <button className="px-2 py-1 border rounded" onClick={async ()=>{
            try {
              const { toDataURL } = await import("qrcode");
              const dataUrl = await toDataURL(joinUrl, { margin: 1, width: 180 });
              setQrDataUrl(dataUrl);
            } catch {}
          }}>Show QR</button>
        </div>
        {qrDataUrl && (
          <div className="mt-2">
            <img src={qrDataUrl} alt="Room invite QR" className="border rounded-md p-1 bg-card" />
          </div>
        )}
        {user && (
          <div className="mt-2 grid sm:grid-cols-[80px,1fr,auto] gap-2 items-center">
            <input className="border rounded-md px-2 py-1" value={newIcon} onChange={(e)=>setNewIcon(e.target.value)} maxLength={4} />
            <input className="border rounded-md px-2 py-1" placeholder="New room name" value={newName} onChange={(e)=>setNewName(e.target.value)} />
            <button className="px-3 py-2 border rounded" disabled={saving || (!newName.trim() && !newIcon.trim())} onClick={async ()=>{
              setSaving(true);
              try { await updateRoomMetadata(roomId, { name: newName || undefined, icon: newIcon || undefined }); setNewName(""); }
              finally { setSaving(false); }
            }}>Save</button>
          </div>
        )}
      </div>
    );
  }
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
            <Link to="/sessions">My Sessions</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-10">
          <div className="container max-w-4xl">
            <h1 className="text-2xl sm:text-3xl font-semibold text-primary">Private Rooms</h1>
            <p className="text-muted-foreground mt-1">Create or join a private room and compete with friends.</p>

            {!user && (
              <div className="mt-6 text-sm text-muted-foreground">Sign in to manage rooms.</div>
            )}

            {canManage && (
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border bg-card p-4">
                  <h2 className="font-semibold mb-2">Create a private room</h2>
                  <div className="grid sm:grid-cols-[80px,1fr] gap-3 items-center">
                    <input className="border rounded-md px-3 py-2 w-full" placeholder="Icon (e.g., 🧠)" value={roomIcon} onChange={(e)=>setRoomIcon(e.target.value)} maxLength={4} />
                    <input className="border rounded-md px-3 py-2 w-full" placeholder="Room name" value={roomName} onChange={(e)=>setRoomName(e.target.value)} />
                  </div>
                  <button className="mt-2 px-3 py-2 rounded-md border" onClick={handleCreate} disabled={loading || !roomName.trim()}>Create</button>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <h2 className="font-semibold mb-2">Join a room by ID</h2>
                  <input className="border rounded-md px-3 py-2 w-full" placeholder="Room ID or Short ID" value={joinId} onChange={(e)=>setJoinId(e.target.value)} />
                  <button className="mt-2 px-3 py-2 rounded-md border" onClick={handleJoin} disabled={loading || !joinId.trim()}>Join</button>
                </div>
              </div>
            )}

            {myRooms.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold mb-2">Your rooms</h3>
                <div className="flex gap-2 flex-wrap">
                  {myRooms.map((id) => (
                    <RoomBadge key={id} id={id} onOpen={()=>setCurrentRoomId(id)} onLeave={()=>handleLeave(id)} />
                  ))}
                </div>
              </div>
            )}

            {currentRoomId && (
              <div className="mt-10">
                <RoomHeader roomId={currentRoomId} />
                {loading && <div className="mt-4 text-sm">Loading…</div>}
                {error && <div className="mt-4 text-sm text-destructive">{error}</div>}
                {!loading && !error && (
                  <ol className="mt-4 space-y-2">
                    {leaderboard.map((u, idx) => (
                      <li key={u.uid} className="rounded-xl border bg-card p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold">{idx + 1}</div>
                          <div>
                            <div className="font-medium">{u.displayName || u.email || u.uid}</div>
                            <div className="text-xs text-muted-foreground">Focus: {Math.floor(u.totalFocusSec / 3600)}h {Math.floor((u.totalFocusSec % 3600) / 60)}m</div>
                          </div>
                        </div>
                        <div className="text-sm"><span className="font-semibold">XP:</span> {u.totalXp}</div>
                      </li>
                    ))}
                    {leaderboard.length === 0 && (
                      <li className="text-sm text-muted-foreground">No members yet.</li>
                    )}
                  </ol>
                )}
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

export default Rooms;


