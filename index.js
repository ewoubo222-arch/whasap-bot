const express = require("express");
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
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
    printQRInTerminal: false,
    logger: pino({ level: "info" })
  });

  sock.ev.on("creds.update", saveCreds);
  
  sock.ev.on("connection.update", async (update) => {
    const { connection } = update;
    
    if (!sock.authState.creds.registered) {
      const phoneNumber = "22890470689";
      const code = await sock.requestPairingCode(phoneNumber);
      console.log("CODE D'APPAIRAGE:", code);
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