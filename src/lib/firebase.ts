import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True cuando hay credenciales de Firebase; si no, la app opera en modo demo. */
export const firebaseConfigurado = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function obtenerDb(): Firestore {
  if (!firebaseConfigurado) {
    throw new Error("Firebase no está configurado. Define las variables NEXT_PUBLIC_FIREBASE_*.");
  }
  if (!db) {
    app = getApps()[0] ?? initializeApp(config);
    db = getFirestore(app);
  }
  return db;
}
