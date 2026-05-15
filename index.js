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
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);
  
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    
    if (!sock.authState.creds.registered) {
      const phoneNumber = "22870461278";
      const code = await sock.requestPairingCode(phoneNumber);
      console.log(`\n\n========== TON CODE ==========\n`);
      console.log(`Ton code de couplage : ${code}`);
      console.log(`\n==============================\n\n`);
    }
    
    if (connection === "open") {
      console.log("✅ Bot connecté !");
    }
    
    if (connection === "close") {
      console.log("Connexion fermée, redémarrage...");
      startSock();
    }
  });
}

startSock();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});