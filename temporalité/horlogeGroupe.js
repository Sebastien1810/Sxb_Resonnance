const cron = require("node-cron");
const { analyserGroupes } = require("../groupes");
const { worldDB } = require("../db");

function lancerTickGroupes(client) {
  cron.schedule("*/10 * * * *", async () => {
    console.log("⏱️ Analyse des groupes de population...");
    await worldDB.read();
    const monde = worldDB.data;
    if (monde) {
      analyserGroupes(client, monde);
    }
  });
  console.log("👥 Boucle d'analyse des groupes toutes les 10 minutes.");
}

module.exports = { lancerTickGroupes };
