import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
        
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

async function generateJWT(payload, secret) {
    const header = {
        alg: "HS256",
        typ: "JWT"
    };

    const base64UrlEncode = (str) => {
        const bytes = new TextEncoder().encode(str);
        let binString = "";
        for (let i = 0; i < bytes.length; i++) {
            binString += String.fromCharCode(bytes[i]);
        }
        return btoa(binString)
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    };

    const headerStr = base64UrlEncode(JSON.stringify(header));
    const payloadStr = base64UrlEncode(JSON.stringify(payload));
    const tokenInput = `${headerStr}.${payloadStr}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const data = encoder.encode(tokenInput);

    const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await window.crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        data
    );

    const signatureBytes = new Uint8Array(signature);
    let signatureBin = "";
    for (let i = 0; i < signatureBytes.length; i++) {
        signatureBin += String.fromCharCode(signatureBytes[i]);
    }
    const signatureStr = btoa(signatureBin)
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${tokenInput}.${signatureStr}`;
}

btn.addEventListener("click", async () => {
    btn.textContent = "Loading...";
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
                
        // Cek role admin di Firestore
        const db = getFirestore(app);
        const userDoc = await getDoc(doc(db, "users", user.uid));
                
        if (!userDoc.exists() || userDoc.data().role !== "admin") {
            await signOut(auth);
            throw new Error("Akun Google lu tidak terdaftar sebagai Admin!");
        }
                
        const adminData = userDoc.data();
                
        // Generate custom JWT signed with the secret key
        const customJwt = await generateJWT({
            uid: user.uid,
            role: "admin",
            nama: adminData.nama || user.displayName || user.email
        }, "secret-it-smansaci_3405");
                
        // Set token validasi admin
        localStorage.setItem("admin_token", customJwt);
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
