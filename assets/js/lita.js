const btnSubmit = document.getElementById('send-btn');


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
    const now = new Date();
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
        <div class="bubble">
        <div class="loading-pulse">Waiting for response..</div>
            <span class="time">${jam}</span>
        </div>
    </div>`);
    
    const lastMessage = chatBox.lastElementChild;
    const bubbleElement = lastMessage.querySelector(".bubble");
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
            bubbleElement.innerHTML = `${data.error} <span class="time">${jam}</span>`;
        } else {
            
            const htmlJawaban = data.jawaban;
            let index = 0;
            bubbleElement.innerHTML = `<div class="markdown-content"></div> <span class="time">${jam}</span>`;
            const contentDiv = bubbleElement.querySelector(".markdown-content");
            
            function typeWriter() {
                if (index < htmlJawaban.length) {
                    index++;
                    contentDiv.innerHTML = marked.parse(htmlJawaban.substring(0, index));
                    chatBox.scrollTop = chatBox.scrollHeight;
                    setTimeout(typeWriter,10);
                } else {
                    contentDiv.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightElement(block);
                        if (typeof btnCopy === "function") btnCopy(block);
                    });
                }
            }
            typeWriter();
        }
    } catch(error) {
        bubbleElement.innerHTML = `Error jaringan, silahkan coba lagi <span class="time">${jam}</span>`;
    }
    chatBox.scrollTop = chatBox.scrollHeight;
} 

btnSubmit.addEventListener('click', sendQuest);






