import axios from 'axios'; 

export default async function handler(req, res) { 
  if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).end();
        return;
    }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  const alamatIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress; 
  if (!global.maxReq) global.maxReq = {}; 
  if (!global.maxReq[alamatIP]) global.maxReq[alamatIP] = { jumlah: 0, resetWaktu: Date.now() };
  const time = Date.now();
  if (time - global.maxReq[alamatIP].resetWaktu > 60000) {  
    global.maxReq[alamatIP] = { jumlah: 0, resetWaktu: time };
  }
  if (global.maxReq[alamatIP].jumlah >= 5) { 
    return res.status(429).json({ error: 'Terlalu banyak permintaan, tunggu sebentar ya.' });
  }
  global.maxReq[alamatIP].jumlah++; 

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Ada masalah di server, coba lagi nanti.' });

  const { question } = req.body; 
  if (!question) return res.status(400).json({ error: 'Pertanyaan harus diisi dong!' });

  try {
    // Kirim pertanyaan ke API xAI (Grok)
    const responsAPI = await axios.post('https://api.x.ai/v1/chat', {
      prompt: question, 
      max_tokens: 150,  
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`, 
        'Content-Type': 'application/json'
      }
    });
    // Kirim jawaban balik ke user
    res.json({ answer: responsAPI.data.response });
  } catch (error) {
    console.error('Error di API:', error.message);  // Log error buat debug
    res.status(500).json({ error: 'AI lagi error, maaf ya. Coba lagi.' });
  }
}
