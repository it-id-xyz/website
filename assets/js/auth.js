import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault(); // ⛔ STOP RELOAD

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCred = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("LOGIN OK:", userCred.user.uid);
    window.location.href = "index.html";

  } catch (err) {
    alert(err.message);
    console.error(err);
  }
});
