import { db } from "@/firebase/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

export interface RoomMemberWithStats {
  uid: string;
  displayName: string;
  photoURL?: string;
  totalPoints: number;
  totalSessions: number;
  lastActive: Date;
}

export interface Room {
  id: string;
  name: string;
  icon: string;
  shortId: string;
  createdAt: Date;
  createdBy: string;
}

export async function createRoom(
  userId: string,
  name: string,
  icon: string
): Promise<{ roomId: string; shortId: string }> {
  const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const roomRef = await addDoc(collection(db, "rooms"), {
    name,
    icon,
    shortId,
    createdAt: new Date(),
    createdBy: userId,
  });

  // Add creator as first member
  await addDoc(collection(db, "rooms", roomRef.id, "members"), {
    uid: userId,
    joinedAt: new Date(),
  });

  return { roomId: roomRef.id, shortId };
}

export async function joinRoom(userId: string, roomId: string): Promise<void> {
  const memberRef = doc(db, "rooms", roomId, "members", userId);
  const memberDoc = await getDoc(memberRef);
  
  if (!memberDoc.exists()) {
    await addDoc(collection(db, "rooms", roomId, "members"), {
      uid: userId,
      joinedAt: new Date(),
    });
  }
}

export async function leaveRoom(userId: string, roomId: string): Promise<void> {
  const memberRef = doc(db, "rooms", roomId, "members", userId);
  await deleteDoc(memberRef);
}

export async function listUserRooms(userId: string): Promise<{ roomId: string; name: string; icon: string }[]> {
  const membersQuery = query(
    collection(db, "rooms"),
    where("members", "array-contains", userId)
  );
  
  const snapshot = await getDocs(membersQuery);
  return snapshot.docs.map(doc => ({
    roomId: doc.id,
    name: doc.data().name,
    icon: doc.data().icon,
  }));
}

export async function resolveRoomIdByShortId(shortId: string): Promise<string | null> {
  const roomsQuery = query(
    collection(db, "rooms"),
    where("shortId", "==", shortId),
    limit(1)
  );
  
  const snapshot = await getDocs(roomsQuery);
  if (snapshot.empty) return null;
  
  return snapshot.docs[0].id;
}

export async function updateRoomMetadata(
  roomId: string,
  updates: { name?: string; icon?: string }
): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, updates);
}

export async function getRoomLeaderboard(roomId: string): Promise<RoomMemberWithStats[]> {
  // Get all members of the room
  const membersQuery = query(collection(db, "rooms", roomId, "members"));
  const membersSnapshot = await getDocs(membersQuery);
  
  const memberStats: RoomMemberWithStats[] = [];
  
  for (const memberDoc of membersSnapshot.docs) {
    const memberData = memberDoc.data();
    const userId = memberData.uid;
    
    // Get user profile
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    // Get user's study sessions
    const sessionsQuery = query(
      collection(db, "users", userId, "sessions"),
      orderBy("startTime", "desc")
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    
    let totalPoints = 0;
    let totalSessions = 0;
    let lastActive = new Date(0);
    
    sessionsSnapshot.docs.forEach(sessionDoc => {
      const sessionData = sessionDoc.data();
      totalPoints += sessionData.points || 0;
      totalSessions++;
      const sessionDate = sessionData.startTime?.toDate?.() || new Date(sessionData.startTime);
      if (sessionDate > lastActive) {
        lastActive = sessionDate;
      }
    });
    
    memberStats.push({
      uid: userId,
      displayName: userData?.displayName || "Anonymous",
      photoURL: userData?.photoURL,
      totalPoints,
      totalSessions,
      lastActive,
    });
  }
  
  // Sort by total points descending
  return memberStats.sort((a, b) => b.totalPoints - a.totalPoints);
}
