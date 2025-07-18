const { worldDB, pnjsDB } = require("./db");
const cron = require("node-cron");
const { genererNarrationPNJ } = require("./utils");

function lancerTickPNJs(client) {
  cron.schedule("*/15 * * * *", () => {
    console.log("⏱️ tickPNJs lancé");
    tickPNJs(client);
  });
  console.log("🌀 Boucle PNJ active toutes les minutes (debug).");
}

async function tickPNJs(client) {
  try {
    await pnjsDB.read();
    await worldDB.read();

    const monde = worldDB.data;
    const pnjs = pnjsDB.data;

    if (!monde || !monde.stats || !pnjs || Object.keys(pnjs).length === 0) {
      console.log("❌ Données PNJ ou monde manquantes.");
      return;
    }

    // 📡 Récupération du salon Discord
    let canalNarration = null;
    try {
      canalNarration = await client.channels.fetch("1395384816588816425");
    } catch (error) {
      console.log(
        "⚠️ Impossible de récupérer le salon de narration :",
        error.message
      );
    }

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

      if (canalNarration) {
        const messagePNJ = genererNarrationPNJ(pnj);
        console.log(`📣 PNJ ${pnj.nom} : ${messagePNJ}`);
        await canalNarration.send(messagePNJ);
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
