const path = require("path");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

const file = path.join(__dirname, "data/services.json");
const adapter = new JSONFile(file);

// ✅ Ajout d'une valeur par défaut vide : { }
const servicesDB = new Low(adapter, {});

async function getAllServices() {
  await servicesDB.read();
  servicesDB.data ||= {}; // 🛡️ S'assure que data existe toujours
  return servicesDB.data;
}

module.exports = { getAllServices };
