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

let app;
let db: any;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    // ⚡️ Habilitar persistencia offline SOLO si es la primera vez que se carga
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } else {
    db = getFirestore(app);
  }
} else {
  // Si Next.js recarga el componente (Fast Refresh), usamos la instancia existente
  app = getApp();
  db = getFirestore(app);
}

export { app, db };
