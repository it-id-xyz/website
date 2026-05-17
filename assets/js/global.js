// Theme Initialization
const currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);

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
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll('.nav-menu a, .nav-btn a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (currentPath === href || (currentPath === "" && href === "index.html"))) {
            link.classList.add('active');
            link.style.color = "var(--bg-button)";
        }
    });

    // Theme Toggle Logic
    const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
    
    function updateThemeIcon() {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        themeToggleBtns.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                if (isLight) {
                    icon.classList.replace('fa-sun', 'fa-moon');
                } else {
                    icon.classList.replace('fa-moon', 'fa-sun');
                }
            }
        });
    }
    
    updateThemeIcon();

    themeToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme');
            let newTheme = theme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon();
        });
    });
});
