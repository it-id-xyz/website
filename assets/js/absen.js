import { db } from "./firebase.js";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const video = document.getElementById('videoElement');
const preview = document.getElementById('previewImage');
const canvas = document.getElementById('canvasElement');
const btnStartCamera = document.getElementById('btnStartCamera');
const btnCapture = document.getElementById('btnCapture');
const btnConfirm = document.getElementById('btnConfirm');
const btnRetake = document.getElementById('btnRetake');

let stream;
let finalImageBase64 = "";

preview.classList.add('hidden');
btnCapture.classList.add('hidden');
btnConfirm.classList.add('hidden');
btnRetake.classList.add('hidden');

async function loadModels() {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    console.log("AI Ready!");
}
loadModels();

// 1. BUKA KAMERA
btnStartCamera.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        
        btnStartCamera.classList.add('hidden');
        btnCapture.classList.remove('hidden');
    } catch (err) {
        alert("Gagal akses kamera bro! Pastikan dapet izin.");
    }
});

// 2. SCAN WAJAH (CAPTURE)
btnCapture.addEventListener('click', () => {
    const nama = document.getElementById('namaUser').value;
    const id = document.getElementById('idUser').value;

    if (!nama || !id) {
        alert("Isi Nama dan ID dulu bro!");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    finalImageBase64 = canvas.toDataURL('image/jpeg');
    
    video.classList.add('hidden');
    preview.src = finalImageBase64;
    preview.classList.remove('hidden');
    
    btnCapture.classList.add('hidden');
    btnConfirm.classList.remove('hidden');
    btnRetake.classList.remove('hidden');
});

// 3. ULANGI FOTO (RETAKE)
btnRetake.addEventListener('click', () => {
    preview.classList.add('hidden');
    video.classList.remove('hidden');
    
    btnConfirm.classList.add('hidden');
    btnRetake.classList.add('hidden');
    btnCapture.classList.remove('hidden');
});

// 4. CONFIRM & UPDATE FIRESTORE
btnConfirm.addEventListener('click', async () => {
    const nama = document.getElementById('namaUser').value;
    const id = document.getElementById('idUser').value; 
    const detections = await faceapi.detectSingleFace(preview).withFaceLandmarks().withFaceDescriptor();
    
    if (!detections) {
        alert("Wajah nggak kedeteksi di foto! Ulangi lagi bro.");
        btnConfirm.disabled = false;
        btnConfirm.textContent = "Confirm & Simpan ke Firestore";
        return;
    }
    
    const faceDescriptor = Array.from(detections.descriptor);
    
        try {
            btnConfirm.disabled = true;
            btnConfirm.textContent = "Menyimpan...";

            const q = query(collection(db, "UID"), where("ID", "==", id));
            const querySnapshot = await getDocs(q);
    
            if (querySnapshot.empty) {
                alert(`Bro, data dengan NIS ${id} gak ketemu di Firestore! Pastikan udah didaftarin dari Google Sheets/Admin.`);
                btnConfirm.disabled = false;
                btnConfirm.textContent = "Confirm & Simpan ke Firestore";
                return;
            }
    
            querySnapshot.forEach(async (document) => {
                const userRef = doc(db, "UID", document.id);
                
                await updateDoc(userRef, {
                    FaceID: faceDescriptor 
                });
                
                alert(`Sip! FaceID atas nama ${nama} berhasil disave ke database.`);
                location.reload(); 
            });
    
        } catch (error) {
            console.error("Error updating document: ", error);
            alert("Waduh, gagal simpan ke databasea. Cek console bro.");
            btnConfirm.disabled = false;
            btnConfirm.textContent = "Confirm & Simpan ke databasea";
        }
    });
