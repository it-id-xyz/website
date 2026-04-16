const video = document.getElementById('video');
const btnConfirm = document.getElementById('btn-confirm');
const pesan = document.getElementById('pesan');
const userInfo = document.getElementById('user-info');

const TARGET_LAT = -6.4128827;
const TARGET_LNG = 107.0842405;
const TOLERANSI_METER = 50;

let stream

function cekLokasi() {
    if (!navigator.getlocation) {
        pesan.innerText = "Tidak dapat menggunakan gps!";
        return;
    }
    navigator.geolocation.getCurrentPosition((position) =>{
        const dist = getDistance(
            position.coords.latitude,position.coords.longitude, TARGET_LAT, TARGET_LNG
        );
        if (dist > TOLERANSI_METER) {
            pesan.innerText = `<b style="color:red">kamu di luar zona!</b> (jarak: $(math.round(dist)m)`;
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
    };
    const descriptorArray = Array.from(detections.descriptor);
    const response = await fetch('https://api.it-smansaci.my.id/identify', 
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descriptorArray })
    });
    const jawaban = await response.json();

    if (jawaban.nama !== 'unknown') {
        userInfo.innerHTML =    `<p>NAMA: <strong>${jawaban.nama}</strong><br>
                                    ID: ${jawaban.id}<br>
                                    SUB MATERI: ${jawaban.materi}<br>
                                    ANGKATAN: ${jawaban.akt}
                                </p>`;
    } else {
        userInfo.innerHTML = "<p>Wajah tidak dikenali! silahkan coba lagi/daftar.</p>"
    }
};

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
