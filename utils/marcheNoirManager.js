const path = require("path");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

const marcheNoirFile = path.join(__dirname, "data/marche_noir.json");
const marcheNoirAdapter = new JSONFile(marcheNoirFile);
const marcheNoirDB = new Low(marcheNoirAdapter);

const { playersDB } = require("../db");
const { statutReputation } = require("./utils");

async function getObjetsMarchéNoir() {
  await marcheNoirDB.read();
  marcheNoirDB.data ||= {};
  return marcheNoirDB.data;
}

async function acheterObjetNoir(playerId, categorie, nomObjet) {
  await marcheNoirDB.read();
  await playersDB.read();

  marcheNoirDB.data ||= {};
  playersDB.data ||= {};

  const joueur = playersDB.data[playerId];
  const objets = marcheNoirDB.data;

  const objet = objets[categorie]?.find((o) => o.nom === nomObjet);
  if (!joueur || !objet) {
    return { success: false, message: "Objet ou joueur introuvable." };
  }

  const statut = statutReputation(joueur.reputation || 0);

  // Vérif réputation minimale
  if (objet.minReputation && joueur.reputation < objet.minReputation) {
    return {
      success: false,
      message: `❌ Ta réputation est insuffisante pour acheter **${objet.nom}**.`,
    };
  }

  // Vérif gang obligatoire
  if (objet.exigeGang && !joueur.gang) {
    return {
      success: false,
      message: `❌ Seuls les membres d’un gang peuvent acheter **${objet.nom}**.`,
    };
  }

  // Vérif obsidienne
  if (joueur.obsidienne < objet.prix) {
    return {
      success: false,
      message: `Tu n’as pas assez d’obsidienne. Il te faut ${objet.prix}💠.`,
    };
  }

  // Appliquer achat
  joueur.obsidienne -= objet.prix;

  for (const [cle, valeur] of Object.entries(objet.effets || {})) {
    if (typeof joueur.stats[cle] === "number") {
      joueur.stats[cle] += valeur;
      joueur.stats[cle] = Math.max(0, Math.min(joueur.stats[cle], 100));
    }
  }

  joueur.objetsPossédés ||= [];
  joueur.objetsPossédés.push(objet.nom);

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
