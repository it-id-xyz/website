import { addDoc, collection, serverTimestamp, Timestamp, query, limit, orderBy, onSnapshot, getDoc, doc, deleteDoc, updateDoc, getCountFromServer} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { updateOnlineStatus, requireAdmin } from "./role.js";
import { auth, db } from "./firebase.js"; 
import { CONFIG } from "./config.js";
const API_URL = 'https://api.it-smansaci.my.id/api/monitor';

requireAdmin().catch(() => {
    window.location.href = "admin_login.html";
});

async function refreshDashboard() {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('admin_token');
            window.location.href = "admin_login.html"; 
            return;
        }
        if (!response.ok) throw new Error('Server Local tidak merespon');
        
        const data = await response.json();
        if (data.groq) {
            const rpdUsed = data.groq.rpd_used;
            const tpdUsed = data.groq.tpd_used;

            document.getElementById('total-posts-ai').innerText = `Req/Day: ${rpdUsed} / 3k`;
            
            const tokenK = (tpdUsed / 500000).toFixed(1);
            document.getElementById('total-tokens-ai').innerText = `Token/Day: ${tokenK}K / 500K`;
    
            const reqBar = document.getElementById('req-bar');
            if (reqBar) {
                const rawPercent = (rpdUsed / 3000) * 100;
                const percent = rawPercent.toFixed(2);
                reqBar.style.width = `${percent}%`;
                const reqText = document.getElementById('req-text').innerText = `Usage: ${percent}%`
            }
            const tokenBar = document.getElementById('token-bar');
            if (tokenBar) {
                const rawPercent = (tpdUsed / 500000) * 100;
                const percent = rawPercent.toFixed(2);
                tokenBar.style.width = `${percent}%`;
                const tokenText = document.getElementById('token-text').innerText = `Usage: ${percent}%`
            }
        // Tampilkan Status Server & Firebase
        const cpuLoad = data.hardware.cpu.load;
        const cpuTemp = data.hardware.cpu.temp;
        const cpuAvg = data.hardware.cpu.loadAvg;
        document.getElementById('cpu-load-text').innerText = `Usage: ${cpuLoad}`;
        document.getElementById('cpu-temp').innerText = cpuTemp;
        document.getElementById('load-avg').innerText = cpuAvg;

        const cpuBar = document.getElementById('cpu-usage-bar');
        if (cpuBar) {
            cpuBar.style.width = cpuLoad;
        }

        const ramRaw = data.server.process_ram || 0;
        const ramUsed = data.hardware.memory.used || 0;
        const ramTotal = data.hardware.memory.total || 0;
        const ramSwap = data.hardware.memory.swap || 0;
        document.getElementById('ram-used').innerText = `${ramUsed} / ${ramTotal}`;
        document.getElementById('swap-used').innerText = ramSwap;
        const used = parseFloat(ramUsed);
        const total = parseFloat(ramTotal);
        const swap = parseFloat(ramSwap);
        const ram = parseFloat(ramRaw);
        document.getElementById('server-ram').innerText = `${ram} MB / ${ramTotal}`;
        
        const ramBar = document.getElementById('ram-bar');
        if (ramBar) {
            const rawPercent = (ram / 3680) * 100;
            const percent = rawPercent.toFixed(2);
            ramBar.style.width = `${percent}%`;
            const usedText = document.getElementById('used-text').innerText = `Usage: ${percent}%`
        }
        const usageBar = document.getElementById('ram-usage');
        if (usageBar) {
            const rawPercent = (used / total) * 100;
            const percent = rawPercent.toFixed(2);
            usageBar.style.width = `${percent}%`;
            const usageText = document.getElementById('usage-text').innerText = `Usage: ${percent}%`
        }
        const swapBar = document.getElementById('swap-bar');
        if (swapBar) {
            const rawPercent = (swap / 500) * 100;
            const percent = rawPercent.toFixed(2);
            swapBar.style.width = `${percent}%`;
            const swapText = document.getElementById('swap-text').innerText = `Usage: ${percent}%`
        }

        const storageBar = document.getElementById('storage-bar');
        const diskPercent = data.hardware.storage.used_percent;
        const diskFree = data.hardware.storage.free;
        document.getElementById('storage-used').innerText = diskPercent;
        document.getElementById('storage-free').innerText = `Free: ${diskFree}`;
        if (storageBar) {
            storageBar.style.width = diskPercent;
        }

        const powerData = data.hardware.power;
        let powerStatusLabel;
        let statusColor;

        if (powerData.is_bypass) {
            powerStatusLabel = "Bypass (Direct AC)";
            statusColor = "text-blue-500";
        } else {
            powerStatusLabel = powerData.is_charging ? "🔌 Charging" : "🔋 On Battery";
            statusColor = powerData.is_charging ? "text-green-500" : "text-yellow-500";
        }
        document.getElementById('power-status-label').innerText = powerStatusLabel;
        document.getElementById('power-status-label').className = statusColor;

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

    }
    } catch (error) {
        console.error("Dashboard Error:", error);
        document.getElementById('server-status').innerText = "Server Offline";
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

    const docRef = doc(db, "users", uid);
    const userSnap = await getDoc(docRef); 
    
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

    async function getTotal() {
        const article = collection(db,"article");
        const totalArticle = await getCountFromServer(article);
        document.getElementById("total-posts").innerText = `${totalArticle.data().count} Article Terbit`;
    }
    getTotal();

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
    const ui = {
        form: document.getElementById("form-input"),
        preview: document.getElementById("preview-post")
    };

    if (e.target.id === "news-update") {
        if (ui.form.innerHTML) return;
        const now = new Date();
        const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        ui.form.innerHTML = `
            <div class="news-form-wrapper">
                <label>Judul Artikel</label>
                <input type="text" id="judul-input" placeholder="Masukkan judul artikel...">
                <label>Tanggal Publikasi</label>
                <input type="datetime-local" id="tanggal-input" value="${localISO}">
                <label>Gambar Artikel</label>
                <input type="file" id="foto-input" accept="image/*">
                <div class="upload-progress" id="upload-progress">
                    <div class="upload-progress-bar-bg">
                        <div class="upload-progress-bar" id="upload-bar"></div>
                    </div>
                    <small id="upload-status" style="color: var(--text-muted);">Mengupload gambar ke cloud...</small>
                </div>
                <label>Deskripsi</label>
                <textarea id="desk-input" placeholder="Tulis deskripsi artikel..."></textarea>
                <div class="news-form-actions">
                    <button class="btn-preview-news" id="preview-btn"><i class="fa fa-eye"></i> Preview</button>
                    <button class="btn-cancel-news" id="cancel-btn"><i class="fa fa-times"></i> Batal</button>
                </div>
            </div>
        `;
    }

    // TOMBOL PREVIEW
    if (e.target.id === "preview-btn") {
        const judul = document.getElementById("judul-input").value;
        const desk = document.getElementById("desk-input").value;
        const file = document.getElementById("foto-input").files[0];
        const tanggal = document.getElementById("tanggal-input").value;

        if (!judul || !desk || !file) {
            alert("Lengkapi semua data dan pilih foto!");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const tglDisplay = tanggal
                ? new Date(tanggal).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
                : new Date().toLocaleString('id-ID');
            ui.preview.innerHTML = `
                <div class="news-preview-card">
                    <span class="news-preview-label"><i class="fa fa-eye"></i> Preview Artikel</span>
                    <img src="${event.target.result}" alt="preview">
                    <h3>${judul}</h3>
                    <p class="preview-date"><i class="fa fa-calendar"></i> ${tglDisplay}</p>
                    <p>${desk}</p>
                    <div class="news-form-actions" style="margin-top: 16px;">
                        <button id="post-btn" class="btn-preview-news"><i class="fa fa-paper-plane"></i> Konfirmasi & Post</button>
                        <button id="clear-btn" class="btn-cancel-news"><i class="fa fa-trash"></i> Hapus Preview</button>
                    </div>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }

    // TOMBOL POST — Upload ke Cloudinary dulu, baru simpan URL ke Firestore
    if (e.target.id === "post-btn") {
        const judul = document.getElementById("judul-input")?.value;
        const desk = document.getElementById("desk-input")?.value;
        const file = document.getElementById("foto-input")?.files[0];
        const tanggal = document.getElementById("tanggal-input")?.value;

        if (!file) {
            alert("Pilih file gambarnya dulu, Bro!");
            return;
        }

        const postBtn = document.getElementById("post-btn");
        const progressDiv = document.getElementById("upload-progress");
        const uploadBar = document.getElementById("upload-bar");
        const uploadStatus = document.getElementById("upload-status");

        if (postBtn) { postBtn.disabled = true; postBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Uploading...'; }
        if (progressDiv) progressDiv.style.display = "block";

        try {
            // 1. Upload gambar ke Cloudinary (unsigned upload)
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", CONFIG.CLOUDINARY_PRESET);

            const cloudRes = await fetch(
                `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_NAME}/image/upload`,
                { method: "POST", body: formData }
            );

            if (!cloudRes.ok) {
                const errData = await cloudRes.json().catch(() => ({}));
                throw new Error(errData.error?.message || "Gagal upload ke Cloudinary (" + cloudRes.status + ")");
            }

            const cloudData = await cloudRes.json();
            const imageUrl = cloudData.secure_url;

            if (uploadBar) uploadBar.style.width = "100%";
            if (uploadStatus) uploadStatus.innerText = "Upload selesai, menyimpan artikel...";

            // 2. Simpan ke Firestore dengan URL Cloudinary + tanggal custom
            const pubDate = tanggal ? Timestamp.fromDate(new Date(tanggal)) : serverTimestamp();
            await addDoc(collection(db, "article"), {
                judul,
                foto: imageUrl,
                desk,
                createdAt: pubDate
            });

            alert("Artikel berhasil terbit!");
            await simpanLog("Menambah Artikel", judul);
            ui.form.innerHTML = "";
            ui.preview.innerHTML = "";
        } catch (err) {
            console.error("Gagal post:", err);
            alert("Gagal post artikel: " + err.message);
            if (postBtn) { postBtn.disabled = false; postBtn.innerHTML = '<i class="fa fa-paper-plane"></i> Konfirmasi & Post'; }
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

onSnapshot(query(collection(db, "regist"), orderBy("createdAt", "desc")), (snap) => {
    listAdmin.innerHTML = "";
    snap.forEach((docSnap) => {
        const u = docSnap.data();
        const id = docSnap.id;
        if (u.status !== 'pending') return;

        listAdmin.innerHTML += `
            <div class="admin-card">
                <p>Nama: <strong>${u.nama}</strong></p>
                <p>Nomer: ${u.whatsapp}<p>
                <small>Status: ${u.verified}</small>
                <input id="reason" placeholder="isi jika di tolak">
                <button onclick="approveUser('${id}')">Approve</button>
                <button onclick="denyUser('${id}')">Deny</button>
            </div>`;
    });
});

// Approve
window.approveUser = async (id) => {
    if (confirm("Terima anggota?")) {
        await updateDoc(doc(db, "regist", id), { status: 'approved' });
    }
};

// Deny
window.denyUser = async (id) => {
    const alasan = document.getElementById('reason').value;
    if (alasan) {
        await updateDoc(doc(db, "regist", id), { 
            status: 'rejected', 
            pesanAdmin: alasan 
        });
    }
};

// Export Excel
btnExport.onclick = async () => {
    try {
        const snap = await getDocs(collection(db, "regist"));
        const data = snap.docs.map(d => ({
            Nama: d.data().nama,
            Kelas: d.data().kelas,
            Status: d.data().status,
            WA: d.data().whatsapp,
            email: d.data().email,
            Bidang: d.data().bidang,
            Alasan: d.data().pesanAdmin || "-"
        }));
    
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Pendaftar");
        XLSX.writeFile(wb, "Pendaftaran_Anggota_Baru_IT.xlsx");
    }catch (err) {
        console.error("Export Gagal:", err);
        alert("Gagal export data!");
    }
};

function getLogs() {
    const logRef = collection(db, 'logs');
    const q = query(logRef, orderBy('time', 'desc'), limit(10));
    
    onSnapshot(q, (snapshot) => {
        const tableBody = document.getElementById('log-list-body');
        let html = ''

        snapshot.forEach((doc) => {
            const logId = doc.id;
            const data = doc.data();
            const waktu = data.time?.toDate().toLocaleString('id-ID') || 'memuat...';
            const aksiColor = data.action.toLowerCase().includes('Menghapus Artikel') ? 'color: #ff4d4d;' : data.action.toLowerCase().includes('Menambah Artikel') ? 'color: 2ecc71;' : '';
            const detail = `Email: ${data.email} | Target: ${data.target}`;

            html += `
                <tr data-id="${logId}">
                    <td><small>${waktu}</small></td>
                    <td><strong>${data.adminName || 'System'}</strong></td>
                    <td style="${aksiColor} font-weight: bold;">${data.action}</td>
                    <td>${detail}</td>
                    <td><code style="background: #333; padding: 2px 5px; border-radius: 4px;">${data.ipAddress}</code></td>
                </tr>`;
        });
        tableBody.innerHTML = html;
    });
}

getLogs();
// ==========================================
// REKAP ABSENSI HARIAN
// ==========================================
const selRekap = document.getElementById('select-rekap-tanggal');
const btnLoadRekap = document.getElementById('btn-load-rekap');
const loadingRekap = document.getElementById('rekap-loading');
const containerRekap = document.getElementById('rekap-result-container');
const tbodyAlfa = document.getElementById('alfa-list-body');

if (selRekap && btnLoadRekap) {
    async function loadSheets() {
        try {
            const res = await fetch(CONFIG.APPS_SCRIPT_URL + "?action=getSheets", { redirect: "follow" });
            const data = await res.json();
            selRekap.innerHTML = "";
            let hasValidSheet = false;
            data.forEach(sheetName => {
                if (sheetName !== "Database Anggota" && sheetName !== "Sheet1") { 
                    selRekap.innerHTML += `<option value="${sheetName}">${sheetName}</option>`;
                    hasValidSheet = true;
                }
            });
            if (!hasValidSheet) selRekap.innerHTML = `<option value="">Belum ada data absen</option>`;
        } catch(e) {
            console.error("Gagal load sheets", e);
            selRekap.innerHTML = `<option value="">Gagal meload tanggal (Periksa Koneksi/Apps Script)</option>`;
        }
    }
    loadSheets();

    btnLoadRekap.addEventListener('click', async () => {
        const tgl = selRekap.value;
        if (!tgl) return;

        loadingRekap.classList.remove('hidden');
        containerRekap.classList.add('hidden');
        tbodyAlfa.innerHTML = "";

        try {
            const resAbsen = await fetch(CONFIG.APPS_SCRIPT_URL + "?action=getRecap&sheetName=" + encodeURIComponent(tgl), { redirect: "follow" });
            const dataAbsen = await resAbsen.json(); 

            const resDb = await fetch(CONFIG.APPS_SCRIPT_URL + "?action=getRecap&sheetName=Database Anggota", { redirect: "follow" });
            const dataDb = await resDb.json(); 

            if (dataDb.length === 0 || dataDb.error) {
                alert("Sheet 'Database Anggota' tidak ditemukan atau kosong di Spreadsheet!");
                return;
            }

            const namaAbsen = [];
            for (let i = 1; i < dataAbsen.length; i++) { 
                if (dataAbsen[i][1]) {
                    namaAbsen.push(dataAbsen[i][1].toString().toLowerCase().trim());
                }
            }

            let htmlAlfa = "";
            let no = 1;
            for (let i = 1; i < dataDb.length; i++) { 
                if (dataDb[i][0]) {
                    const namaDb = dataDb[i][0].toString().trim();
                    if (!namaAbsen.includes(namaDb.toLowerCase())) {
                        const angkatan = dataDb[i][1] || "-";
                        const sub = dataDb[i][2] || "-";
                        htmlAlfa += `<tr>
                            <td>${no++}</td>
                            <td>${namaDb}</td>
                            <td>${angkatan}</td>
                            <td>${sub}</td>
                        </tr>`;
                    }
                }
            }

            if (htmlAlfa === "") {
                htmlAlfa = `<tr><td colspan="4" style="text-align:center;">Semua siswa hadir/izin/sakit hari ini! Kosong!</td></tr>`;
            }

            tbodyAlfa.innerHTML = htmlAlfa;
            containerRekap.classList.remove('hidden');

        } catch (e) {
            console.error(e);
            alert("Gagal menarik data rekap dari Spreadsheet!");
        } finally {
            loadingRekap.classList.add('hidden');
        }
    });
}
