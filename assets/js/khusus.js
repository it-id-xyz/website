import { addDoc, collection, serverTimestamp, query, limit, orderBy, onSnapshot, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { updateOnlineStatus, requireAdmin } from "./role.js";
import { auth, db } from "./firebase.js"; // Pastikan db dan auth diimport

requireAdmin().then(async (user) => {
    // Ambil UID dari objek 'user' hasil resolve requireAdmin
    const uid = user.uid; 

    // 1. Ambil dokumen profil admin
    const userSnap = await getDoc(doc(db, "users", uid));
    let namaAdmin = user.email; // Default pakai email

    if (userSnap.exists()) {
        const userData = userSnap.data();
        namaAdmin = userData.nama || user.email; // Ambil field 'nama' dari DB kamu
        
        const displayLabel = document.getElementById("admin-name");
        if (displayLabel) {
            displayLabel.innerText = `Halo, ${namaAdmin}!`;
        }
    }
    
    // 2. Update status online
    updateOnlineStatus(uid);

    // 3. Tampilkan Log Aktivitas
    const qLogs = query(collection(db, "logs"), orderBy("time", "desc"), limit(10));
    onSnapshot(qLogs, (snap) => {
        const logList = document.getElementById("log-list");
        if(!logList) return;
        logList.innerHTML = "";
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const time = data.time?.toDate().toLocaleString('id-ID') || "...";
            // Sesuaikan field log: adminName dan action
            logList.innerHTML += `<li>[${time}] <b>${data.adminName}</b>: ${data.action} (${data.target})</li>`;
        });
    });

    // 4. Tampilkan Admin Online
    const qOnline = query(collection(db, "users"), orderBy("lastSeen", "desc"));
    onSnapshot(qOnline, (snap) => {
        const onlineList = document.getElementById("online-list");
        if(!onlineList) return;
        onlineList.innerHTML = "";
        snap.forEach(docSnap => {
            const u = docSnap.data();
            const statusColor = u.status === "online" ? "#7aa2ff" : "gray";
            onlineList.innerHTML += `
                <div style="margin-bottom: 5px;">
                    <span style="color: ${statusColor}">●</span> ${u.nama || u.email} 
                    <small>(${u.status || 'offline'})</small>
                </div>`;
        });
    });

    // 5. Fungsi Log Global (Hanya satu fungsi agar rapi)
    async function simpanLog(aksi, target) {
        const ip = await getIP();
        await addDoc(collection(db, "logs"), {
            adminName: namaAdmin, // Pakai variabel namaAdmin yang sudah kita ambil di atas
            email: user.email,
            action: aksi,
            target: target,
            ipAddress: ip,
            time: serverTimestamp()
        });
    }

    // --- EVENT LISTENER (Taruh di dalam .then agar fungsi simpanLog terbaca) ---

    document.addEventListener("click", async (e) => {
        // SAAT POST ARTIKEL
        if (e.target.id === "post-btn") {
            const judul = document.getElementById("judul-input").value;
            // ... kode addDoc artikel kamu di sini ...
            
            await simpanLog("TAMBAH_ARTIKEL", judul);
            alert("Artikel terbit!");
        }

        // SAAT HAPUS ARTIKEL
        if (e.target.classList.contains("delete-btn")) {
            const id = e.target.dataset.id;
            const judulHapus = e.target.closest(".news-card")?.querySelector("h3")?.innerText || id;
            
            // ... kode deleteDoc artikel kamu di sini ...
            
            await simpanLog("HAPUS_ARTIKEL", judulHapus);
        }
    });

}).catch(err => {
    console.error("Akses ditolak:", err);
    window.location.href = "login.html";
});

// Fungsi bantu ambil IP
async function getIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch { return "IP Unknown"; }
}

