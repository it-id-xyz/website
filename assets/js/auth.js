import { auth, db } from "./firebase.js"; // Pastikan db sudah di-export di firebase.js
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    // 1. Login ke Auth
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    // 2. Ambil data role dari Firestore
    const userDoc = await getDoc(doc(db, "users", uid)); // Asumsi nama collection-nya 'users'

    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // 3. Simpan role ke localStorage
      localStorage.setItem("role", userData.role);
      console.log("Role tersimpan:", userData.role);
    } else {
      console.log("Data user tidak ditemukan di Firestore");
      localStorage.setItem("role", "user");
    }

    window.location.href = "index.html";

  } catch (err) {
    alert("Login Gagal: " + err.message);
    console.error(err);
  }
});





