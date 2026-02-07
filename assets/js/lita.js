
const btnSubmit = document.getElementById('send-btn');
const now = new Date();
const jam = `${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}`;

async function sendQuest() {
    const inputText = document.getElementById('isi-text');
    const isiText = inputText.value;

    if(isiText.trim() === '') {
        alert('error, harap isi teks');
        return;
    }

    const chatBox = document.getElementById('chat-box');
    chatBox.innerHtML = `
    <div class="message outgoing">
        <div class="bubble">${isiText}
            <span class="time">${jam}</span>
        </div>
    </div>`;
    
    chatBox.innerHTML = `
    <div class="message incoming">
        <div class="bubble">Waiting for response..
            <span class="time">${jam}</span>
        </div>
    </div>`;

    try {
        const response = await fetch('api/chat.js',{
            method: 'POST',
            header: {
                'content-type': 'aplication/json'
            },
            body: JSON.stringify({question: userQuestion})
        });
        const data = await response.json();
        if(data.error) {
            chatBox.innerHTML = `
            <div class="message incoming">
                <div class="bubble">${data.error}
                <span class="time">${jam}</span>
                </div>
            </div>`;
        } else {
            chatBox.innerHTML = `
            <div class="message incoming">
                <div class="bubble">${data.answer}
                <span class="time">${jam}</span>
                </div>
            </div>`;
        }
    } catch(error) {
        chatBox.innerHTML = `
        <div class="message incoming">
            <div class="bubble">Error jaringan, coba lagi ya
            <span class="time">${jam}</span>
            </div>
        </div>`;
    }
    inputText.value = '';
} 

btnSubmit.addEventListener('click', sendQuest);

    

