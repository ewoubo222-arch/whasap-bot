import express from 'express';
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('WhatsApp Bot is running'));
app.listen(port, () => console.log(`Server running on port ${port}`));

async function startBot() {
  // Reset l'ancienne session pour éviter l'erreur 428
  if (fs.existsSync('./auth')) {
    fs.rmSync('./auth', { recursive: true, force: true });
    console.log('Ancienne session supprimée');
  }

  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    pairingCode: true
  });

  sock.ev.on('creds.update', saveCreds);

  if (!sock.authState.creds.registered) {
    const phoneNumber = process.env.PHONE_NUMBER;
    
    if (!phoneNumber) {
      console.log('ERREUR: Mets PHONE_NUMBER dans les variables d\'environnement');
      return;
    }
    
    console.log('Attente 10 sec avant de demander le code...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    try {
      const code = await sock.requestPairingCode(phoneNumber);
      console.log('==============================');
      console.log(`TON CODE : ${code}`);
      console.log('==============================');
    } catch (e) {
      console.log('Erreur pairing code:', e.output?.payload?.message || e.message);
    }
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    }
    if (connection === 'open') {
      console.log('Connecté à WhatsApp ✅');
    }
  });
}

startBot();