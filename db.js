const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const path = require("path");

// 📁 Fichiers JSON
const pnjsFile = path.join(__dirname, "data/pnjs.json");
const playersFile = path.join(__dirname, "data/players.json");
const worldFile = path.join(__dirname, "data/world.json");

// 🧠 Adapters
const pnjsAdapter = new JSONFile(pnjsFile);
const playerAdapter = new JSONFile(playersFile);
const worldAdapter = new JSONFile(worldFile);

// 🗃️ Bases de données LowDB
const pnjsDB = new Low(pnjsAdapter, {});
const playersDB = new Low(playerAdapter, {});
const worldDB = new Low(worldAdapter, {
  jour: 1,
  saison: "printemps",
  météo: "ensoleillé",
  heureIRL: new Date().toISOString(),
  stats: {
    crime: 20,
    tensionSociale: 20,
    chômage: 15,
    santePublique: 80,
    economie: 50,
    tourisme: 25,
    ecologie: 45,
  },
});

async function initDB() {
  await playersDB.read();
  playersDB.data ||= {};
  await playersDB.write();

  await pnjsDB.read();
  pnjsDB.data ||= {};
  await pnjsDB.write();

  await worldDB.read();
  worldDB.data ||= {
    jour: 1,
    saison: "printemps",
    météo: "ensoleillé",
    heureIRL: new Date().toISOString(),
    stats: {
      crime: 20,
      tensionSociale: 20,
      chômage: 15,
      santePublique: 80,
      economie: 50,
      tourisme: 25,
      ecologie: 45,
    },
  };
  await worldDB.write();
}

module.exports = {
  pnjsDB,
  playersDB,
  worldDB,
  initDB,
};
