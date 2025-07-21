const cron = require("node-cron");
const { worldDB, playersDB } = require("../db");

// 🔁 Choix aléatoire dans un tableau
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

async function tickDuMonde() {
  await worldDB.read();
  await playersDB.read();

  // Initialisation des stats si absentes
  if (!worldDB.data.stats) {
    worldDB.data.stats = {
      crime: 20,
      tensionSociale: 20,
      chômage: 15,
      santePublique: 80,
      economie: 50,
      tourisme: 25,
      ecologie: 45,
    };
  }

  worldDB.data.jour = (worldDB.data.jour || 1) + 1;
  worldDB.data.heureIRL = new Date().toISOString();

  const indexSaison = Math.floor((worldDB.data.jour - 1) / 10) % saisons.length;
  worldDB.data.saison = saisons[indexSaison];

  const meteo = choisirAleatoire(
    meteoPossible[worldDB.data.saison] || ["ensoleillé"]
  );
  worldDB.data.météo = meteo;

  for (const id in playersDB.data) {
    const joueur = playersDB.data[id];
    joueur.ageInitial ??= joueur.age || 18;
    joueur.age = joueur.ageInitial + Math.floor(worldDB.data.jour / 30);
  }

  await worldDB.write();
  await playersDB.write();

  console.log(
    `🕐 Tick : Jour ${worldDB.data.jour} - ${worldDB.data.saison} - ${worldDB.data.météo}`
  );
}

// Tick du monde chaque heure
cron.schedule("0 * * * *", () => {
  tickDuMonde();
});

console.log("🕰️ Horloge du monde initialisée !");
module.exports = { tickDuMonde };
