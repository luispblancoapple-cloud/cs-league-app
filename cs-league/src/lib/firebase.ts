// Firebase is OPTIONAL. If you don't fill in firebaseConfig below, the app
// still works perfectly using your browser's local storage — it just won't
// sync across devices/browsers.
//
// To enable cloud sync (recommended if you study from more than one device):
//   1. Create a free project at https://console.firebase.google.com
//   2. Add a Web App, copy the config object it gives you into firebaseConfig below.
//   3. Enable "Firestore Database" in the Firebase console (start in test mode,
//      or use the security rules from README.md).
//   4. Rebuild/redeploy. That's it — no login needed, this is a single-user app.

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDixyRq_t4VU2li8PYYC-15BWV7qMijzkk",
  authDomain: "cs-league-app.firebaseapp.com",
  projectId: "cs-league-app",
  storageBucket: "cs-league-app.firebasestorage.app",
  messagingSenderId: "800507757719",
  appId: "1:800507757719:web:95b719cc02969af2df55d2",
  measurementId: "G-PNT8Z9XNDJ"
};

const isConfigured = Object.keys(firebaseConfig).length > 0 && 'apiKey' in firebaseConfig;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig as any);
    db = getFirestore(app);
  } catch (e) {
    console.warn('Firebase init failed, falling back to local storage only.', e);
  }
}

export const firebaseEnabled = !!db;

const DOC_PATH = ['progress', 'main'] as const;

export async function loadRemoteState(): Promise<any | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, ...DOC_PATH));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn('Failed to load remote state', e);
    return null;
  }
}

export async function saveRemoteState(state: any): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, ...DOC_PATH), state);
  } catch (e) {
    console.warn('Failed to save remote state', e);
  }
}
