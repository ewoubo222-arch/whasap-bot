const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcodeImg = require('qrcode');

let firstRun = true;
const BOT_NUMBER = '22890470689'; // Ton numéro avec indicatif Togo

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr && firstRun) {
      firstRun = false;
      console.log('Génération du QR...');

      const qrImage = await qrcodeImg.toBuffer(qr);
      await sock.sendMessage(BOT_NUMBER + '@s.whatsapp.net', {
        image: qrImage,
        caption: 'Scan ce QR code avec WhatsApp > Appareils connectés'
      });

      console.log('QR envoyé sur WhatsApp!');
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('Bot connecté à WhatsApp ✅');
      await sock.sendMessage(BOT_NUMBER + '@s.whatsapp.net', { text: 'Bot connecté ✅ Tape!ping pour tester' });
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (text === '!ping') {
      await sock.sendMessage(msg.key.remoteJid, { text: 'Pong 🏓' });
    }
  });
}

startBot();