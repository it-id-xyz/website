import { addDoc, collection, serverTimestamp, query, limit, orderBy, onSnapshot, getDoc, doc, deleteDoc, updateDoc, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { updateOnlineStatus, requireAdmin } from "./role.js";
import { auth, db } from "./firebase.js"; 
const API_URL = 'https://api.it-smansaci.my.id/api/monitor';

requireAdmin().catch(() => {
    window.location.href = "login.html";
});

async function refreshDashboard() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Server Local tidak merespon');
        
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
        // Tampilkan Status Server & Firebase
        const ramRaw = data.server.ram;
        const ram = parseFloat(ramRaw);
        document.getElementById('server-ram').innerText = `${ram}MB / 2048MB`;
        
        const ramBar = document.getElementById('ram-bar');
        if (ramBar) {
                const percent = (ram / 2048) * 100;
                ramBar.style.width = `${percent}%`;
        }
        const secondsRaw = data.server.uptime;
        const seconds = parseFloat(secondsRaw);
        function formatUptime(seconds) {
            const jam = Math.floor(seconds / 3600);
            const menit = Math.floor((seconds % 3600) / 60);
            const detik = Math.floor(seconds % 60);
            const hDisplay = String(jam).padStart(2, '0');
            const mDisplay = String(menit).padStart(2, '0');
            const sDisplay = String(detik).padStart(2, '0');
        
            return `${hDisplay}:${mDisplay}:${sDisplay}`;
        }
        document.getElementById('server-uptime').innerText = formatUptime(seconds);

        // Tampilkan Log GitHub
        const githubMsg = document.getElementById('git-msg');
        const githubAut = document.getElementById('git-author');
        if (githubMsg || githubAut) {
            githubMsg.innerText = `Update terakhir: ${data.github.last_commit}`;
            githubAut.innerText = `Oleh ${data.github.author}`
        } 

    } catch (error) {
        console.error("Dashboard Error:", error);
        document.getElementById('server-status').innerText = "Offline";
        document.getElementById('server-status').style.color = "red";
    }
}

setInterval(refreshDashboard, 5000);
window.onload = refreshDashboard;

async function getIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch { return "IP Unknown"; }
}

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


 // Gabungkan semua listener klik di sini (di dalam requireAdmin)
document.addEventListener("click", async (e) => {
    const ui = {
        form: document.getElementById("form-input"),
        preview: document.getElementById("preview-post")
    };

    // TOMBOL "BUAT ARTIKEL BARU"
    if (e.target.id === "news-update") {
        if (ui.form.innerHTML) return;
        ui.form.innerHTML = `
            <h4>Masukan Judul Article</h4>
            <input id="judul-input" placeholder="Judul">
            <h4>Pilih File Gambar</h4>
            <input type="file" id="foto-input" accept="image/*">
            <textarea id="desk-input" placeholder="Deskripsi"></textarea>
            <button id="cancel-btn">Cancel</button>
            <button id="preview-btn">Preview</button>
        `;
    }

    // TOMBOL PREVIEW
    if (e.target.id === "preview-btn") {
        const judul = document.getElementById("judul-input").value;
        const desk = document.getElementById("desk-input").value;
        const file = document.getElementById("foto-input").files[0];

        if (!judul || !desk || !file) {
            alert("Lengkapi semua data dan pilih foto!");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            ui.preview.innerHTML = `
                <div class="card-monitor">
                    <img src="${event.target.result}" style="max-width:100%; border-radius:8px;">
                    <h3>${judul}</h3>
                    <p>${desk}</p>
                    <button id="post-btn">Konfirmasi Post</button>
                    <button id="clear-btn">Hapus Preview</button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }

    // TOMBOL POST (FIXED)
    if (e.target.id === "post-btn") {
        const judul = document.getElementById("judul-input").value;
        const desk = document.getElementById("desk-input").value;
        const file = document.getElementById("foto-input").files[0];

        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result;
                try {
                    await addDoc(collection(db, "article"), {
                        judul: judul,
                        foto: base64String,
                        desk: desk,
                        createdAt: serverTimestamp()
                    });
                    alert("Artikel berhasil terbit!");
                    await simpanLog("Menambah Artikel", judul);
                    ui.form.innerHTML = "";
                    ui.preview.innerHTML = "";
                } catch (err) {
                    console.error("Gagal post:", err);
                }
            };
            reader.readAsDataURL(file);
        } else {
            alert("Pilih file gambarnya dulu, Bro!");
        }
    }

    // TOMBOL DELETE
    const delBtn = e.target.closest(".delete-btn");
    if (delBtn) {
        const id = delBtn.dataset.id;
        if (confirm("Yakin mau hapus artikel ini?")) {
            try {
                await deleteDoc(doc(db, "article", id));
                await simpanLog("Menghapus Artikel", id);
                alert("Artikel dihapus!");
            } catch (err) {
                alert("Gagal hapus!");
            }
        }
    }

    // TOMBOL CANCEL
    if (e.target.id === "cancel-btn" || e.target.id === "clear-btn") {
        ui.form.innerHTML = "";
        ui.preview.innerHTML = "";
    }
});

const containerArtikel = document.getElementById('total-articles');
if (containerArtikel) {
    onSnapshot(collection(db,"article"), (snap) => {
    containerArtikel.innerHTML = "";            
    snap.forEach((docSnap) => {
        const art = docSnap.data();
        const docId = docSnap.id;
            containerArtikel.innerHTML += `
                <div class="card-monitor">
                    <img src="${art.foto}" style="width:100%; border-radius:8px;">
                    <p><strong>ID:</strong> ${docId}</p>
                    <p>${art.judul}</p>
                    <p><small>Tgl: ${art.createdAt ? art.createdAt.toDate().toLocaleString('id-ID') : 'Memuat...'}</small></p>
                    <button class="delete-btn" data-id="${docId}" style="background:#ff4d4d; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">
                        <i class="fa-regular fa-trash-can"></i> Delete
                    </button>
                </div>`
            });
        });
    }
})

const listAdmin = document.getElementById('user-list');
const btnExport = document.getElementById('btn-export');

// 1. Tampilkan List Pendaftar
onSnapshot(query(collection(db, "regist"), orderBy("createdAt", "desc")), (snap) => {
    listAdmin.innerHTML = "";
    snap.forEach((docSnap) => {
        const u = docSnap.data();
        const id = docSnap.id;
        if (u.status !== 'pending') return;

        listAdmin.innerHTML += `
            <div class="admin-card">
                <p>${u.nama} (${u.wa})</p>
                <button onclick="approveUser('${id}')">Approve</button>
                <button onclick="denyUser('${id}')">Deny</button>
            </div>`;
    });
});

// 2. Fungsi Approve
window.approveUser = async (id) => {
    if (confirm("Terima anggota?")) {
        await updateDoc(doc(db, "regist", id), { status: 'approved' });
    }
};

// 3. Fungsi Deny (Dengan Alasan)
window.denyUser = async (id) => {
    const alasan = prompt("Alasan penolakan:");
    if (alasan) {
        await updateDoc(doc(db, "regist", id), { 
            status: 'rejected', 
            pesanAdmin: alasan 
        });
    }
};

// 4. Fungsi Export Excel
btnExport.onclick = async () => {
    const snap = await getDocs(collection(db, "regist"));
    const data = snap.docs.map(d => ({
        Nama: d.data().nama,
        Status: d.data().status,
        WA: d.data().wa,
        Alasan: d.data().pesanAdmin
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "Pendaftar_IT.xlsx");
};

function getLogs() {
    const logRef = collection(db, 'logs');
    const q = query(logRef, orderBy('time', 'desc'), limit(10));
    
    onSnapshot(q, (snapshot) => {
        const tableBody = document.getElementBydId('logs-list-body');

        let html = ''

        snapshot.forEach((doc) => {
            const log = doc.data();
            const waktu = log.waktu ? log.waktu.toDate().toLocaleString(id-ID) : '-';
            const aksiColor = log.aksi.toLowerCase().includes('hapus') ? 'color: #ff4d4d;' : log.aksi.toLowerCase().includes('tambah') ? 'color: 2ecc71;' : '';

            html += `
                <tr>
                    <td><small>${waktu}</small></td>
                    <td><strong>${log.admin}</strong></td>
                    <td style="${aksiColor} font-weight: bold;">${log.aksi}</td>
                    <td>${log.detail}</td>
                    <td><code style="background: #333; padding: 2px 5px; border-radius: 4px;">${log.ipAddress}</code></td>
                </tr>`;
        });
        tableBody.innerHTML = html;
    });
}
getLogs();

