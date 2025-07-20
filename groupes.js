const { JSONFile, Low } = require("lowdb");
const path = require("path");

const file = path.join(__dirname, "data/populations.json");
const adapter = new JSONFile(file);
const groupesDB = new Low(adapter);

const reactions = {
  habitants: {
    modérées: [
      "Les habitants lancent une pétition en ligne.",
      "On entend les habitants murmurer leur mécontentement sur les réseaux.",
    ],
    sérieuses: [
      "Des habitants se regroupent devant la mairie pour manifester.",
      "Les habitants bloquent temporairement une rue pour se faire entendre.",
    ],
    extrêmes: [
      "Une émeute éclate dans un quartier résidentiel.",
      "Les habitants vandalisent des bâtiments administratifs.",
    ],
  },
  commerçants: {
    modérées: [
      "Les commerçants expriment leurs inquiétudes sur l’avenir économique.",
    ],
    sérieuses: [
      "Plusieurs commerces ferment temporairement en signe de protestation.",
    ],
    extrêmes: ["Des commerçants refusent de payer leurs taxes locales."],
  },
  ecologistes: {
    modérées: ["Les écologistes distribuent des tracts sur la place centrale."],
    sérieuses: [
      "Des militants écologistes organisent un sit-in devant la mairie.",
    ],
    extrêmes: [
      "Des écologistes bloquent une autoroute pour dénoncer l’inaction.",
    ],
  },
};

// Seuils de tension pour chaque intensité
const SEUILS = {
  modérées: 5,
  sérieuses: 10,
  extrêmes: 15,
};

async function analyserGroupes(client, monde) {
  await groupesDB.read();
  const groupes = groupesDB.data;

  if (!groupes || !monde?.stats) return;

  const canal = await client.channels
    .fetch("1395384816588816425")
    .catch(() => null);
  if (!canal) return;

  for (const id in groupes) {
    const groupe = groupes[id];
    if (!groupe.actif) continue;

    let tension = groupe.niveauTension || 0;

    for (const critere in groupe.sensibilité) {
      const valeurStat = monde.stats[critere] || 0;
      const seuil = groupe.sensibilité[critere];
      if (valeurStat >= seuil) tension += 1;
      else if (tension > 0) tension -= 0.5;
    }

    groupe.niveauTension = Math.min(tension, 20);

    // Détermination du nouveau palier
    let nouveauPalier = "aucun";
    if (tension >= SEUILS.extrêmes) nouveauPalier = "extrêmes";
    else if (tension >= SEUILS.sérieuses) nouveauPalier = "sérieuses";
    else if (tension >= SEUILS.modérées) nouveauPalier = "modérées";

    // Vérifie si un nouveau palier a été franchi
    if (
      nouveauPalier !== "aucun" &&
      nouveauPalier !== groupe.dernierPalier &&
      reactions[groupe.nom] &&
      reactions[groupe.nom][nouveauPalier]
    ) {
      const phrases = reactions[groupe.nom][nouveauPalier];
      const message = phrases[Math.floor(Math.random() * phrases.length)];
      await canal.send(`📣 ${message}`);
      groupe.dernierPalier = nouveauPalier;
    }

    // Réinitialise si la tension est retombée en dessous du seuil minimal
    if (tension < SEUILS.modérées) {
      groupe.dernierPalier = "aucun";
    }
  }

  await groupesDB.write();
}

module.exports = { analyserGroupes };
