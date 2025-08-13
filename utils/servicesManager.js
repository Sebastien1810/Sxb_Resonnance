const path = require("path");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

const playersFile = path.join(__dirname, "../data/players.json");
const playersAdapter = new JSONFile(playersFile);
const playersDB = new Low(playersAdapter, {});

const servicesFile = path.join(__dirname, "../data/services.json");

const servicesAdapter = new JSONFile(servicesFile);
const servicesDB = new Low(servicesAdapter, {});

async function getAllServices() {
  await servicesDB.read();
  servicesDB.data ||= {};
  return servicesDB.data;
}

async function acheterService(playerId, categorie, nomService, reputation) {
  await servicesDB.read();
  await playersDB.read();

  servicesDB.data ||= {};
  playersDB.data ||= {};

  const services = servicesDB.data;
  const joueurs = playersDB.data;

  const joueur = joueurs[playerId];
  if (!joueur) {
    return { success: false, message: "Joueur introuvable." };
  }

  const service = services[categorie]?.find((s) => s.nom === nomService);
  if (!service) {
    return { success: false, message: "Service inconnu dans cette catégorie." };
  }

  // 💰 Calcul du prix selon la réputation
  let prixFinal = service.prix;
  if (reputation <= -10) prixFinal += 5; // corrompu
  if (reputation >= 20) prixFinal -= 5; // héros
  prixFinal = Math.max(1, prixFinal); // sécurité

  if (joueur.obsidienne < prixFinal) {
    return {
      success: false,
      message: `Tu n’as pas assez d’obsidienne. Il te faut ${prixFinal}💠, tu n’as que ${joueur.obsidienne}💠.`,
    };
  }

  joueur.obsidienne -= prixFinal;

  for (const [cle, valeur] of Object.entries(service.effets)) {
    if (typeof joueur.stats[cle] === "number") {
      joueur.stats[cle] += valeur;
      joueur.stats[cle] = Math.max(0, Math.min(joueur.stats[cle], 100));
    }
  }

  joueurs[playerId] = joueur;
  await playersDB.write();

  const effetsTxt = Object.entries(service.effets)
    .map(([k, v]) => `${v >= 0 ? "+" : ""}${v} ${k}`)
    .join(", ");

  return {
    success: true,
    message: `✅ Tu as utilisé **${service.nom}** pour ${prixFinal}💠. Effets : ${effetsTxt}`,
    joueur,
    service,
    prix: prixFinal,
  };
}

module.exports = {
  getAllServices,
  acheterService,
};
