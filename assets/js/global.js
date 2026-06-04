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

// Hide login/logout links dynamically based on Auth state
import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js").then(async ({ getAuth, onAuthStateChanged }) => {
    try {
        const { app } = await import("./firebase.js");
        const auth = getAuth(app);
        
        onAuthStateChanged(auth, (user) => {
            const currentPath = window.location.pathname.split("/").pop() || "index.html";
            const allLinks = document.querySelectorAll('a');
            const loginLinks = Array.from(allLinks).filter(link => {
                const href = link.getAttribute('href');
                return href && (href.includes('login.html') || href.includes('admin_login.html'));
            });
            const logoutBtns = [document.getElementById('logout-btn'), document.getElementById('btn-logout')];
            
            if (user) {
                // User is logged in, hide all login links/buttons
                loginLinks.forEach(link => {
                    link.style.display = 'none';
                });
                
                // Show logout buttons
                logoutBtns.forEach(btn => {
                    if (btn) {
                        btn.style.display = 'block';
                        import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js").then(({ signOut }) => {
                            btn.onclick = (e) => {
                                e.preventDefault();
                                signOut(auth).then(() => {
                                    localStorage.removeItem('admin_token');
                                    window.location.href = "login.html";
                                });
                            };
                        });
                    }
                });
                
                // If on login.html or admin_login.html, redirect
                if (currentPath === "login.html") {
                    window.location.href = "index.html";
                } else if (currentPath === "admin_login.html") {
                    if (localStorage.getItem("admin_token")) {
                        window.location.href = "admin.html";
                    }
                }
            } else {
                // User is not logged in, show login links
                loginLinks.forEach(link => {
                    link.style.display = '';
                });
                
                // Hide logout buttons
                logoutBtns.forEach(btn => {
                    if (btn) {
                        btn.style.display = 'none';
                    }
                });
            }
        });
    } catch (err) {
        console.error("Firebase auth check error:", err);
    }
});
