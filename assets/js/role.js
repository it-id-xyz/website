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
      unsubscribe(); 

      if (!user) {
        reject(new Error("Belum login"));
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().role === "admin") {
          resolve(user);
        } else {
          reject(new Error("Bukan admin"));
        }
      } catch (err) {
        reject(err);
      }
    });
  });
}

export async function updateOnlineStatus(uid) {
  const userRef = doc(db, "users", uid);
  
  try {
    await updateDoc(userRef, {
      status: "online",
      lastSeen: serverTimestamp()
    });

    const setOffline = () => {
      updateDoc(userRef, { status: "offline", lastSeen: serverTimestamp() });
    };

    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        setOffline();
      } else {
        updateDoc(userRef, { status: "online", lastSeen: serverTimestamp() });
      }
    });
    window.addEventListener("beforeunload", setOffline);

    console.log("Status online diperbarui");
  } catch (err) {
    console.error("Gagal update status: ", err);
  }
}

export async function setAdminOffline(uid) {
  const userRef = doc(db, "users", uid);
  try {
    await updateDoc(userRef, { status: "offline", lastSeen: serverTimestamp() });
  } catch (err) {
    console.error("Gagal set offline: ", err);
  }
}
