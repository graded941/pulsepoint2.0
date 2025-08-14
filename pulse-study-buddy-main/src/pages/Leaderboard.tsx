import { useEffect, useState } from "react";
import { db } from "@/firebase/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

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
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center justify-between py-4">
          <a href="/" className="inline-flex items-center gap-2" aria-label="PointPulse home">
            <span className="text-xl sm:text-2xl font-bold text-gradient-brand">PointPulse</span>
          </a>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/" className="hover:text-foreground transition-colors">Home</a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-10">
          <div className="container max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-semibold text-primary">Leaderboard</h1>
            <p className="text-muted-foreground mt-1">Top students by XP</p>

            {loading && (
              <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
            )}
            {error && (
              <div className="mt-6 text-sm text-destructive">{error}</div>
            )}

            {!loading && !error && (
              <ol className="mt-6 space-y-2">
                {users.map((u, idx) => (
                  <li
                    key={u.id}
                    className="rounded-xl border bg-card p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium">
                          {u.displayName || u.email || "Anonymous"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Focus: {Math.floor(u.totalFocusSec / 3600)}h {Math.floor((u.totalFocusSec % 3600) / 60)}m
                        </div>
                      </div>
                    </div>
                    <div className="text-sm"><span className="font-semibold">XP:</span> {u.totalXp}</div>
                  </li>
                ))}
                {users.length === 0 && (
                  <li className="text-sm text-muted-foreground">No data yet. Start your first session!</li>
                )}
              </ol>
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


