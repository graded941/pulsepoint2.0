import { useEffect, useState } from "react";
import { auth, googleProvider } from "@/firebase/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { ensureUserProfile, updateUserProfile } from "@/firebase/study";

const inputBase = "border rounded-md px-3 py-2 w-full";
const btn = "px-3 py-2 rounded-md border";

const AuthPanel = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setUser(u);
    if (u) {
      setDisplayName(u.displayName || "");
      await ensureUserProfile(u.uid, { email: u.email, displayName: u.displayName });
    }
  }), []);

  const doSignIn = async () => {
    setLoading(true); setMessage(null);
    try { await signInWithEmailAndPassword(auth, email, password); } catch (e: any) { setMessage(e.message || "Sign in failed"); }
    finally { setLoading(false); }
  };
  const doRegister = async () => {
    setLoading(true); setMessage(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
        await updateUserProfile(cred.user.uid, { displayName, email: cred.user.email });
      }
    } catch (e: any) { setMessage(e.message || "Sign up failed"); }
    finally { setLoading(false); }
  };
  const doReset = async () => {
    setLoading(true); setMessage(null);
    try { await sendPasswordResetEmail(auth, email); setMessage("Password reset email sent"); } catch (e: any) { setMessage(e.message || "Reset failed"); }
    finally { setLoading(false); }
  };
  const doGoogle = async () => {
    setLoading(true); setMessage(null);
    try { await signInWithPopup(auth, googleProvider); } catch (e: any) { setMessage(e.message || "Google sign-in failed"); }
    finally { setLoading(false); }
  };
  const doSignOut = async () => { await signOut(auth); };

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true); setMessage(null);
    try {
      if (user.displayName !== displayName) {
        await updateProfile(user, { displayName });
      }
      await updateUserProfile(user.uid, { displayName, email: user.email, nickname });
      setMessage("Profile saved");
    } catch (e: any) { setMessage(e.message || "Profile save failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto border rounded-xl p-4 bg-card">
      <h2 className="text-lg font-semibold mb-2">Account</h2>

      {user ? (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Signed in as {user.email}</div>
          <div className="space-y-2">
            <label className="block text-sm">Display name</label>
            <input className={inputBase} value={displayName} onChange={(e)=>setDisplayName(e.target.value)} placeholder="Your name" />
            <label className="block text-sm">Nickname (shown on leaderboards)</label>
            <input className={inputBase} value={nickname} onChange={(e)=>setNickname(e.target.value)} placeholder="Nickname" />
            <button className={btn} onClick={saveProfile} disabled={loading}>Save Profile</button>
          </div>
          <button className={btn} onClick={doSignOut}>Sign out</button>
        </div>
      ) : (
        <div className="space-y-3">
          <input className={inputBase} type="email" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className={inputBase} type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <div className="flex gap-2 flex-wrap">
            <button className={btn} onClick={doSignIn} disabled={loading}>Sign in</button>
            <button className={btn} onClick={doRegister} disabled={loading}>Create account</button>
            <button className={btn} onClick={doReset} disabled={loading}>Reset password</button>
            <button className={btn} onClick={doGoogle} disabled={loading}>Google</button>
          </div>
        </div>
      )}

      {message && <div className="mt-3 text-sm">{message}</div>}
    </div>
  );
};

export default AuthPanel;


