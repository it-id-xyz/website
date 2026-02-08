import { addDoc, collection, serverTimestamp, query, limit, orderBy, onSnapshot, getDoc, doc, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { updateOnlineStatus, requireAdmin } from "./role.js";
import { auth, db } from "./firebase.js"; 
const API_URL = 'https://api.it-smansaci.my.id/api/monitor';

async function refreshDashboard() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Server i3 tidak merespon');
        
        const data = await response.json();
        if (data.groq) {
            const rpdUsed = data.groq.rpd_used;
            const tpdUsed = data.groq.tpd_used;

            document.getElementById('total-posts-ai').innerText = `Req/Day: ${rpdUsed} / 1k`;
            
            const tokenK = (tpdUsed / 1000).toFixed(1);
            document.getElementById('total-tokens-ai').innerText = `Token/Day: ${tokenK}K / 100K`;
    
            const reqBar = document.getElementById('req-bar');
            if (reqBar) {
                const percent = (rpdUsed / 1000) * 100;
                reqBar.style.width = `${percent}%`;
            }
        }

        // Tampilkan List Artikel Firestore
        const containerArtikel = document.getElementById('total-articles');
        if (containerArtikel) {
            containerArtikel.innerHTML = data.latest_articles.map(art => `
                <div class="card-monitor">
                    <p><strong>ID:</strong> ${art.documentId}</p>
                    <p><small>Tgl: ${new Date(art.createdAt).toLocaleString('id-ID')}</small></p>
                    <button id="delete-btn"><i class="fa-regular fa-trash-can"></i> Delete </button>
                </div>
            `).join('');
        }

        // Tampilkan Status Server & Firebase
        const ram = data.server.ram;
        document.getElementById('server-ram').innerText = `${ram} / 2GB`;
        document.getElementById('server-uptime').innerText = data.server.uptime;
        const ramBar = document.getElementById('ram-bar');
        if (ramBar) {
                const percent = (ram / 2000) * 100;
                ramBar.style.width = `${percent}%`;
            }

        // Tampilkan Log GitHub
        const githubMsg = document.getElementById('git-msg');
        const githubAut = document.getElementById('git-author');
        if (githubMsg || githubAut) {
            githubMsg.innerText = `Update terakhir: ${data.github.last_commit}`;
            githubAut.innerText = `Oleh ${data.github.author}`
        } 

        console.log("Monitoring Updated:", new Date().toLocaleTimeString());

    } catch (error) {
        console.error("Dashboard Error:", error);
        document.getElementById('server-status').innerText = "Offline";
        document.getElementById('server-status').style.color = "red";
    }
}

setInterval(refreshDashboard, 30000);
window.onload = refreshDashboard;

requireAdmin().then(async (user) => {
    const uid = user.uid; 

    // Ambil admin
    const userSnap = await getDoc(doc(db, "users", uid));
    let namaAdmin = user.email;

    if (userSnap.exists()) {
        const userData = userSnap.data();
        namaAdmin = userData.nama || user.email;
        
        const displayLabel = document.getElementById("admin-name");
        if (displayLabel) {
            displayLabel.innerText = `Halo, ${namaAdmin}!`;
        }
    }
    updateOnlineStatus(uid);

    // Tampilkan Total Article
    async function getTotal() {
        const article = collection(db,"article");
        const totalArticle = await getCountFromServer(article);
        document.getElementById("total-posts").innerText = `${totalArticle.data().count} Article Terbit`;
    }
    getTotal();

    // Tampilkan Log Aktivitas
    const qLogs = query(collection(db, "logs"), orderBy("time", "desc"), limit(10));
    onSnapshot(qLogs, (snap) => {
        const logList = document.getElementById("log-list");
        if(!logList) return;
        logList.innerHTML = "";
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const time = data.time?.toDate().toLocaleString('id-ID') || "...";
            logList.innerHTML += `<li>[${time}] <b>${data.adminName}</b>: ${data.action} (${data.target})</li>`;
        });
    });

    // Tampilkan Admin Online
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
                    <i class="fa fa-circle" style="color: ${statusColor}"></i> ${u.nama || u.email} 
                    <small>(${u.status || 'offline'})</small>
                </div>`;
        });
    });

    async function simpanLog(aksi, target) {
        const ip = await getIP();
        await addDoc(collection(db, "logs"), {
            adminName: namaAdmin, 
            email: user.email,
            action: aksi,
            target: target,
            ipAddress: ip,
            time: serverTimestamp()
        });
    }


    document.addEventListener("click", async (e) => {
        // POST ARTIKEL
        if (e.target.id === "post-btn") {
            const judul = document.getElementById("judul-input").value;

            await simpanLog("TAMBAH_ARTIKEL", judul);
            alert("Artikel terbit!");
        }

        // HAPUS ARTIKEL
        if (e.target.classList.contains("delete-btn")) {
            const id = e.target.dataset.id;
            const judulHapus = e.target.closest(".news-card")?.querySelector("h3")?.innerText || id;
            
            
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









