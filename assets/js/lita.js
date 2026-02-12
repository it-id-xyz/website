// --- INITIAL STATE ---
let allSessions = JSON.parse(localStorage.getItem('lita_v2_sessions')) || [];
let currentSessionId = null;

const ui = {
    chatBox: document.getElementById('chat-box'),
    input: document.getElementById('isi-text'),
    sidebar: document.getElementById('sidebar'),
    arrowToggle: document.getElementById('toggleSidebar'),
    historyList: document.getElementById('history-list')
}

const savedState = localStorage.getItem('sidebar_state');
if(savedState === 'true'){
    ui.sidebar.classList.add('collapsed');
    ui.arrowToggle.innerText = '>';
}

ui.arrowToggle.addEventListener('click', () => {
    ui.sidebar.classList.toggle('collapsed');
    if (ui.sidebar.classList.contains('collapsed')) {
        ui.arrowToggle.innerText = '>';
    } else {
        ui.arrowToggle.innerText = '<';
    }
 });
const menuToggle = document.getElementById('menuToggle');
if(menuToggle){
    menuToggle.addEventListener('click', () => {
        ui.sidebar.classList.toggle('active');
        localStorage.setItem('sidebar_state', ui.sidebar.classList.contains('collapsed'));
    });
}
ui.chatBox.addEventListener('click', () => {
    if (window.innerWidth < 768) {
        ui.sidebar.classList.remove('active');
    }
});

ui.chatBox.addEventListener('click', () => {
    if (ui.sidebar.classList.contains('active')) {
        ui.sidebar.classList.remove('active');
        ui.arrowIcon.innerText = '<';
    }
});

function hideWelcome() {
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.remove();
}

// --- CORE FUNCTIONS ---
function renderHistory() {
    ui.historyList.innerHTML = allSessions.map(s => {
        const activeClass =
            s.id === currentSessionId ? 'active' : '';
        return `
        <div class="history-item ${activeClass}"
             onclick="loadSession(${s.id})">
            <i class="fa-regular fa-comment"></i>
            <span>${s.title}</span>
        </div>
        `;
    }).join('');
}


function newChat() {
    currentSessionId = Date.now();
    ui.chatBox.innerHTML = `
        <div id="welcome-screen" class="welcome-card">
            <img src="logo-it.png" class="ai-logo">
            <h1>Lita AI</h1>
            <span class="ai-version">v2.5 Stable</span>
            <div class="guide-grid">
                <div class="guide-item">Pintar</div>
                <div class="guide-item">Cepat</div>
            </div>
        </div>
    `;
    if(window.innerWidth < 768) {
        ui.sidebar.classList.remove('active');
        ui.arrowIcon.innerText = '<';
    }
    renderHistory();
}

function saveUserPersona() {
    const name = prompt("Siapa nama kamu?");
    const info = prompt("Ceritakan hobimu/hal yang ingin Lita tahu:");
    if(name) {
        localStorage.setItem('user_persona', JSON.stringify({ name, info }));
        alert(`Halo ${name}, Lita siap mengingatmu!`);
    }
}

function btnCopy(block) {
    const button = document.createElement('button');
    button.innerText = 'Copy';
    button.className = 'copy-btn';
    block.parentNode.style.position = 'relative';
    block.parentNode.appendChild(button);

    button.addEventListener('click', () => {
        navigator.clipboard.writeText(block.innerText);
        button.innerText = 'Copied!';
        setTimeout(() => button.innerText = 'Copy', 2000);
    });
}

// --- SEND & CHAT LOGIC ---

async function sendQuest() {
    const msg = ui.input.value.trim();
    if (!msg) return;

    hideWelcome();
    
    const now = new Date();
    const jam = `${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}`;
    if (!currentSessionId) currentSessionId = Date.now();
    ui.chatBox.insertAdjacentHTML('beforeend', `
        <div class="message outgoing">
            <div class="bubble">${msg}<span class="time">${jam}</span></div>
        </div>
    `);
    
    ui.input.value = '';
    ui.chatBox.insertAdjacentHTML('beforeend', `
        <div class="message incoming">
            <div class="bubble">
                <div class="loading-pulse">Lita sedang berpikir...</div>
                <span class="time">${jam}</span>
            </div>
        </div>
    `);

    const lastBubble = ui.chatBox.lastElementChild.querySelector(".bubble");
    ui.chatBox.scrollTop = ui.chatBox.scrollHeight;

    const persona = JSON.parse(localStorage.getItem('user_persona')) || null;

    try {
        const response = await fetch('https://api.it-smansaci.my.id/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                pesan: msg,
                context: persona 
            })
        });

        const data = await response.json();
        
        if (data.error) {
            lastBubble.innerHTML = `${data.error} <span class="time">${jam}</span>`;
        } else {
            const jawaban = data.jawaban;
            let index = 0;
            lastBubble.innerHTML = `<div class="markdown-content"></div> <span class="time">${jam}</span>`;
            const contentDiv = lastBubble.querySelector(".markdown-content");

            function typeWriter() {
                if (index <= jawaban.length) {
                    contentDiv.innerHTML = marked.parse(jawaban.substring(0, index));
                    index++;
                    ui.chatBox.scrollTop = ui.chatBox.scrollHeight;
                    setTimeout(typeWriter, 10); 
                } else {
                    contentDiv.querySelectorAll('pre code').forEach((block) => {
                        if (typeof hljs !== 'undefined') hljs.highlightElement(block);
                        btnCopy(block);
                    });
                    saveSession(msg, jawaban);
                }
            }
            typeWriter();
        }
    } catch (error) {
        lastBubble.innerHTML = `Gagal terhubung ke Lita. <span class="time">${jam}</span>`;
    }
}

function saveSession(userMsg, aiMsg) {
    let session = allSessions.find(s => s.id === currentSessionId);
    if (!session) {
        const title = userMsg.length > 25 ? userMsg.substring(0, 25) + '...' : userMsg;
        session = { id: currentSessionId, title: title, messages: [] };
        allSessions.unshift(session);
    }
    session.messages.push({ userMsg, aiMsg });
    localStorage.setItem('lita_v2_sessions', JSON.stringify(allSessions));
    renderHistory();
}

function loadSession(id) {
    const session = allSessions.find(s => s.id === id);
    if (!session) return;
    
    currentSessionId = id;
    hideWelcome();
    ui.chatBox.innerHTML = '';
    
    session.messages.forEach(m => {
        ui.chatBox.insertAdjacentHTML('beforeend', `
            <div class="message outgoing"><div class="bubble">${m.userMsg}</div></div>
            <div class="message incoming"><div class="bubble">${marked.parse(m.aiMsg)}</div></div>
        `);
    });
    
    ui.chatBox.querySelectorAll('pre code').forEach(block => {
        if (typeof hljs !== 'undefined') hljs.highlightElement(block);
        btnCopy(block);
    });
    renderHistory();

    ui.chatBox.scrollTop = ui.chatBox.scrollHeight;
    if(window.innerWidth < 768) {
        ui.sidebar.classList.remove('active');
        ui.arrowIcon.innerText = '<';
    }
    if (window.innerWidth < 768) {
    ui.sidebar.classList.remove('active');
    }

}

// --- EVENT LISTENERS ---
document.getElementById('send-btn').addEventListener('click', sendQuest);
ui.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendQuest();
});



