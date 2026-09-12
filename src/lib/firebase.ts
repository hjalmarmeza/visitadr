import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";

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
  // Usamos memoryLocalCache para evitar por completo el bloqueo de IndexedDB en Safari
  db = initializeFirestore(app, {
    localCache: memoryLocalCache()
  });
} else {
  db = getFirestore(app);
}

export { app, db };
