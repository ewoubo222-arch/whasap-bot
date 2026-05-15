const fs = require("fs");

let makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion;

(async () => {
  const baileys = await import("@whiskeysockets/baileys");
  makeWASocket = baileys.default;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
  fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;

  startBot();
})();

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, pairingCode } = update;

    if (pairingCode) {
      console.log("========== TON CODE ==========");
      console.log(`Ton code de couplage : ${pairingCode}`);
      console.log("==============================");
    }

    if (connection === "open") {
      console.log("Connecté à WhatsApp ✅");
    }

    if (connection === "close") {
      console.log("Connexion fermée, reconnexion...");
      startBot();
    }
  });
} 