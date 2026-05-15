const express = require("express");
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("HELLO, WORLD!");
});

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "info" })
  });

  sock.ev.on("creds.update", saveCreds);
  
  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;
    
    if (qr) {
      console.log("SCANE CE QR CODE :");
      qrcode.generate(qr, { small: true });
      console.log("Ou ouvre ce lien sur ton téléphone et scanne :");
      console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
    }
    
    if (connection === "open") {
      console.log("✅ Bot connecté !");
    }
  });
}

startSock();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});