let qrcodeContainer = document.getElementById("qrcode");
    let qrCode = null;

    function generateQR() {
        const input = document.getElementById("text-input").value;
        const nama = document.getElementById("nama-input").value;
        let downloadBtn = document.getElementById("download-btn");
        
        if (!input || !nama) {
            alert("Isi dulu inputnya");
            return;
        }

        qrcodeContainer.innerHTML = "";
        qrCode = new QRCode(qrcodeContainer, {
            text: input,
            width: 256,
            height: 256,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        setTimeout(() => {
            let canvas = qrcodeContainer.querySelector("canvas");
            if (canvas) {
                let image = canvas.toDataURL("image/png");
                downloadBtn.href = image;
                const fileName = nama ? nama.replace(/[^a-z0-9]/gi, '_') : 'qrcode';
                downloadBtn.download = `QR_${nama}.png`;
                downloadBtn.style.display = "inline-block";
            }
        }, 500);
    }
