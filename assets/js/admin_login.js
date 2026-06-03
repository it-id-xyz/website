import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
        import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
        
        const firebaseConfig = {
          apiKey: "AIzaSyB3dKn8hKBsAvEF8ePBI5FGNiZFFOgyAyY",
          authDomain: "website-it-31f31.firebaseapp.com",
          databaseURL: "https://website-it-31f31-default-rtdb.asia-southeast1.firebasedatabase.app",
          projectId: "website-it-31f31",
          storageBucket: "website-it-31f31.firebasestorage.app",
          messagingSenderId: "168247505754",
          appId: "1:168247505754:web:0c1a33987e88a718777963",
          measurementId: "G-E3W9FZ9LTN"
        };
        
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();

        const btn = document.getElementById("btn-login-admin-gg");
        const status = document.getElementById("admin-status");

        btn.addEventListener("click", async () => {
            btn.textContent = "Loading...";
            try {
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                
                // Set token validasi admin
                localStorage.setItem("adminToken", user.accessToken);
                localStorage.setItem("adminEmail", user.email);
                
                status.style.color = "#10b981";
                status.innerText = "Berhasil! Mengalihkan ke Admin...";
                
                setTimeout(() => {
                    window.location.href = "admin.html";
                }, 1000);
            } catch (err) {
                status.style.color = "#ef4444";
                status.innerText = "Gagal login: " + err.message;
                btn.innerHTML = '<i class="fab fa-google"></i> Login with Google';
            }
        });
