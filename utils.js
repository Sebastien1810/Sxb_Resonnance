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

  return narration[Math.floor(Math.random() * narration.length)];
}

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

module.exports = { genererNarration, appliquerEffets };
