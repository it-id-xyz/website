
const btnSubmit = document.getElementById('send-btn');
const now = new Date();
const jam = `${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}`;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendQuest() {
    const inputText = document.getElementById('isi-text');
    const isiText = inputText.value;

    if(isiText.trim() === '') {
        alert('error, harap isi teks');
        return;
    }

    const chatBox = document.getElementById('chat-box');
    const cardText = document.createElement('div');
    cardText.innerHTML = `
    <div class="message incoming">
        <div class="bubble">${isiText}
            <span class="time">${jam}</span>
        </div>
    </div>`;
    chatBox.appendChild(cardText);
    
    await sleep(2000)
    cardText.innerHTML += `
    <div class="message outgoing">
        <div class="bubble">Waiting for response..
            <span class="time">${jam}</span>
        </div>
    </div>`;
    chatBox.appendChild(cardText);

    try {
        const response = await fetch('/api/chat.js',{
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({question: isiText})
        });
        const data = await response.json();
        if(data.error) {
            cardText.innerHTML = `
            <div class="message outgoing">
                <div class="bubble">${data.error}
                <span class="time">${jam}</span>
                </div>
            </div>`;
            chatBox.appendChild(cardText);
        } else {
            cardText.innerHTML = `
            <div class="message outgoing">
                <div class="bubble">${data.answer}
                <span class="time">${jam}</span>
                </div>
            </div>`;
            chatBox.appendChild(cardText);
        }
    } catch(error) {
        cardText.innerHTML = `
        <div class="message outgoing">
            <div class="bubble">Error jaringan, coba lagi ya
            <span class="time">${jam}</span>
            </div>
        </div>`;
        chatBox.appendChild(cardText);
    }
    inputText.value = '';
} 

btnSubmit.addEventListener('click', sendQuest);

    





