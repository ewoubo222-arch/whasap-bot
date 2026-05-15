import express from 'express';
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';

// 1. Serveur pour Render - évite "No open ports detected"
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('WhatsApp Bot is running'));
app.listen(port, () => console.log(`Server running on port ${port}`));

// 2. Fonction principale du bot
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false // on utilise le pairing code
  });

  sock.ev.on('creds.update', saveCreds);

  // 3. Demande le code à 8 chiffres si pas connecté
  if (!sock.authState.creds.registered) {
    const phoneNumber = process.env.PHONE_NUMBER; // ex: 221771234567
    if (!phoneNumber) {
      console.log('Mets ton numéro dans les variables d\'environnement PHONE_NUMBER sur Render');
      return;
    }
    const code = await sock.requestPairingCode(phoneNumber);
    console.log('==============================');
    console.log(`TON CODE : ${code}`);
    console.log('Va dans WhatsApp > Appareils connectés > Lier avec un numéro');
    console.log('==============================');
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    }