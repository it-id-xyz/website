
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
    chatBox.insertAdjacentHTML('beforeend',`
    <div class="message outgoing">
        <div class="bubble">${isiText}
            <span class="time">${jam}</span>
        </div>
    </div>`);
    
    await sleep(2000)
    chatBox.insertAdjacentHTML('beforeend',`
    <div class="message incoming">
        <div class="bubble">Waiting for response..
            <span class="time">${jam}</span>
        </div>
    </div>`);

    try {
        const response = await fetch('website/api/chat.js',{
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({question: isiText})
        });
        const data = await response.json();
        const lastMessage = chatBox.lastElementChild;
        if(data.error) {
            lastMessage.querySelector(".bubble").innerHTML = `${data.error} <span class="time">${jam}</span>`;
        } else {
            lastMessage.querySelector(".bubble").innerHTML = `${data.answer} <span class="time">${jam}</span>`;
        }
    } catch(error) {
        lastMessage.querySelector(".bubble").innerHTML = `Error jaringan, silahkan coba lagi <span class="time">${jam}</span>`;
    }
    inputText.value = '';
} 

btnSubmit.addEventListener('click', sendQuest);

