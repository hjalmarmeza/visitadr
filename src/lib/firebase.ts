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
    // ⚡️ SOLUCIÓN REAL: Volvemos al Caché de Disco (pero sin bloqueo de pestañas).
    // ¿Por qué? Porque tu Mac tiene un problema de red al conectar con Google (probablemente 
    // IPv6 timeout o un firewall) que siempre tarda 20 segundos.
    // Usando el caché de disco, el panel carga al instante mientras el timeout ocurre en el fondo.
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({ forceOwnership: false }) })
    });
  } catch (e) {
    db = getFirestore(app);
  }
} else {
  db = getFirestore(app);
}

export { app, db };
