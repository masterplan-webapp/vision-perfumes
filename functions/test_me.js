const fetch = require('node-fetch');

async function getMe() {
    // We need the token. I will fetch it from settings or just ask the user?
    // Wait, I can read it from the firebase firestore using admin sdk!
    const { initializeApp } = require('firebase-admin/app');
    const { getFirestore } = require('firebase-admin/firestore');
    
    initializeApp();
    const db = getFirestore();
    
    const settingsDoc = await db.collection('settings').doc('global').get();
    const settings = settingsDoc.data();
    const token = settings.melhorEnvioToken;
    const isSandbox = settings.melhorEnvioSandbox;
    
    const baseUrl = isSandbox ? "https://sandbox.melhorenvio.com.br" : "https://www.melhorenvio.com.br";
    
    const res = await fetch(`${baseUrl}/api/v2/me`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "User-Agent": "Vision Perfumes (contato@visionperfumes.com.br)"
        }
    });
    
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

getMe().catch(console.error);
