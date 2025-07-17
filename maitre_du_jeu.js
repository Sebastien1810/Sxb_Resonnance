const cron = require("node-cron");
const { worldDB } = require("./db");
const { Message } = require("discord.js");

async function paroleDuMaitre(client) {
  await worldDB.read();
  const monde = worldDB.data;

  //1 on crée un message narratif simple
  const message = `📜 *Le jour ${monde.jour} se lève. Le ciel est ${monde.météo} en ce début de ${monde.saison}.*`;

  //2.on trouve le salon #utopia(nom de la ville ou se deroule le jeux)
  const canalNarration = client.channels.cache.find(
    (channel) => channel.name === "utopia"
  );

  //3. on envoie le message
  if (canalNarration) {
    canalNarration.send(message);

    console.log("📢 Le maître du jeu a parlé.");
  } else {
    console.log("⚠️ Salon de narration 'utopia' introuvable.");
  }
}

function lancerNarrationAuto(client) {
  cron.schedule("*/10 * * * *", () => {
    paroleDuMaitre(client);
  });
  console.log("🕰️ Narration automatique activée toutes les 10 minutes.");
}
module.exports = { paroleDuMaitre, lancerNarrationAuto };
