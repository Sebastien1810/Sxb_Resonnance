const { worldDB } = require("../db");
const { verifierEvenements } = require("../evenementsSystem");
const cron = require("node-cron");

function lancerTickEvenements(client) {
  cron.schedule("*/25 * * * *", async () => {
    await worldDB.read();
    await verifierEvenements(client);
  });
  console.log("boucle évenement active toute les 25min");
}
module.exports = { lancerTickEvenements };
