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

async function generateJWT(payload, secret) {
    const header = {
        alg: "HS256",
        typ: "JWT"
    };

    const base64UrlEncode = (str) => {
        const bytes = new TextEncoder().encode(str);
        let binString = "";
        for (let i = 0; i < bytes.length; i++) {
            binString += String.fromCharCode(bytes[i]);
        }
        return btoa(binString)
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    };

    const headerStr = base64UrlEncode(JSON.stringify(header));
    const payloadStr = base64UrlEncode(JSON.stringify(payload));
    const tokenInput = `${headerStr}.${payloadStr}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const data = encoder.encode(tokenInput);

    const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await window.crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        data
    );

    const signatureBytes = new Uint8Array(signature);
    let signatureBin = "";
    for (let i = 0; i < signatureBytes.length; i++) {
        signatureBin += String.fromCharCode(signatureBytes[i]);
    }
    const signatureStr = btoa(signatureBin)
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${tokenInput}.${signatureStr}`;
}

import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js").then(async ({ getAuth, onAuthStateChanged }) => {
    try {
        const { app, db } = await import("./firebase.js");
        const { doc, getDoc, updateDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const auth = getAuth(app);
        
        onAuthStateChanged(auth, async (user) => {
            const currentPath = window.location.pathname.split("/").pop() || "index.html";
            const allLinks = document.querySelectorAll('a');
            const loginLinks = Array.from(allLinks).filter(link => {
                const href = link.getAttribute('href');
                return href && (href.includes('login.html') || href.includes('admin_login.html'));
            });
            const logoutBtns = [document.getElementById('logout-btn'), document.getElementById('btn-logout')];
            
            if (user) {
                loginLinks.forEach(link => {
                    link.style.display = 'none';
                });
                
                logoutBtns.forEach(btn => {
                    if (btn) {
                        btn.style.display = 'block';
                        import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js").then(({ signOut }) => {
                            btn.onclick = (e) => {
                                e.preventDefault();
                                if (confirm("Yakin mau logout?")) {
                                    signOut(auth).then(() => {
                                        localStorage.removeItem('admin_token');
                                        if (currentPath === "admin.html" || currentPath === "admin-service.html") {
                                            window.location.href = "admin_login.html";
                                        } else {
                                            window.location.href = "login.html";
                                        }
                                    });
                                }
                            };
                        });
                    }
                });

                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists() && userDoc.data().role === "admin") {
                        const adminData = userDoc.data();
                        const customJwt = await generateJWT({
                            uid: user.uid,
                            role: "admin",
                            nama: adminData.nama || user.displayName || user.email
                        }, "secret-it-smansaci_3405");
                        
                        localStorage.setItem("admin_token", customJwt);
                        localStorage.setItem("adminEmail", user.email);

                        if (currentPath !== "admin.html" && currentPath !== "admin-service.html") {
                            await updateDoc(userDocRef, {
                                status: "offline",
                                lastSeen: serverTimestamp()
                            });
                        }
                    }
                } catch (err) {
                    console.error("Gagal cek admin/set offline:", err);
                }
                
                if (currentPath === "login.html") {
                    window.location.href = "index.html";
                } else if (currentPath === "admin_login.html") {
                    if (localStorage.getItem("admin_token")) {
                        window.location.href = "admin.html";
                    }
                }
            } else {
                loginLinks.forEach(link => {
                    link.style.display = '';
                });
                
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
