const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const express = require('express')
const pino = require('pino')

const app = express()
const port = process.env.PORT || 10000

app.get('/', (req, res) => {
  res.send('WhatsApp Bot is running ✅')
})

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update
    
    if (qr) {
      console.log("QR:", qr)
    }
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut)
      if (shouldReconnect) startBot()
    }
    
    if (connection === 'open') {
      console.log('Connecté à WhatsApp ✅')
    }
  })

  sock.ev.on('creds.update', saveCreds)
}

startBot()

app.listen(port, () => {
  console.log('HELLO, WORLD!')
  console.log(`Server running on port ${port}`)
}) 