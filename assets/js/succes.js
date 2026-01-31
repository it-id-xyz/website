window.onload = function() {
    const oldData =JSON.parse(localStorage.getItem('user'));
    const textSucces = document.getElementById('succes-text');

    textSucces.innerHTML = `Halo, ${oldData.nama}, Selamat pendaftaran kamu berhasil`;
    
}