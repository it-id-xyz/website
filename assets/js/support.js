import { showAdminUI } from "./js/role.js";
showAdminUI();
const newList = document.getElementById('new-list');
const btnUpdate = document.getElementById('btn-update');

const role = localStorage.getItem("role");

if (role !== "admin") {
  alert("Halaman khusus admin");
  window.location.href = "index.html";
}


btnUpdate.addEventListener('click', () => {

})

//btnUpdate.addEventListener('click', () => {
//    if(isAdmin) {

//    } else {
//        const error = document.getElementById('if-error');
//        const cText = document.createElement("p");
//        cText.innerText = "Kamu bukan Admin atau Editor";
//        cText.style.color = "red";
//        error.appendChild(cText);
//    }
//})

