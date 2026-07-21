// Ganti pakai URL Web App lu dari Google Script Poin 1
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwv1P5mKRL2RgRf1hcAV-hBdnuAdA5Kp9WlV-OUZMypVkK0emco8ReJIoKjLS4kANSMCw/exec"; 

document.addEventListener("DOMContentLoaded", () => {
    const stepVerify = document.getElementById("step-verify");
    const formInput = document.getElementById("form-input");
    
    const btnVerify = document.getElementById("btn-verify");
    const waVerifyInput = document.getElementById("wa-verify");
    const verifyMsg = document.getElementById("verify-msg");

    // TAHAP 1: VERIFIKASI WA
    btnVerify.addEventListener("click", async () => {
        let wa = waVerifyInput.value.trim();
        // Paksa ubah awalan 0 jadi 62 kalau ada yang ngetik 0812
        if(wa.startsWith('0')) wa = '62' + wa.substring(1);
        
        if (wa === "") {
            showMsg(verifyMsg, "Masukkan nomor WA lu bro!", "red");
            return;
        }

        btnVerify.disabled = true;
        btnVerify.innerText = "Mengecek Database...";

        try {
            let res = await fetch(SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({ action: "verify", whatsapp: wa }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            let result = await res.json();

            if (result.success) {
                // Sembunyikan verifikasi, tampilkan form
                stepVerify.style.display = "none";
                formInput.style.display = "block";
                
                // Isi input tersembunyi sebagai acuan
                document.getElementById("nama").value = result.nama;
                document.getElementById("whatsapp").value = wa;
                document.getElementById("display-nama").innerText = result.nama;
            } else {
                showMsg(verifyMsg, result.message, "#ef4444");
            }
        } catch (error) {
            showMsg(verifyMsg, "Error koneksi ke server", "#ef4444");
        }

        btnVerify.disabled = false;
        btnVerify.innerText = "Verifikasi Nomor";
    });

    // TAHAP 2: SUBMIT BIODATA
    formInput.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const btnSubmit = document.getElementById("btn-submit");
        const submitMsg = document.getElementById("submit-msg");
        
        const payload = {
            action: "submit",
            whatsapp: document.getElementById("whatsapp").value,
            nama: document.getElementById("nama").value,
            email: document.getElementById("email").value,
            kelas: document.getElementById("kelas").value,
            bidang: document.getElementById("bidang").value
        };

        btnSubmit.disabled = true;
        btnSubmit.innerText = "Menyimpan Data...";

        try {
            let res = await fetch(SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            let result = await res.json();

            if (result.success) {
                showMsg(submitMsg, "Sukses! Pendaftaran berhasil.", "#10b981");
                // Reset form & kembali ke awal (opsional)
                setTimeout(() => { window.location.href = "index.html"; }, 2000);
            } else {
                showMsg(submitMsg, result.message, "#ef4444");
                btnSubmit.disabled = false;
                btnSubmit.innerText = "Submit Pendaftaran";
            }
        } catch (error) {
            showMsg(submitMsg, "Gagal mengirim data", "#ef4444");
            btnSubmit.disabled = false;
            btnSubmit.innerText = "Submit Pendaftaran";
        }
    });

    function showMsg(el, text, color) {
        el.style.display = "block";
        el.style.color = color;
        el.innerText = text;
    }
});
