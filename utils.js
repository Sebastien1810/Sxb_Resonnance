function genererNarration(monde) {
  const stats = monde.stats || {};
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

  if (crime > 70) {
    narration.push(
      "Les rues deviennent dangereuses. La criminalité explose dans certains quartiers."
    );
  }
  if (tensionSociale > 65) {
    narration.push(
      "⚠️ Des protestations éclatent, signes d'une société à bout de souffle."
    );
  }
  if (chômage > 60) {
    narration.push(
      "💼 De plus en plus de citoyens sont désespément à la recherche d'un emploi."
    );
  }
  if (santePublique < 40) {
    narration.push(
      "🏥Les hôpitaux débordent de monde . La santé publique est en déclin."
    );
  }
  if (ecologie > 80) {
    narration.push(
      "🌱 L'air est pur et les parcs sont verdoyants. La nature reprend ses droits. "
    );
  }
  if (economie > 70 && tourisme > 50) {
    narration.push(
      "💲 L'économie locale prospère grâce à un afflux de touristes."
    );
  }
  if (narration.length === 0) {
    narration.push(
      "😌 Tout semble calme aujourd'hui, mais l'équilibre est fragile dans ce monde..."
    );
  }

  return narration[Math.floor(Math.random() * narration.length)];
}

function appliquerEffets(monde) {
  const stats = monde.stats;

  // si le crime est élevé, la santé publique diminue

  if (stats.crime > 70) {
    stats.santePublique = Math.max(0, stats.santePublique - 2);
  }

  //si l'écologie est bonne alors le tourisme augmente
  if (stats.ecologie > 75) {
    stats.tourisme = Math.min(100, stats.tourisme + 2);
  }

  //si le chômage est élevé alors les tensions sociales augmentent
  if (stats.chômage > 60) {
    stats.tensionSociale = Math.min(100, stats.tensionSociale + 3);
  }

  //si les tensions sociales sont trop hautes alors l'économie va regresser

  if (stats.tensionSociale > 60) {
    stats.economie = Math.max(0, stats.economie - 2);
  }
}

module.exports = { genererNarration, appliquerEffets };
