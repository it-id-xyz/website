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

// Tambahkan async di sini agar await bisa jalan
export async function updateOnlineStatus(uid) {
  const userRef = doc(db, "users", uid);
  
  try {
    await updateDoc(userRef, {
      status: "online",
      lastSeen: serverTimestamp()
    });
    
    // Gunakan event listener untuk deteksi saat tab ditutup
    window.addEventListener("beforeunload", async () => {
      // Kita tidak pakai await di sini karena tab keburu tertutup
      updateDoc(userRef, { status: "offline" });
    });
    
    console.log("Status online berhasil diperbarui");
  } catch (err) {
    console.error("Gagal update status: ", err);
  }
}
