const cron = require("node-cron");
const { worldDB } = require("./db");

// Fonction principale qui fait parler le Maître du Jeu
async function paroleDuMaitre(client) {
  await worldDB.read();
  const monde = worldDB.data;

  const jour = monde.jour;
  const saison = monde.saison;
  const meteo = monde.météo;
  const dernierJourAnnonce = monde.dernierJourAnnonce || 0;

  let message = "";

  // Si c’est un nouveau jour → on annonce le jour
  if (jour > dernierJourAnnonce) {
    message = `📜 *Le jour ${jour} se lève. Le ciel est ${meteo} en ce début de ${saison}.*`;

    // On met à jour le dernier jour annoncé
    monde.dernierJourAnnonce = jour;
    await worldDB.write();
  } else {
    // Sinon → message narratif générique
    message = `*Le Maître du Jeu observe le monde en silence...*`;
  }

  // On récupère le salon #utopia
  const canalNarration = client.channels.cache.find(
    (channel) => channel.name === "utopia"
  );

  // On envoie le message si le salon existe
  if (canalNarration) {
    canalNarration.send(message);
    console.log("📢 Le maître du jeu a parlé.");
  } else {
    console.log("⚠️ Salon de narration 'utopia' introuvable.");
  }
}

// Fonction de lancement automatique toutes les 10 minutes
function lancerNarrationAuto(client) {
  cron.schedule("*/10 * * * *", () => {
    paroleDuMaitre(client);
  });
  console.log("🕰️ Narration automatique activée toutes les 10 minutes.");
}

module.exports = { paroleDuMaitre, lancerNarrationAuto };
