import { 
    doc, 
    getDoc, 
    getDocs, 
    collection, 
    updateDoc, 
    query,
    where 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "./firebase.js";
import { CONFIG } from "./config.js";

const APPS_SCRIPT_URL = CONFIG.APPS_SCRIPT_URL;
const TARGET_LAT = CONFIG.TARGET_LAT;
const TARGET_LNG = CONFIG.TARGET_LNG;
const TOLERANSI_METER = CONFIG.TOLERANSI_METER;

const video = document.getElementById('video');
const btnConfirm = document.getElementById('btn-confirm');
const pesan = document.getElementById('pesan');
const userInfo = document.getElementById('user-info');

let stream;

// ==========================================
// 1. FUNGSI LOKASI
// ==========================================
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

function cekLokasi() {
    if (!navigator.geolocation) {
        pesan.innerText = "Tidak dapat menggunakan gps!";
        return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
        const dist = getDistance(
            position.coords.latitude, position.coords.longitude, TARGET_LAT, TARGET_LNG
        );
        if (dist > TOLERANSI_METER) {
            pesan.innerHTML = `<b style="color:red">Kamu di luar zona!</b> (Jarak: ${Math.round(dist)}m)`;
            return;
        } else {
            pesan.innerText = "Lokasi OK. Memuat database wajah...";
            startVideo();
        }
    }, () => {
        pesan.innerText = "Izin lokasi ditolak";
    });
}

// ==========================================
// 2. FUNGSI DATABASE & GOOGLE SHEETS
// ==========================================
async function cekFirestore(descriptorScan) {
    try {
        pesan.innerText = "Mencocokkan dengan database...";
        const q = query(collection(db, "users")); 
        const querySnapshot = await getDocs(q);
        const labeledDescriptors = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.FaceID) {
                const floatDescriptor = new Float32Array(data.FaceID);
                labeledDescriptors.push(
                    new faceapi.LabeledFaceDescriptors(data.nama, [floatDescriptor])
                );
            }
        });

        if (labeledDescriptors.length === 0) {
            alert("Database kosong, bro. Daftar dulu!");
            return null;
        }

        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
        return faceMatcher.findBestMatch(descriptorScan); 
        
    } catch (err) {
        console.error("Error Firestore:", err);
        return null;
    }
}

async function sendSpreadsheet(namaAnggota, subMateri, angkatan) {
    const payload = {
        nama: namaAnggota,
        jarak: "Terdeteksi di Lokasi",
        status: "Hadir",
        sub_materi: subMateri || "N/A", 
        angkatan: angkatan || "2024"
    };

    try {
        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
        });
        alert(`Absen Berhasil: ${namaAnggota}`);
        location.reload();
    } catch (err) {
        alert("Gagal kirim ke Spreadsheet!");
    }
}

// ==========================================
// 3. FUNGSI KAMERA
// ==========================================
async function startVideo() {
    const detections = await faceapi.detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detections) {
        pesan.innerText = "Muka anda tidak terlihat!";
        return;
    }

    const descriptorArray = detections.descriptor; 
    const hasilMatch = await cekFirestore(descriptorArray);

    if (hasilMatch && hasilMatch.label !== 'unknown') {
        pesan.innerText = "Wajah Dikenali!";
        
        const q = query(collection(db, "users"), where("nama", "==", hasilMatch.label));
        const userSnap = await getDocs(q);
        
        if (!userSnap.empty) {
            const userData = userSnap.docs[0].data();
            
            userInfo.innerHTML = `
                <p>NAMA: <strong>${hasilMatch.label}</strong><br>
                   STATUS: Cocok (${Math.round((1 - hasilMatch.distance) * 100)}%)<br>
                   SUB: ${userData.Sub || 'N/A'}<br>
                   UID: ${userSnap.docs[0].id}
                </p>
                <button id="btn-confirm-absen" class="bg-green-500 p-2 text-white mt-2">Konfirmasi Absen</button>
            `;
            
            document.getElementById('btn-confirm-absen').onclick = () => {
                sendSpreadsheet(hasilMatch.label, userData.Sub, userData.Angkatan);
            };
        }
    } else {
        userInfo.innerHTML = "<p style='color:red'>Wajah tidak dikenal! Silahkan daftar dulu.</p>";
    }
}

// ==========================================
// 4. EVENT LISTENERS UI
// ==========================================
document.getElementById('btn-absen').addEventListener('click', async () => {
    document.getElementById('live-camera').classList.remove('hidden');
    document.getElementById('info-user').classList.remove('hidden');
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        video.srcObject = stream;
        video.style.display = 'block';
        if(typeof btnStartCamera !== 'undefined') btnStartCamera.style.display = 'none';
        if(typeof btnCapture !== 'undefined') btnCapture.style.display = 'block';
    } catch (err) {
        alert("Gagal akses kamera bro! " + err);
    }
    cekLokasi();
});

document.getElementById('daftar-wajah').addEventListener('click', () => {
    document.getElementById('form-daftar').classList.remove('hidden');
});

// ==========================================
// 5. PROSES PENDAFTARAN
// ==========================================
document.getElementById('scan-wajah').addEventListener('click', async () => {
    const nama = document.getElementById('nama-anggota').value; 
    const uid = document.getElementById('uid-anggota').value;

    if (!nama || !uid) {
        alert("Silahkan isi Nama dan UID terlebih dahulu!");
        return;
    }

    pesan.innerText = "Mengecek data di database...";

    try {
        const docRef = doc(db, "users", uid); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const dataDB = docSnap.data();

            if (dataDB.nama.toLowerCase() === nama.toLowerCase()) {
                pesan.innerText = "Data cocok! Membuka kamera untuk scan wajah...";

                document.getElementById('live-camera').classList.remove('hidden');
                document.getElementById('info-user').classList.remove('hidden');
                document.getElementById('form-daftar').classList.add('hidden');

                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                video.srcObject = stream;
                video.style.display = 'block';

                setTimeout(async () => {
                    const detections = await faceapi.detectSingleFace(video)
                        .withFaceLandmarks()
                        .withFaceDescriptor();

                    if (!detections) {
                        alert("Wajah tidak terdeteksi! Coba lagi.");
                        return;
                    }

                    const descriptorArray = Array.from(detections.descriptor);

                    await updateDoc(docRef, {
                        FaceID: descriptorArray
                    });

                    alert("Pendaftaran Berhasil! Wajah kamu sudah terdaftar.");
                    location.reload();
                }, 2000); 

            } else {
                alert("Nama tidak cocok dengan UID yang terdaftar!");
            }
        } else {
            alert("UID tidak ditemukan di database!");
        }

    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan: " + err.message);
    }
});
