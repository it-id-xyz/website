const btnSubmit = document.getElementById('send-btn');
const now = new Date();

function btnCopy(block) {
    const button = document.createElement('button');
    button.innerText = 'Copy';
    button.className = 'copy-btn';
    
    // Taruh tombol di atas blok kode
    block.parentNode.style.position = 'relative';
    block.parentNode.appendChild(button);

    button.addEventListener('click', () => {
        navigator.clipboard.writeText(block.innerText);
        button.innerText = 'Copied!';
        setTimeout(() => button.innerText = 'Copy', 2000);
    });
}

async function sendQuest() {
    const jam = `${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}`;
    const inputText = document.getElementById('isi-text');
    const isiText = inputText.value;
    inputText.value = '';

    if(isiText.trim() === '') {
        alert('error, harap isi teks');
        return;
    }

    const chatBox = document.getElementById('chat-box');
    chatBox.insertAdjacentHTML('beforeend',`
    <div class="message outgoing">
        <div class="bubble">${isiText}
            <span class="time">${jam}</span>
        </div>
    </div>`);
    
    chatBox.insertAdjacentHTML('beforeend',`
    <div class="message incoming">
        <div class="bubble">Waiting for response..
            <span class="time">${jam}</span>
        </div>
    </div>`);

    const lastMessage = chatBox.lastElementChild;
    try {
        const response = await fetch('https://api.it-smansaci.my.id/chat',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({pesan: isiText})
        });
        const data = await response.json();
        if(data.error) {
            lastMessage.querySelector(".bubble").innerHTML = `${data.error} <span class="time">${jam}</span>`;
        } else {
            const htmlJawaban = marked.parse(data.jawaban);
            lastMessage.querySelector(".bubble").innerHTML = `<div class="markdown-content">${htmlJawaban}</div> <span class="time">${jam}</span>`;
            lastMessage.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
                btnCopy(block);
            }
        };
    } catch(error) {
        lastMessage.querySelector(".bubble").innerHTML = `Error jaringan, silahkan coba lagi <span class="time">${jam}</span>`;
    }
    chatBox.scrollTop = chatBox.scrollHeight;
} 

btnSubmit.addEventListener('click', sendQuest);


