// 🔮 Génère une narration globale selon les stats du monde
function genererNarration(monde) {
  const {
    crime,
    tensionSociale,
    chômage,
    santePublique,
    economie,
    tourisme,
    ecologie,
  } = monde.stats;

  const narration = [];

  if (crime > 70)
    narration.push("🚨 La criminalité explose dans certains quartiers.");
  if (tensionSociale > 65)
    narration.push("⚠️ Des protestations éclatent dans les rues.");
  if (chômage > 60) narration.push("💼 Le chômage atteint un niveau critique.");
  if (santePublique < 40)
    narration.push("🏥 Les hôpitaux débordent, la santé publique est fragile.");
  if (ecologie > 80)
    narration.push("🌱 La nature est florissante, l'air est pur.");
  if (economie > 70 && tourisme > 50)
    narration.push("💰 L'économie prospère grâce au tourisme.");

  if (narration.length === 0) {
    narration.push("😌 Tout semble calme aujourd'hui...");
  }

  // 🔁 Retourne une phrase aléatoire par jour
  return narration[Math.floor(Math.random() * narration.length)];
}

// ⚙️ Applique les effets automatiques entre les statistiques du monde
function appliquerEffets(monde) {
  const stats = monde.stats;

  if (stats.crime > 70)
    stats.santePublique = Math.max(0, stats.santePublique - 2);
  if (stats.ecologie > 75) stats.tourisme = Math.min(100, stats.tourisme + 2);
  if (stats.chômage > 60)
    stats.tensionSociale = Math.min(100, stats.tensionSociale + 3);
  if (stats.tensionSociale > 60)
    stats.economie = Math.max(0, stats.economie - 2);
}

// 🗣️ Génère une narration individuelle selon le rôle du PNJ
function genererNarrationPNJ(pnj) {
  const phrases = {
    délinquant: [
      `${pnj.nom} rôde dans les ruelles, cherchant à imposer son autorité.`,
      `${pnj.nom} recrute discrètement de nouveaux membres pour son gang.`,
      `${pnj.nom} provoque une altercation dans un quartier sensible.`,
    ],
    infirmière: [
      `${pnj.nom} soigne les sans-abri gratuitement à la clinique de quartier.`,
      `${pnj.nom} organise une collecte de médicaments pour les plus pauvres.`,
      `${pnj.nom} passe la journée à s’occuper de patients vulnérables.`,
    ],
    policier: [
      `${pnj.nom} patrouille dans les rues, dissuadant les actes violents.`,
      `${pnj.nom} enquête discrètement sur les agissements de Spidicus.`,
      `${pnj.nom} arrête plusieurs suspects liés à un réseau criminel.`,
      `${pnj.nom} se recueille devant la tombe de sa fiancée, puis reprend sa traque.`,
    ],
  };

  // 🧠 Rôle détecté en minuscule pour éviter les erreurs de casse
  const rolePNJ = pnj.role.toLowerCase();

  for (const role in phrases) {
    if (rolePNJ.includes(role)) {
      const options = phrases[role];
      return options[Math.floor(Math.random() * options.length)];
    }
  }

  // 🔍 Par défaut, si le rôle n’est pas reconnu
  return `${pnj.nom} mène une action mystérieuse dont personne ne parle...`;
}

module.exports = {
  genererNarration,
  appliquerEffets,
  genererNarrationPNJ,
};
