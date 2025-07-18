const { worldDB, pnjsDB } = require("./db");
const cron = require("node-cron");

function lancerTickPNJs(client) {
  cron.schedule("*/20 * * * *", () => {
    tickPNJs(client);
  });
  console.log("🌀 Boucle PNJ active toutes les 20 minutes.");
}

async function tickPNJs(client) {
  try {
    await pnjsDB.read();
    await worldDB.read();

    const monde = worldDB.data;
    const pnjs = pnjsDB.data;

    if (!pnjs || !monde.stats) return;

    for (const id in pnjs) {
      const pnj = pnjs[id];
      if (!pnj.actif) continue;

      if (pnj.role === "délinquant") {
        monde.stats.crime = Math.min(100, (monde.stats.crime || 0) + 0.4);
        monde.stats.tensionSociale = Math.min(
          100,
          (monde.stats.tensionSociale || 0) + 0.2
        );
        pnj.reputation = (pnj.reputation || 0) + 1;
      }

      if (pnj.role.includes("infirmière")) {
        monde.stats.santePublique = Math.min(
          100,
          (monde.stats.santePublique || 0) + 0.3
        );
        pnj.reputation = (pnj.reputation || 0) + 0.5;
      }
    }

    await worldDB.write();
    await pnjsDB.write();
    console.log("✅ Les PNJ ont influencé le monde.");
  } catch (error) {
    console.error("💥 Erreur dans tickPNJs :", error);
  }
}

module.exports = { lancerTickPNJs };
