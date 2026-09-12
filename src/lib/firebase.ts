import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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

// ⚡️ Usamos el motor por defecto. La persistencia en disco duro (IndexedDB) 
// causaba un bloqueo de 10 segundos en Mac por conflicto entre pestañas.
// La memoria caché normal sigue funcionando perfectamente para cortes de señal breves.
const db = getFirestore(app);

export { app, db };
