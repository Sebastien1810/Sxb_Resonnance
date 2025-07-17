const cron = require("node-cron");
const { worldDB, playersDB } = require("./db");

// ⏱️ Fonction utilitaire : choix aléatoire dans un tableau
function choisirAleatoire(tableau) {
  return tableau[Math.floor(Math.random() * tableau.length)];
}

// 📅 Saisons du jeu (10 jours chacune pour 1 cycle complet en 40 jours)
const saisons = ["printemps", "été", "automne", "hiver"];

// 🌤 Météos possibles selon la saison
const meteoPossible = {
  printemps: ["ensoleillé", "pluvieux", "vent frais", "couvert"],
  été: ["canicule", "ensoleillé", "orage", "lourd"],
  automne: ["pluvieux", "brouillard", "vent froid", "gris"],
  hiver: ["neige", "verglas", "froid glacial"],
};

// ⏰ Fonction principale du tick (1x par heure)
async function tickDuMonde() {
  await worldDB.read();
  await playersDB.read();

  // 📈 Incrémenter le jour
  worldDB.data.jour = (worldDB.data.jour || 1) + 1;

  // 🕓 Date IRL du tick
  worldDB.data.heureIRL = new Date().toISOString();

  // 🍂 Calculer la saison actuelle (10 jours par saison)
  const indexSaison = Math.floor((worldDB.data.jour - 1) / 10) % saisons.length;
  const saisonActuelle = saisons[indexSaison] || "printemps";
  worldDB.data.saison = saisonActuelle;

  // 🌦 Choisir une météo valide
  const meteoSaison = meteoPossible[saisonActuelle] || ["ensoleillé"];
  worldDB.data.météo = choisirAleatoire(meteoSaison);

  // 🎂 Vieillissement des joueurs (1 an tous les 30 jours)
  for (const id in playersDB.data) {
    const joueur = playersDB.data[id];
    const baseAge = joueur.ageInitial || 18;

    if (!joueur.ageInitial) {
      joueur.ageInitial = joueur.age || 18;
    }

    joueur.age = baseAge + Math.floor(worldDB.data.jour / 30);
  }

  await worldDB.write();
  await playersDB.write();

  console.log(
    `🕐 Tick : Jour ${worldDB.data.jour} - Saison ${saisonActuelle} - ${worldDB.data.météo}`
  );
}

// ⏳ Lancer la fonction toutes les heures pile
cron.schedule("0 * * * *", () => {
  tickDuMonde();
});

console.log("🕰️ Horloge du monde initialisée !");
