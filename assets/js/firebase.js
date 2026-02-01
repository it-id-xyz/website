import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3dKn8hKBsAvEF8ePBI5FGNiZFFOgyAyY",
  authDomain: "website-it-31f31.firebaseapp.com",
  projectId: "website-it-31f31",
  storageBucket: "website-it-31f31.firebasestorage.app",
  messagingSenderId: "168247505754",
  appId: "1:168247505754:web:0c1a33987e88a718777963"
};
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
