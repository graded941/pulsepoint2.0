import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "@/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { resolveRoomIdByShortId, joinRoom } from "@/firebase/rooms";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";

const Invite = () => {
  const { shortId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("Resolving invite…");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ name?: string; icon?: string; members?: number } | null>(null);

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
    if (!u) { navigate(`/rooms?join=${shortId}`); return; }
    try { await joinRoom(u.uid, roomId); } catch (error) {
      console.error('Error joining room:', error);
    }
    navigate(`/rooms?open=${roomId}`);
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      {status && <div className="text-sm text-muted-foreground">{status}</div>}
      {!status && (
        <div className="max-w-md w-full rounded-2xl border bg-card p-6 text-center shadow-sm">
          <div className="text-4xl" aria-hidden>{meta?.icon ?? "📚"}</div>
          <h1 className="mt-2 text-xl font-semibold">Join room</h1>
          <p className="text-sm text-muted-foreground mt-1">{meta?.name ?? shortId}</p>
          {typeof meta?.members === "number" && (
            <div className="mt-1 text-xs text-muted-foreground">Members: {meta.members}</div>
          )}
          <button className="mt-4 px-4 py-2 rounded-md border bg-primary text-primary-foreground" onClick={onJoin}>Join</button>
          <div className="mt-2 text-xs text-muted-foreground">You may be asked to sign in.</div>
        </div>
      )}
    </div>
  );
};

export default Invite;


