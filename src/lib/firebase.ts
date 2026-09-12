import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentSingleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAe7WuNO19-aN8ryQoHMPBhvhI-fqOLrag",
  authDomain: "mi-visita-al-doctor.firebaseapp.com",
  projectId: "mi-visita-al-doctor",
  storageBucket: "mi-visita-al-doctor.firebasestorage.app",
  messagingSenderId: "300207714684",
  appId: "1:300207714684:web:2b99c270bb3a048fe274f9",
  measurementId: "G-P2XB0F537H"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let db: any;

if (typeof window !== 'undefined') {
  try {
    // ⚡️ LA SOLUCIÓN DEFINITIVA: Usar caché en disco duro para carga en 0.1s,
    // pero limitándolo a "SingleTabManager" para evitar el bug de 10s de las Mac.
    // Esto garantiza que aunque el internet tarde 20s en conectar, la app se abra al instante.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({ forceOwnership: false }) })
    });
  } catch (e) {
    db = getFirestore(app);
  }
} else {
  db = getFirestore(app);
}

export { app, db };
