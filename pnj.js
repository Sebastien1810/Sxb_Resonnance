const { worldDB, pnjsDB } = require("./db");
const cron = require("node-cron");
const { genererNarrationPNJ } = require("./utils");

// ✅ Fonction de recrutement
function recruterSbire(spidicus) {
  const COUT_RECRUTEMENT = 15;
  if (spidicus.obsidienne < COUT_RECRUTEMENT) return null;

  const nomsDisponibles = ["Tox", "Grimm", "Nox", "Vex", "Razor", "Slice"];
  const rolesPossibles = ["intimidateur", "espion", "larcin", "trafiquant"];

  const sbire = {
    nom: nomsDisponibles[Math.floor(Math.random() * nomsDisponibles.length)],
    role: rolesPossibles[Math.floor(Math.random() * rolesPossibles.length)],
    etat: "actif",
    apparitions: 0,
    dateRecrutement: new Date().toISOString(),
  };

  spidicus.obsidienne -= COUT_RECRUTEMENT;
  spidicus.gang = spidicus.gang || [];
  spidicus.gang.push(sbire);

  return sbire;
}

// ✅ Fonction : chance de vol
function spidicusPeutVoler(spidicus, monde) {
  let chance = 30;

  if (monde.stats.securite < 50) {
    chance += 20;
  }

  if (spidicus.gang && spidicus.gang.length >= 3) {
    chance += 10;
  }

  const tirage = Math.random() * 100;
  return tirage < chance;
}

// ✅ Fonction : exécution du vol
function executerVolSpidicus(spidicus, monde) {
  let gain = Math.floor(Math.random() * 8) + 3; // 3 à 10 💠

  if (spidicus.gang && spidicus.gang.length >= 3) {
    gain = Math.floor(gain * 1.5);
  }

  spidicus.obsidienne = (spidicus.obsidienne || 0) + gain;
  monde.stats.crime = Math.min(100, (monde.stats.crime || 0) + 1.5);
  monde.stats.tensionSociale = Math.min(
    100,
    (monde.stats.tensionSociale || 0) + 0.3
  );

  const narrations = [
    `🕶️ Spidicus rôde dans les ruelles et subtilise quelques portefeuilles… (+${gain} 💠)`,
    `🖤 Profitant du relâchement de la sécurité, Spidicus frappe vite et disparaît. (+${gain} 💠)`,
    `🔪 Ses sbires harcèlent les passants… la police arrive trop tard. (+${gain} 💠)`,
  ];

  return narrations[Math.floor(Math.random() * narrations.length)];
}

function lancerTickPNJs(client) {
  cron.schedule("*/15 * * * *", () => {
    console.log("⏱️ tickPNJs lancé");
    tickPNJs(client);
  });
  console.log("🌀 Boucle PNJ active toutes les 15 minutes.");
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

    let canalNarration = null;
    try {
      canalNarration = await client.channels.fetch("1395384816588816425");
    } catch (error) {
      console.log("⚠️ Salon de narration introuvable :", error.message);
    }

    for (const id in pnjs) {
      const pnj = pnjs[id];
      if (!pnj.actif) continue;

      // 👥 SPIDICUS – GANG
      if (pnj.nom === "Spidicus") {
        // 🎯 Recrutement
        const nouveauSbire = recruterSbire(pnj);
        if (nouveauSbire && canalNarration) {
          await canalNarration.send(
            `🕶️ Spidicus a recruté un nouveau sbire : **${nouveauSbire.nom}**, un ${nouveauSbire.role} inquiétant...`
          );
        }

        // 💰 Vol automatique
        if (spidicusPeutVoler(pnj, monde)) {
          const texteVol = executerVolSpidicus(pnj, monde);
          if (canalNarration) await canalNarration.send(texteVol);
        }
      }

      // 🎭 Rôles PNJ classiques
      if (pnj.role === "délinquant") {
        monde.stats.crime = Math.min(100, (monde.stats.crime || 0) + 1.4);
        monde.stats.tensionSociale = Math.min(
          100,
          (monde.stats.tensionSociale || 0) + 0.2
        );
        pnj.reputation = (pnj.reputation || 0) + 1;
      }

      if (pnj.role.includes("policier")) {
        monde.stats.crime = Math.max(0, monde.stats.crime - 1.5);
        monde.stats.tensionSociale = Math.max(
          0,
          monde.stats.tensionSociale - 0.2
        );
        pnj.reputation = (pnj.reputation || 0) + 0.6;
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
