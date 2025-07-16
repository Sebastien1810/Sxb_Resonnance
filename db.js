const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const path = require("path");

// Adaptateur
const file = path.join(__dirname, "data/players.json");
const adapter = new JSONFile(file);
const playersDB = new Low(adapter, {});

// Initialiser avec données vides si besoin
async function initDB() {
  await playersDB.read();
  playersDB.data ||= {};
  await playersDB.write();
}

module.exports = {
  playersDB,
  initDB,
};
