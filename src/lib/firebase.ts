/**
 * Configuración de Firebase (pública por diseño).
 *
 * La tienda accede a Firestore mediante su API REST (ver src/lib/store.ts),
 * no con el SDK de tiempo real: la REST usa fetch/HTTPS normal con CORS, por
 * lo que funciona de forma fiable en cualquier navegador, red o proxy —a
 * diferencia del canal WebChannel del SDK, que se cuelga en redes
 * restrictivas. Por eso aquí solo exponemos los identificadores.
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyACC84cNCP09Qb45Fkn5YNFKKP3xBskk6I",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "novastore-c5457.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "novastore-c5457",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "novastore-c5457.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "262230357419",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:262230357419:web:dcdb2065c2ebb2f9940eee",
};

/** True cuando hay credenciales; si no, la app opera en modo demo. */
export const firebaseConfigurado = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
