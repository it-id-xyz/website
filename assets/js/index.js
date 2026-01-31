const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const back = document.getElementById('back');
const alurIt = document.getElementById('alurIt');



menuToggle.addEventListener('click', () => {
  navMenu.classList.remove('hidden');
});

back.addEventListener('click', () => {
    navMenu.classList.add('hidden');
});