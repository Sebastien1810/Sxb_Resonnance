const cron = require("node-cron");
const { worldDB } = require("./db");
const { genererNarration, appliquerEffets } = require("./utils");

// Fonction principale qui fait parler le Maître du Jeu
async function paroleDuMaitre(client) {
  console.log("⏱️ Tick de narration déclenché !");
  await worldDB.read();
  const monde = worldDB.data;

  const jour = monde.jour;
  const saison = monde.saison;
  const meteo = monde.météo;
  const dernierJourAnnonce = monde.dernierJourAnnonce || 0;

  let message = "";

  // Si c’est un nouveau jour → on annonce le jour
  if (jour > dernierJourAnnonce) {
    message = `📜 *Le jour ${jour} se lève. Météo ${meteo} en ce début de ${saison}.*`;
    monde.dernierJourAnnonce = jour;
  } else {
    message = genererNarration(monde);
  }

  // On tente de récupérer le salon par ID
  let canalNarration = null;
  try {
    canalNarration = await client.channels.fetch("1395384816588816425");
  } catch (error) {
    console.log(
      "⚠️ Impossible de récupérer le salon de narration :",
      error.message
    );
  }

  // Si le salon existe → on envoie le message
  if (canalNarration) {
    canalNarration.send(message);
    appliquerEffets(monde);
    await worldDB.write();
    console.log("📢 Le maître du jeu a parlé.");
  } else {
    console.log("⚠️ Salon de narration introuvable.");
  }
}

// Lancer automatiquement toutes les 10 minutes
function lancerNarrationAuto(client) {
  cron.schedule("*/10 * * * *", () => {
    paroleDuMaitre(client);
  });
  console.log("🕰️ Narration automatique activée toutes les 10 minutes.");
}

module.exports = { paroleDuMaitre, lancerNarrationAuto };
