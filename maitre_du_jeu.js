const cron = require("node-cron");
const { worldDB } = require("./db");
const { genererNarration, appliquerEffets } = require("./utils");

async function paroleDuMaitre(client) {
  console.log("⏱️ Tick de narration déclenché !");
  await worldDB.read();
  const monde = worldDB.data;

  const { jour, saison, météo, dernierJourAnnonce = 0 } = monde;
  let message = "";

  if (jour > dernierJourAnnonce) {
    message = `📜 *Le jour ${jour} se lève. Météo ${météo} en ce début de ${saison}.*`;
    monde.dernierJourAnnonce = jour;
  } else {
    message = genererNarration(monde);
  }

  let canalNarration = null;
  try {
    canalNarration = await client.channels.fetch("1395384816588816425");
  } catch (error) {
    console.log("⚠️ Salon de narration introuvable :", error.message);
    return;
  }

  if (canalNarration) {
    await canalNarration.send(message);
    appliquerEffets(monde);
    await worldDB.write();
    console.log("📢 Le maître du jeu a parlé.");
  }
}

function lancerNarrationAuto(client) {
  cron.schedule("*/10 * * * *", () => {
    paroleDuMaitre(client);
  });
  console.log("🕰️ Narration automatique activée toutes les 10 minutes.");
}

module.exports = { paroleDuMaitre, lancerNarrationAuto };
