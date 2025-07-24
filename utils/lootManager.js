const objetsLootable = require("../data/objetsLootables.json");
const monstres = require("../data/monstres.json");

// détermine la tranche de rareté du loot
function rareté() {
  const rand = Math.random() * 100;

  if (rand < 40) return null; // 0–39
  if (rand <= 70) return "commun"; // 40–70
  if (rand <= 90) return "rare"; // 71–90
  if (rand <= 95) return "epique"; // 91–95
  return "légendaire"; // 96–100
}

// détermine la tranche de niveau du loot
function trancheNiveau(niveau) {
  if (niveau >= 1 && niveau <= 3) return "1-3";
  if (niveau >= 4 && niveau <= 6) return "4-6";
  if (niveau >= 7 && niveau <= 10) return "7-10";
}

function lootMonstre(monstre) {
  const raretéLoot = rareté();
  const niveauLoot = trancheNiveau(monstre.niveau);

  const lootPotentiels = monstre.loots[raretéLoot || "commun"];
  if (!lootPotentiels) return null;

  const lootIndex = Math.floor(Math.random() * lootPotentiels.length);

  const loot = lootPotentiels[lootIndex];

  const drop = Object.entries(objetsLootable)
    .flatMap(([rarete, plages]) =>
      Object.values(plages).flatMap((objets) =>
        objets.map((objet) => ({
          rarete,
          objet,
        }))
      )
    )
    .find((entry) => entry.objet.nom === loot);

  return drop;
}
module.exports = { lootMonstre };
