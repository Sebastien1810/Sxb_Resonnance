const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const path = require("path");

// 🎮 Base des joueurs
const playerFile = path.join(__dirname, "data/players.json");
const playerAdapter = new JSONFile(playerFile);
const playersDB = new Low(playerAdapter, {}); // Valeur par défaut vide

// 🌍 Base du monde
const worldFile = path.join(__dirname, "data/world.json");
const worldAdapter = new JSONFile(worldFile);
const worldDB = new Low(worldAdapter, {
  jour: 1,
  saison: "printemps",
  météo: "ensoleillé",
  heureIRL: new Date().toISOString(),
  événements: [],
});

// 🛠️ Initialisation
async function initDB() {
  await playersDB.read();
  playersDB.data ||= {};
  await playersDB.write();

  await worldDB.read();
  worldDB.data ||= {
    jour: 1,
    saison: "printemps",
    météo: "ensoleillé",
    heureIRL: new Date().toISOString(),
    événements: [],
  };
  await worldDB.write();
}

module.exports = {
  playersDB,
  worldDB,
  initDB,
};
