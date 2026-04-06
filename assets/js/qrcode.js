let qrcodeContainer = document.getElementById("qrcode");
    let qrCode = null;

    function generateQR() {
        let input = document.getElementById("text-input");
        const nama = document.getElementById("nama-input").value;
        let downloadBtn = document.getElementById("download-btn");
        
        if (input.value.trim() === "") {
            alert("Isi dulu inputnya");
            return;
        }

        qrcodeContainer.innerHTML = "";
        qrCode = new QRCode(qrcodeContainer, {
            text: input.value,
            width: 200,
            height: 200,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        setTimeout(() => {
            let canvas = qrcodeContainer.querySelector("canvas");
            if (canvas) {
                let image = canvas.toDataURL("image/png");
                downloadBtn.href = image;
                downloadBtn.download = `QR_${nama}.png`;
                downloadBtn.style.display = "inline-block";
            }
        }, 300);
    }
