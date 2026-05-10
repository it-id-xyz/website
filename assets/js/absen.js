import { db, auth } from "./firebase.js";
import { collection, query, where, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import * as faceapi from "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.esm.js";
import { CONFIG } from "./config.js";

const APPS_SCRIPT_URL = CONFIG.APPS_SCRIPT_URL;
const TARGET_LAT = CONFIG.TARGET_LAT;
const TARGET_LNG = CONFIG.TARGET_LNG;
const TOLERANSI_METER = CONFIG.TOLERANSI_METER;

const menuUtama = document.getElementById('menu-utama');
const menuAbsen = document.getElementById('menu-absen');
const menuDaftar = document.getElementById('menu-daftar');
const menuIzin = document.getElementById('menu-izin');

let streamAktif; 
let cachedDescriptors = [];
let userDataCache = {};
let isDataLoaded = false;
let currentDistance = 0;

// ==========================================
// 0. SWEETALERT FALLBACK
// ==========================================
const myAlert = (title, text, icon) => {
    if (typeof Swal !== 'undefined') {
        return Swal.fire({ title, text, icon });
    } else {
        alert(`${title}\n${text}`);
        return Promise.resolve({ isConfirmed: true });
    }
};

// ==========================================
// 0. AUTH OBSERVER (BIAR NYANGKUT)
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User login:", user.email);
    } else {
        myAlert('Oops...', 'Waduh, kamu belum login! Balik dulu ya.', 'error')
        .then(() => {
            window.location.href = "login.html"; 
        });
    }
});
// ==========================================
// 1. INISIALISASI AI
// ==========================================
async function loadModels() {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    console.log("AI Face Recognition Ready!");
}
loadModels();

// ==========================================
// 2. NAVIGASI MENU & KAMERA CONTROLLER
// ==========================================
function stopCamera() {
    if (streamAktif) {
        streamAktif.getTracks().forEach(track => track.stop());
    }
}

function switchMenu(showMenu) {
    stopCamera(); 
    menuUtama.classList.add('hidden');
    menuAbsen.classList.add('hidden');
    menuDaftar.classList.add('hidden');
    menuIzin.classList.add('hidden');
    showMenu.classList.remove('hidden');
}

document.getElementById('btn-kembali-absen').addEventListener('click', () => switchMenu(menuUtama));
document.getElementById('btn-kembali-daftar').addEventListener('click', () => switchMenu(menuUtama));
document.getElementById('btn-kembali-izin').addEventListener('click', () => switchMenu(menuUtama));
document.getElementById('btn-menu-izin').addEventListener('click', () => switchMenu(menuIzin));

// ==========================================
// 3.  ABSEN (GEOLOCATION + DETEKSI)
// ==========================================
const videoAbsen = document.getElementById('videoAbsen');
const previewAbsen = document.getElementById('previewAbsen');
const canvasAbsen = document.getElementById('canvasAbsen');
const btnJepretAbsen = document.getElementById('btn-jepret-absen');
const btnUlangiAbsen = document.getElementById('btn-ulangi-absen');
const pesanLokasi = document.getElementById('pesan-lokasi');
const btnScanAbsen = document.getElementById('btn-scan-absen');
const previewUser = document.getElementById('preview-user');

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

document.getElementById('btn-menu-absen').addEventListener('click', async () => {
    const now = new Date();
    const day = now.getDay();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const startMins = (CONFIG.JAM_MULAI || 0) * 60 + (CONFIG.MENIT_MULAI || 0);
    const endMins = (CONFIG.JAM_SELESAI || 23) * 60 + (CONFIG.MENIT_SELESAI || 59);

    if (CONFIG.HARI_ABSEN && !CONFIG.HARI_ABSEN.includes(day)) {
        myAlert('Tutup', 'Absen tidak dibuka pada hari ini!', 'error');
        return;
    }
    if (currentMins < startMins || currentMins > endMins) {
        myAlert('Tutup', `Absen hanya dibuka jam ${CONFIG.JAM_MULAI}:${CONFIG.MENIT_MULAI} - ${CONFIG.JAM_SELESAI}:${CONFIG.MENIT_SELESAI}!`, 'error');
        return;
    }

    switchMenu(menuAbsen);
    previewUser.classList.add('hidden');
    btnScanAbsen.classList.add('hidden');
    btnUlangiAbsen.classList.add('hidden');
    btnJepretAbsen.classList.add('hidden');
    videoAbsen.classList.remove('hidden');
    previewAbsen.classList.add('hidden');
    
    if (!isDataLoaded) {
        pesanLokasi.innerHTML = "Memuat data wajah dari database...";
        try {
            const q = query(collection(db, "UID")); 
            const querySnapshot = await getDocs(q);
            
            querySnapshot.forEach((document) => {
                const data = document.data();
                if (data.FaceID && data.FaceID.length > 0) {
                    const label = data.Nama || document.id;
                    const floatDescriptor = new Float32Array(data.FaceID);
                    cachedDescriptors.push(new faceapi.LabeledFaceDescriptors(label, [floatDescriptor]));
                    userDataCache[label] = {
                        Sub: data.sub || data.Sub || data.sub_materi || data.Sub_Materi || "N/A",
                        Angkatan: data.Angkatan || "2024"
                    };
                }
            });
            isDataLoaded = true;
        } catch (err) {
            myAlert('Error', 'Gagal memuat data wajah dari database!', 'error');
            return;
        }
    }

    if (!navigator.geolocation) {
        pesanLokasi.innerHTML = "<span style='color:red'>Browser tidak support GPS!</span>";
        return;
    }

    pesanLokasi.innerText = "Mengecek Lokasi GPS...";
    navigator.geolocation.getCurrentPosition(async (position) => {
        const dist = getDistance(position.coords.latitude, position.coords.longitude, TARGET_LAT, TARGET_LNG);
        currentDistance = Math.round(dist);
        
        if (dist > TOLERANSI_METER) {
            pesanLokasi.innerHTML = `<span style="color:red">Di luar area sekolah! (Jarak: ${currentDistance}m)</span>`;
        } else {
            pesanLokasi.innerHTML = `<span style="color:#10b981">Lokasi Valid (${currentDistance}m). Menyalakan kamera...</span>`;
            
            try {
                streamAktif = await navigator.mediaDevices.getUserMedia({ video: true });
                videoAbsen.srcObject = streamAktif;
                btnJepretAbsen.classList.remove('hidden');
            } catch (err) {
                pesanLokasi.innerHTML = `<span style="color:red">Gagal akses kamera: ${err.message}</span>`;
            }
        }
    }, () => {
        pesanLokasi.innerHTML = "<span style='color:red'>Izin lokasi (GPS) ditolak!</span>";
    });
});


btnJepretAbsen.addEventListener('click', () => {
    canvasAbsen.width = videoAbsen.videoWidth;
    canvasAbsen.height = videoAbsen.videoHeight;
    canvasAbsen.getContext('2d').drawImage(videoAbsen, 0, 0, canvasAbsen.width, canvasAbsen.height);
    
    const imageData = canvasAbsen.toDataURL('image/jpeg');
    
    videoAbsen.classList.add('hidden');
    previewAbsen.src = imageData;
    previewAbsen.classList.remove('hidden');
    
    btnJepretAbsen.classList.add('hidden');
    btnScanAbsen.classList.remove('hidden');
    btnUlangiAbsen.classList.remove('hidden');
});

btnUlangiAbsen.addEventListener('click', () => {
    previewAbsen.classList.add('hidden');
    videoAbsen.classList.remove('hidden');
    
    btnScanAbsen.classList.add('hidden');
    btnUlangiAbsen.classList.add('hidden');
    btnJepretAbsen.classList.remove('hidden');
    pesanLokasi.innerHTML = `<span style="color:#10b981">Silakan jepret foto.</span>`;
    previewUser.classList.add('hidden');
});

btnScanAbsen.addEventListener('click', async () => {
    btnScanAbsen.textContent = "Menganalisa...";
    btnScanAbsen.disabled = true;

    const detections = await faceapi.detectSingleFace(previewAbsen).withFaceLandmarks().withFaceDescriptor();

    if (!detections) {
        myAlert('Oops...', 'Wajah tidak terdeteksi di foto! Coba ulangi foto.', 'warning');
        btnScanAbsen.textContent = "Deteksi Wajah";
        btnScanAbsen.disabled = false;
        return;
    }

    pesanLokasi.innerText = "Mencocokkan dengan Database...";

    if (cachedDescriptors.length === 0) {
        myAlert('Info', 'Database wajah masih kosong, daftar dulu bro!', 'info');
        btnScanAbsen.textContent = "Deteksi Wajah";
        btnScanAbsen.disabled = false;
        return;
    }

    const faceMatcher = new faceapi.FaceMatcher(cachedDescriptors, 0.55); 
    const hasilMatch = faceMatcher.findBestMatch(detections.descriptor);

    if (hasilMatch && hasilMatch.label !== 'unknown') {
        pesanLokasi.innerHTML = `<span style="color:#10b981">Wajah Cocok: ${hasilMatch.label}!</span>`;
        
        let subMateri = "N/A", angkatan = "2024";
        if (userDataCache[hasilMatch.label]) {
            subMateri = userDataCache[hasilMatch.label].Sub;
            angkatan = userDataCache[hasilMatch.label].Angkatan;
        }

        previewUser.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.2); padding: 10px; border-radius: 8px; margin-bottom:10px;">
                <p>NAMA: <strong>${hasilMatch.label}</strong></p>
                <p>MATCH: ${Math.round((1 - hasilMatch.distance) * 100)}%</p>
            </div>
        `;
        previewUser.classList.remove('hidden');

        sendSpreadsheet(hasilMatch.label, subMateri, angkatan, currentDistance);
    } else {
        pesanLokasi.innerHTML = "<span style='color:red'>Wajah tidak dikenal!</span>";
        btnScanAbsen.textContent = "Coba Lagi";
        btnScanAbsen.disabled = false;
    }
});

async function sendSpreadsheet(namaAnggota, subMateri, angkatan, jarak, status = "Hadir", alasan = "-") {
    const todayStr = new Date().toLocaleDateString('id-ID');
    const cacheKey = `absen_${namaAnggota}`;
    if (localStorage.getItem(cacheKey) === todayStr) {
        myAlert('Peringatan', 'Kamu sudah absen hari ini!', 'warning');
        btnScanAbsen.disabled = false;
        const btnKirim = document.getElementById('btn-kirim-izin');
        if (btnKirim) { btnKirim.disabled = false; btnKirim.textContent = "Kirim Pengajuan"; }
        return;
    }

    const payload = {
        nama: namaAnggota,
        jarak: jarak,
        status: status,
        sub_materi: subMateri, 
        angkatan: angkatan,
        alasan: alasan
    };

    try {
        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
        });
        localStorage.setItem(cacheKey, todayStr);
        myAlert('Berhasil!', `Absen atas nama ${namaAnggota} berhasil dikirim ke Spreadsheet.`, 'success').then(() => {
            location.reload();
        });
    } catch (err) {
        myAlert('Error', 'Waduh, absen berhasil tapi gagal kirim ke Spreadsheet!', 'error');
        btnScanAbsen.disabled = false;
    }
}

// ==========================================
// 3.5 DAFTAR IZIN / SAKIT
// ==========================================
document.getElementById('btn-kirim-izin').addEventListener('click', async () => {
    const nama = document.getElementById('namaIzin').value.trim();
    const status = document.getElementById('statusIzin').value;
    const alasan = document.getElementById('alasanIzin').value.trim();
    const btnKirim = document.getElementById('btn-kirim-izin');

    if (!nama || !alasan) {
        myAlert('Peringatan', 'Nama dan alasan wajib diisi bro!', 'warning');
        return;
    }

    btnKirim.disabled = true;
    btnKirim.textContent = "Mengirim...";

    let subMateri = "N/A", angkatan = "2024";
    sendSpreadsheet(nama, subMateri, angkatan, "-", status, alasan);
});

// ==========================================
// 4. DAFTAR WAJAH BARU
// ==========================================
const videoDaftar = document.getElementById('videoDaftar');
const previewDaftar = document.getElementById('previewDaftar');
const canvasDaftar = document.getElementById('canvasDaftar');
const btnStartCameraDaftar = document.getElementById('btnStartCameraDaftar');
const btnCaptureDaftar = document.getElementById('btnCaptureDaftar');
const btnConfirmDaftar = document.getElementById('btnConfirmDaftar');
const btnRetakeDaftar = document.getElementById('btnRetakeDaftar');

let finalImageBase64 = "";

document.getElementById('btn-menu-daftar').addEventListener('click', () => {
    switchMenu(menuDaftar);
});

btnStartCameraDaftar.addEventListener('click', async () => {
    try {
        streamAktif = await navigator.mediaDevices.getUserMedia({ video: true });
        videoDaftar.srcObject = streamAktif;
        
        videoDaftar.classList.remove('hidden');
        btnStartCameraDaftar.classList.add('hidden');
        btnCaptureDaftar.classList.remove('hidden');
    } catch (err) {
        myAlert('Gagal', "Gagal akses kamera: " + err.message, 'error');
    }
});

btnCaptureDaftar.addEventListener('click', () => {
    const nama = document.getElementById('namaUser').value;
    const id = document.getElementById('idUser').value;

    if (!nama || !id) {
        myAlert('Peringatan', 'Isi Nama dan ID dulu bro!', 'warning');
        return;
    }

    canvasDaftar.width = videoDaftar.videoWidth;
    canvasDaftar.height = videoDaftar.videoHeight;
    canvasDaftar.getContext('2d').drawImage(videoDaftar, 0, 0, canvasDaftar.width, canvasDaftar.height);
    
    finalImageBase64 = canvasDaftar.toDataURL('image/jpeg');
    
    videoDaftar.classList.add('hidden');
    previewDaftar.src = finalImageBase64;
    previewDaftar.classList.remove('hidden');
    
    btnCaptureDaftar.classList.add('hidden');
    btnConfirmDaftar.classList.remove('hidden');
    btnRetakeDaftar.classList.remove('hidden');
});

btnRetakeDaftar.addEventListener('click', () => {
    previewDaftar.classList.add('hidden');
    videoDaftar.classList.remove('hidden');
    
    btnConfirmDaftar.classList.add('hidden');
    btnRetakeDaftar.classList.add('hidden');
    btnCaptureDaftar.classList.remove('hidden');
});

btnConfirmDaftar.addEventListener('click', async () => {
    const nama = document.getElementById('namaUser').value;
    const id = document.getElementById('idUser').value; 
    
    btnConfirmDaftar.disabled = true;
    btnConfirmDaftar.textContent = "Menganalisa...";

    const detections = await faceapi.detectSingleFace(previewDaftar).withFaceLandmarks().withFaceDescriptor();
    
    if (!detections) {
        myAlert('Oops...', 'Wajah nggak kedeteksi di foto! Coba foto ulang di tempat terang.', 'warning');
        btnConfirmDaftar.disabled = false;
        btnConfirmDaftar.textContent = "Simpan ke Database";
        return;
    }
    
    const faceDescriptor = Array.from(detections.descriptor);
    
    try {
        btnConfirmDaftar.textContent = "Menyimpan...";
        const q = query(collection(db, "UID"), where("ID", "==", id));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            myAlert('Error', `Data dengan ID ${id} tidak ditemukan. Minta admin masukin datanya dulu bro!`, 'error');
            btnConfirmDaftar.disabled = false;
            btnConfirmDaftar.textContent = "Simpan ke Database";
            return;
        }

        for (const docSnap of querySnapshot.docs) {
            const userRef = doc(db, "UID", docSnap.id);
            await updateDoc(userRef, { FaceID: faceDescriptor, Nama: nama });
        }
        
        myAlert('Mantap!', `FaceID atas nama ${nama} berhasil disimpan.`, 'success').then(() => {
            location.reload(); 
        });

    } catch (error) {
        console.error("Error: ", error);
        myAlert('Error', 'Gagal simpan ke database. Cek console.', 'error');
        btnConfirmDaftar.disabled = false;
        btnConfirmDaftar.textContent = "Simpan ke Database";
    }
});
