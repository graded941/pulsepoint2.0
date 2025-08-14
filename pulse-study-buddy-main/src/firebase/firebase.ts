import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, type Analytics } from "firebase/analytics";

// Firebase config provided by user
const firebaseConfig = {
  apiKey: "AIzaSyDlcVfYbgLvodGnlLMqOMaNiTBFq6cJvrA",
  authDomain: "pulsepoint-1890a.firebaseapp.com",
  projectId: "pulsepoint-1890a",
  storageBucket: "pulsepoint-1890a.firebasestorage.app",
  messagingSenderId: "923683961639",
  appId: "1:923683961639:web:89f0d1cf9fe87db64f8702",
  measurementId: "G-NLGHPTV801",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

let analytics: Analytics | undefined;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch {
    // No-op if analytics is not supported in the current environment
  }
}

export { analytics };


