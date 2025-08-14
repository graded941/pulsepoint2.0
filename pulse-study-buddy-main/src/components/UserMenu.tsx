import { useEffect, useState } from "react";
import { auth } from "@/firebase/firebase";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Link } from "react-router-dom";

const UserMenu = () => {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  return (
    <div className="relative">
      <button className="inline-flex items-center gap-2 border rounded-md px-3 py-2 bg-card" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        <span className="w-6 h-6 grid place-items-center rounded-full bg-primary/10">{user?.displayName?.[0] || "😊"}</span>
        <span className="hidden sm:inline text-sm">{user?.displayName || user?.email || "Guest"}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 rounded-lg border bg-card shadow-lg p-2 grid gap-1">
          <Link to="/" className="px-3 py-2 rounded hover:bg-accent/10" role="menuitem">Home</Link>
          <Link to="/leaderboard" className="px-3 py-2 rounded hover:bg-accent/10" role="menuitem">Leaderboard</Link>
          <Link to="/rooms" className="px-3 py-2 rounded hover:bg-accent/10" role="menuitem">Rooms</Link>
          <Link to="/sessions" className="px-3 py-2 rounded hover:bg-accent/10" role="menuitem">My Sessions</Link>
          <div className="h-px bg-border my-1" />
          {user ? (
            <button className="px-3 py-2 rounded hover:bg-accent/10 text-left" onClick={() => signOut(auth)} role="menuitem">Sign out</button>
          ) : (
            <a href="#waitlist" className="px-3 py-2 rounded hover:bg-accent/10" role="menuitem">Sign in</a>
          )}
        </div>
      )}
    </div>
  );
};

export default UserMenu;















