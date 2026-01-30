const btnSubmit = document.getElementById('btn-submit');
const textNama = document.getElementById('text-nama');
const textKelas = document.getElementById('text-kelas');
const textNomer = document.getElementById('text-nomer');
const textBidang = document.getElementById('text-bidang');

btnSubmit.addEventListener('click', () => {
    const namaInput = document.getElementById('nama');
    const whatsappInput = document.getElementById('whatsapp');
    const kelasInput = document.getElementById('kelas');
    const bidangInput = document.getElementById('bidang');

    const namaAnggota = namaInput.value.trim();
    const nomerAnggota = whatsappInput.value.trim();
    const kelasAnggota = kelasInput.value.trim();
    const bidangAnggota = bidangInput.value.trim();

    const oldData = JSON.parse(localStorage.getItem('user'));

    if(namaAnggota == "" ) {
        textNama.classList.add('error');
        return
    } else {
        textNama.classList.remove('error');
    };
    if(nomerAnggota == "") {
        textNomer.classList.add('error');
        return
    } else {
        textNomer.classList.remove('error')
    };
    if(kelasAnggota == "") {
        textKelas.classList.add('error');
        return
    } else {
        textKelas.classList.remove('error');
    };

    if(oldData) {
        if(namaAnggota == oldData.nama) {
        namaInput.classList.add('error')
        textNama.classList.add('error');
        textNama.innerHTML = 'Nama sudah ada';
        return
        }
        else {
            namaInput.classList.remove('error')
            textNama.classList.remove('error');
            textNama.innerHTML = 'Silahkkan masukan nama lengkap';
            const inputData = {
                nama : namaAnggota,
                kelas : kelasAnggota,
                nomer : nomerAnggota,
                bidang : bidangAnggota
                }
            localStorage.setItem('user',JSON.stringify(inputData));
            
        };
        window.location.href = 'succes.html';
    } 
});