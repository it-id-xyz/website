// Tambahkan import addDoc dan collection jika belum
import { addDoc, collection, serverTimestamp, query, limit, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { updateOnlineStatus } from "./role.js";

// 1. Tampilkan Log Aktivitas
const qLogs = query(collection(db, "logs"), orderBy("time", "desc"), limit(10));
onSnapshot(qLogs, (snap) => {
  const logList = document.getElementById("log-list");
  logList.innerHTML = "";
  snap.forEach(doc => {
    const data = doc.data();
    const time = data.time?.toDate().toLocaleString('id-ID');
    logList.innerHTML += `<li>[${time}] ${data.email}: ${data.action} (${data.target})</li>`;
  });
});

// 2. Tampilkan Admin Online
const qOnline = query(collection(db, "users"), orderBy("lastSeen", "desc"));
onSnapshot(qOnline, (snap) => {
  const onlineList = document.getElementById("online-list");
  onlineList.innerHTML = "";
  snap.forEach(doc => {
    const user = doc.data();
    const statusColor = user.status === "online" ? "green" : "gray";
    onlineList.innerHTML += `
      <div style="margin-bottom: 5px;">
        <span style="color: ${statusColor}">●</span> ${user.email} 
        <small>(Terakhir: ${user.lastSeen?.toDate().toLocaleTimeString()})</small>
      </div>`;
  });
});

// Fungsi Log Global
async function simpanLog(aksi, detail) {
  const ip = await getIP();
  await addDoc(collection(db, "logs"), {
    adminEmail: auth.currentUser.email,
    action: aksi,
    details: detail,
    ipAddress: ip,
    device: navigator.userAgent,
    time: serverTimestamp()
  });
}

// CONTOH SAAT POST ARTIKEL
if (e.target.id === "post-btn") {
 
  
  await simpanLog("TAMBAH_ARTIKEL", judul);
  alert("Artikel terbit!");
}

// CONTOH SAAT HAPUS ARTIKEL
if (e.target.classList.contains("delete-btn")) {
  const id = e.target.dataset.id;
  // ... kode hapus ...
  
  await simpanLog("HAPUS_ARTIKEL", `ID: ${id}`);
}
if (e.target.id === "post-btn") {
  // ... kode posting artikel kamu ...
  
  // LOG AKTIVITAS
  await addDoc(collection(db, "logs"), {
    adminName: auth.currentUser.email, // atau ambil dari user.displayName
    action: "Memposting artikel baru",
    target: judul,
    time: serverTimestamp()
  });
}


// Di dalam fungsi DELETE artikel
if (e.target.classList.contains("delete-btn")) {
  // ... kode delete artikel ...
  
  await addDoc(collection(db, "logs"), {
    adminName: auth.currentUser.email,
    action: "Menghapus artikel",
    target: id, // ID artikel yang dihapus
    time: serverTimestamp()
  });
}