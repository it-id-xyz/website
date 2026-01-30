const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const back = document.getElementById('back');

menuToggle.addEventListener('click', () => {
  navMenu.classList.toggle("show");
});

back.addEventListener('click', () => {
    menuToggle.classList.remove('hidden');
    navMenu.classList.add('hidden');
});