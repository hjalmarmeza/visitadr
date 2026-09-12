import { initializeApp } from 'firebase/app'; import { initializeFirestore } from 'firebase/firestore'; initializeFirestore(initializeApp({}), { experimentalForceLongPolling: true });
