import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  User as FirebaseUser 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import firebaseConfig from "./firebase-config";

// Initialize Firebase App instance
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
// Use firestoreDatabaseId if configured, or default
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connectivity check test
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase client appears offline. Check connectivity.");
    }
    return false;
  }
}

// Test connection on boot non-blockingly
testFirebaseConnection();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  orderBy,
  serverTimestamp,
  type FirebaseUser
};
