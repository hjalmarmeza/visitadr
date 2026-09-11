import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAe7WuNO19-aN8ryQoHMPBhvhI-fqOLrag",
  authDomain: "mi-visita-al-doctor.firebaseapp.com",
  projectId: "mi-visita-al-doctor",
  storageBucket: "mi-visita-al-doctor.firebasestorage.app",
  messagingSenderId: "300207714684",
  appId: "1:300207714684:web:2b99c270bb3a048fe274f9",
  measurementId: "G-P2XB0F537H"
};

// Singleton pattern para Next.js (evita inicializar multiples veces)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let db: any;

if (typeof window !== 'undefined') {
  // ⚡️ PASO 3: Activamos el Modo "Sin Conexión"
  // Envolvemos en try/catch porque el Fast Refresh de Next.js en desarrollo 
  // intenta ejecutar este archivo varias veces y Firebase lanza error y pantalla blanca.
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (e: any) {
    // Si ya estaba inicializado, simplemente lo llamamos
    db = getFirestore(app);
  }
} else {
  // Server-side
  db = getFirestore(app);
}

export { app, db };
