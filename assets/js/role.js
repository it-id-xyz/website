import { getAuth, onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase.js";
import { updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

export function requireAdmin() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); // ⬅️ WAJIB

      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists() || snap.data().role !== "admin") {
        reject(new Error("Bukan admin"));
        return;
      }

      resolve(user);
    });
  });
}

async function updateOnlineStatus(uid) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    status: "online",
    lastSeen: serverTimestamp()
  });
  
  window.addEventListener("beforeunload", () => {
    updateDoc(userRef, { status: "offline" });
  });
}
