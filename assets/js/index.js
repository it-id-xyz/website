const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const back = document.getElementById('back');

menuToggle.addEventListener('click', () => {
  navMenu.classList.remove('hidden');
});

back.addEventListener('click', () => {
    navMenu.classList.add('hidden');
});