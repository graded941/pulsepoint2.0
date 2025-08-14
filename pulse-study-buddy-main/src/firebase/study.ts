import { db } from "@/firebase/firebase";
import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";

export type StudySessionInput = {
  uid: string;
  durationSec: number;
  startedAt?: Date;
  endedAt?: Date;
  xpEarned?: number;
};

export async function ensureUserProfile(
  uid: string,
  profile: { email?: string | null; displayName?: string | null }
): Promise<void> {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      email: profile.email ?? null,
      displayName: profile.displayName ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function saveStudySession(input: StudySessionInput): Promise<string> {
  const { uid, durationSec } = input;
  const xpEarned = input.xpEarned ?? Math.max(0, Math.floor(durationSec / 60));

  const sessionsCol = collection(db, "users", uid, "sessions");
  const sessionDoc = await addDoc(sessionsCol, {
    durationSec,
    xpEarned,
    startedAt: input.startedAt
      ? Timestamp.fromDate(input.startedAt)
      : serverTimestamp(),
    endedAt: input.endedAt
      ? Timestamp.fromDate(input.endedAt)
      : serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      totalFocusSec: increment(durationSec),
      totalXp: increment(xpEarned),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return sessionDoc.id;
}

export async function updateUserProfile(
  uid: string,
  data: { displayName?: string | null; email?: string | null; nickname?: string | null }
): Promise<void> {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      displayName: data.displayName ?? null,
      email: data.email ?? null,
      nickname: data.nickname ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}


