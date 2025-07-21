const evenements = require("./evenements");
const { worldDB } = require("./db");

async function verifierEvenements(client) {
  await worldDB.read();
  const monde = worldDB.data;

  const saison = monde.saison;
  const stats = monde.stats;

  let canalNarration = await client.channels
    .fetch("1395384816588816425")
    .catch(() => null);
  if (!canalNarration) return;

  const evenementsPossibles = [
    ...(evenements[saison] || []),
    ...(evenements.global || []),
  ];

  for (const evenement of evenementsPossibles) {
    if (evenement.conditions(monde)) {
      await canalNarration.send(`**Evenement** : ${evenement.message}`);

      //Application des effets s'ils existent
      if (evenement.effets) {
        for (const stat in evenement.effets) {
          const modif = evenement.effets[stat];
          monde.stats[stat] = Math.max(
            0,
            Math.min(100, (monde.stats[stat] || 0) + modif)
          );
        }
        await worldDB.write();
      }
    }
  }
}
module.exports = { verifierEvenements };
