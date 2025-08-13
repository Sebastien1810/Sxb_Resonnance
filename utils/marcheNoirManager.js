const path = require("path");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

const marcheNoirFile = path.join(__dirname, "../data/marche_noir.json");
const marcheNoirAdapter = new JSONFile(marcheNoirFile);
const marcheNoirDB = new Low(marcheNoirAdapter);

const { playersDB } = require("../db");

async function getObjetsMarchéNoir() {
  await marcheNoirDB.read();
  marcheNoirDB.data ||= {};
  return marcheNoirDB.data.objets || [];
}

async function acheterObjetNoir(playerId, nomObjet) {
  await marcheNoirDB.read();
  await playersDB.read();

  marcheNoirDB.data ||= {};
  playersDB.data ||= {};

  const joueur = playersDB.data[playerId];
  const objets = marcheNoirDB.data.objets || [];

  if (!joueur) {
    return { success: false, message: "❌ Joueur introuvable." };
  }

  // ❌ Réputation trop positive = accès interdit
  if (joueur.reputation > -5) {
    return {
      success: false,
      message: "❌ Tu n’es pas assez malfamé pour accéder au marché noir.",
    };
  }

  const objet = objets.find((o) => o.nom === nomObjet);
  if (!objet) {
    return { success: false, message: "❌ Objet introuvable." };
  }

  // Vérifie si l’objet est à usage unique et déjà utilisé
  joueur.objetsUtilisés ||= [];
  if (objet.usageUnique && joueur.objetsUtilisés.includes(objet.nom)) {
    return {
      success: false,
      message: `❌ Tu as déjà utilisé **${objet.nom}**. C’est un objet à usage unique.`,
    };
  }

  // Vérifie si l’objet exige un gang
  if (objet.exigeGang && !joueur.gang) {
    return {
      success: false,
      message: `❌ Seuls les membres d’un gang peuvent acheter **${objet.nom}**.`,
    };
  }

  // Vérifie les fonds
  if (joueur.obsidienne < objet.prix) {
    return {
      success: false,
      message: `❌ Tu n’as pas assez d’obsidienne. Il te faut ${objet.prix}💠.`,
    };
  }

  // Déduire le prix
  joueur.obsidienne -= objet.prix;

  // Appliquer les effets (ex: +attaque, +défense, +pvMax)
  for (const [cle, valeur] of Object.entries(objet.effets || {})) {
    if (typeof joueur.stats?.[cle] === "number") {
      joueur.stats[cle] += valeur;
      joueur.stats[cle] = Math.max(0, Math.min(joueur.stats[cle], 999));
    } else if (cle === "pvMax") {
      joueur.pvMax = (joueur.pvMax || 100) + valeur;
      joueur.pv = Math.min(joueur.pv || joueur.pvMax, joueur.pvMax);
    }
  }

  // Ajoute à l’inventaire
  joueur.objetsPossédés ||= [];
  joueur.objetsPossédés.push(objet.nom);

  // Marque comme utilisé si usage unique
  if (objet.usageUnique) {
    joueur.objetsUtilisés.push(objet.nom);
  }

  await playersDB.write();

  return {
    success: true,
    message: `✅ Tu as acheté **${objet.nom}** pour ${objet.prix}💠.`,
  };
}

module.exports = {
  getObjetsMarchéNoir,
  acheterObjetNoir,
};
