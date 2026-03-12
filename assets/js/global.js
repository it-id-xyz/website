document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const toggleIcon = menuToggle.querySelector('i');

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();     
        navMenu.classList.toggle('active');
        if (navMenu.classList.contains('active')) {
            toggleIcon.classList.replace('fa-bars', 'fa-times');
            navMenu.style.display = 'flex';
        } else {
            toggleIcon.classList.replace('fa-times', 'fa-bars');
        }
    });
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            navMenu.classList.remove('active');
            toggleIcon.classList.replace('fa-times', 'fa-bars');
        }
    });
    const currentPath = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll('.nav-menu a, .nav-btn a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath === href || (currentPath === "" && href === "index.html")) {
            link.style.color = "var(--bg-button)";
            if(link.querySelector('button')) {
                link.querySelector('button').style.color = "var(--bg-button)";
            }
        }
    });
});
