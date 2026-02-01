import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase.js";

const auth = getAuth(app);
const db = getFirestore(app);

// 🔒 FUNCTION UTAMA
export async function requireAdmin() {
  const user = auth.currentUser;
  if (!user) throw new Error("Belum login");

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || snap.data().role !== "admin") {
    throw new Error("Bukan admin");
  }

  return true;
}
