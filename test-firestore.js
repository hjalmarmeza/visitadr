const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, onSnapshot } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyAe7WuNO19-aN8ryQoHMPBhvhI-fqOLrag",
  authDomain: "mi-visita-al-doctor.firebaseapp.com",
  projectId: "mi-visita-al-doctor",
  storageBucket: "mi-visita-al-doctor.firebasestorage.app",
  messagingSenderId: "300207714684",
  appId: "1:300207714684:web:2b99c270bb3a048fe274f9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.time("🔥 Firestore getDocs time");
getDocs(collection(db, "citas")).then(snap => {
  console.timeEnd("🔥 Firestore getDocs time");
  console.log(`✅ Got ${snap.docs.length} docs`);
  process.exit(0);
}).catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
