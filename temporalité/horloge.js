const cron = require("node-cron");
const { worldDB, playersDB, pnjsDB } = require("../db");
const { entretenirGang } = require("../pnj");
const { declencherHappening } = require("../happeningsManager");

function choisirAleatoire(tableau) {
  return tableau[Math.floor(Math.random() * tableau.length)];
}

const saisons = ["printemps", "été", "automne", "hiver"];
const meteoPossible = {
  printemps: ["ensoleillé", "pluvieux", "couvert"],
  été: ["ensoleillé", "orageux", "lourd"],
  automne: ["pluvieux", "couvert avec beaucoup de brouillard", "gris"],
  hiver: ["enneigé", "d'un froid glacial"],
};

async function tickDuMonde(client) {
  await worldDB.read();
  await playersDB.read();
  await pnjsDB.read();

  const monde = worldDB.data;

  // Initialisation des stats si absentes
  if (!monde.stats) {
    monde.stats = {
      crime: 20,
      tensionSociale: 20,
      chômage: 15,
      santePublique: 80,
      economie: 50,
      tourisme: 25,
      ecologie: 45,
    };
  }

  monde.jour = (monde.jour || 1) + 1;
  monde.heureIRL = new Date().toISOString();

  const indexSaison = Math.floor((monde.jour - 1) / 10) % saisons.length;
  monde.saison = saisons[indexSaison];
  monde.météo = choisirAleatoire(meteoPossible[monde.saison]);

  for (const id in playersDB.data) {
    const joueur = playersDB.data[id];
    joueur.ageInitial ??= joueur.age || 18;
    joueur.age = joueur.ageInitial + Math.floor(monde.jour / 30);
  }

  // ✅ Entretien du gang de Spidicus tous les 30 jours
  if (monde.jour % 30 === 0) {
    const spidicus = Object.values(pnjsDB.data).find(
      (p) => p.nom === "Spidicus"
    );
    if (spidicus) {
      const { message } = entretenirGang(spidicus);
      console.log(`💼 Entretien du gang : ${message}`);

      try {
        const canal = await client.channels.fetch("1395384816588816425");
        if (canal) await canal.send(`📆 Fin de mois : ${message}`);
      } catch (err) {
        console.log("⚠️ Erreur canal narration :", err.message);
      }

      await pnjsDB.write();
    }
  }

  await worldDB.write();
  await playersDB.write();

  console.log(
    `🕐 Tick : Jour ${monde.jour} - ${monde.saison} - ${monde.météo}`
  );
}

// ⏰ Tick du monde toutes les heures
cron.schedule("0 * * * *", () => {
  tickDuMonde(global.client);
});

// 🎭 Happening toutes les 2 heures
cron.schedule("0 */2 * * *", () => {
  console.log("🎭 Tentative de déclenchement de happening...");
  declencherHappening(global.client);
});

console.log("🕰️ Horloge du monde initialisée !");
module.exports = { tickDuMonde };
