import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

// Configuración web de Firebase (pública por diseño); sobreescribible por env.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyACC84cNCP09Qb45Fkn5YNFKKP3xBskk6I",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "novastore-c5457.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "novastore-c5457",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "novastore-c5457.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "262230357419",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:262230357419:web:dcdb2065c2ebb2f9940eee",
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
