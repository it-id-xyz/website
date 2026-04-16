import { 
    doc, 
    getDoc, 
    getDocs, 
    collection, 
    updateDoc, 
    query 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "./firebase.js";
const video = document.getElementById('video');
const btnConfirm = document.getElementById('btn-confirm');
const pesan = document.getElementById('pesan');
const userInfo = document.getElementById('user-info');

const TARGET_LAT = -6.4128827;
const TARGET_LNG = 107.0842405;
const TOLERANSI_METER = 50;

let stream

function cekLokasi() {
    if (!navigator.geolocation) {
        pesan.innerText = "Tidak dapat menggunakan gps!";
        return;
    }
    navigator.geolocation.getCurrentPosition((position) =>{
        const dist = getDistance(
            position.coords.latitude,position.coords.longitude, TARGET_LAT, TARGET_LNG
        );
        if (dist > TOLERANSI_METER) {
            pesan.innerText = `<b style="color:red">kamu di luar zona!</b> (jarak: ${math.round(dist)}m`;
            return;
        } else {
            pesan.innerText ="Lokasi OK. Memuat database wajah...";
            startVideo();
        }
    }, () => {
        pesan.innerText = "Izin lokasi ditolak"
    });
};

async function startVideo() {
    const detections = await faceapi.detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detections) {
        pesan.innerText = "Muka anda tidak terlihat!";
        return;
    }

    const descriptorArray = detections.descriptor; 
    const hasilMatch = await cariMukaDiFirestore(descriptorArray);

    if (hasilMatch && hasilMatch.label !== 'unknown') {
        pesan.innerText = "Wajah Dikenali!";
        userInfo.innerHTML = `
            <p>NAMA: <strong>${hasilMatch.label}</strong><br>
               STATUS: Cocok (${Math.round((1 - hasilMatch.distance) * 100)}%)
            </p>
            <button id="btn-confirm-absen" class="bg-green-500 p-2 text-white">Konfirmasi Absen</button>
        `;
        document.getElementById('btn-confirm-absen').onclick = () => {
            kirimDataKeSpreadsheet(hasilMatch.label);
        };

    } else {
        userInfo.innerHTML = "<p style='color:red'>Wajah tidak dikenal! Silahkan daftar dulu.</p>";
    }
}

async function cariMukaDiFirestore(descriptorScan) {
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
            return;
        }

        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
        const bestMatch = faceMatcher.findBestMatch(descriptorScan);
        return bestMatch; 
        
    } catch (err) {
        console.error("Error Firestore:", err);
    }
}

document.getElementById('btn-absen').addEventListener('click', async ()=> {
    document.getElementById('live-camera').classList.remove('hidden');
    document.getElementById('info-user').classList.remove('hidden');
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        video.srcObject = stream;
        video.style.display = 'block';
        btnStartCamera.style.display = 'none';
        btnCapture.style.display = 'block';
    } catch (err) {
        alert("Gagal akses kamera bro!");
    }
    cekLokasi();
    
})
document.getElementById('daftar-wajah').addEventListener('click', ()=> {
    document.getElementById('form-daftar').classList.remove('hidden');
});
document.getElementById('scan-wajah').addEventListener('click', async () => {
    const nama = document.getElementById('nama-anggota').value;
    const uid = document.getElementById('uid-anggota').value;
    if(!nama && !uid) {
        alert("Silahkan isi form yang kosong");
        return;
    }


    document.getElementById('live-camera').classList.remove('hidden');
    document.getElementById('info-user').classList.remove('hidden');
    document.getElementById('form-daftar').classList.add('hidden');

    let data = {
        nama: nama,
        uid: uid,
        waktu: new Date()
    }

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        video.srcObject = stream;
        video.style.display = 'block';
        btnStartCamera.style.display = 'none';
        btnCapture.style.display = 'block';
    } catch (err) {
        alert("Gagal akses kamera bro!");
    }
    startVideo();
}) 
