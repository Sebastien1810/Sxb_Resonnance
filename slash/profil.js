const { SlashCommandBuilder } = require("discord.js");
const { playersDB } = require("../db");
const marcheNoirData = require("../data/marche_noir.json");

const CATALOGUE = new Map((marcheNoirData.objets || []).map((o) => [o.nom, o]));
const clamp = (n, min = 0, max = 999) => Math.max(min, Math.min(max, n));

function getEffets(item) {
  if (!item) return {};
  if (item.effets && typeof item.effets === "object") return item.effets;
  const canon = CATALOGUE.get(item.nom);
  return canon?.effets || {};
}

function computeEquipBonus(equipe = {}) {
  const bonus = { attaque: 0, defense: 0 };
  for (const slot of ["arme", "armure"]) {
    const effets = getEffets(equipe?.[slot]);
    if (typeof effets.attaque === "number") bonus.attaque += effets.attaque;
    if (typeof effets.defense === "number") bonus.defense += effets.defense;
  }
  return bonus;
}

function ensureBaseFloor(joueur) {
  const N = joueur.niveau || 1;
  joueur.statsCombatBase ||= { attaque: 0, defense: 0 };
  const atkMin = 3 + N;
  const defMin = 2 + Math.floor(N / 2);

  if (joueur.statsCombatBase.attaque < atkMin) {
    joueur.statsCombatBase.attaque = atkMin;
  }
  if (joueur.statsCombatBase.defense < defMin) {
    joueur.statsCombatBase.defense = defMin;
  }
}

function recalcTotalStats(joueur) {
  ensureBaseFloor(joueur);
  const base = joueur.statsCombatBase;
  const bonus = computeEquipBonus(joueur.inventaire.équipé);
  joueur.statsCombat ||= { attaque: 0, defense: 0 };
  joueur.statsCombat.attaque = clamp(
    (base.attaque || 0) + (bonus.attaque || 0)
  );
  joueur.statsCombat.defense = clamp(
    (base.defense || 0) + (bonus.defense || 0)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profil")
    .setDescription("Affiche le profil de ton personnage"),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const userId = interaction.user.id;
    const pseudo = interaction.user.username;

    await playersDB.read();

    // Si le joueur n’existe pas → création
    if (!playersDB.data[userId]) {
      const N = 1;
      playersDB.data[userId] = {
        pseudo,
        age: 18,
        obsidienne: 50,
        stats: { faim: 100, humeur: 70, energie: 80 },
        reputation: 0,
        niveau: N,
        xp: 0,
        statsCombatBase: { attaque: 3 + N, defense: 2 + Math.floor(N / 2) },
        statsCombat: { attaque: 0, defense: 0 },
        pvMax: 20 + N * 2,
        pv: 20 + N * 2,
        inventaire: { objets: [], équipé: { arme: null, armure: null } },
        derniereAction: new Date().toISOString(),
      };
      recalcTotalStats(playersDB.data[userId]);
      await playersDB.write();
      return interaction.editReply(
        `👤 Nouveau personnage créé pour ${pseudo} ! Bienvenue ✨`
      );
    }

    const joueur = playersDB.data[userId];

    joueur.niveau = joueur.niveau || 1;
    joueur.inventaire ||= { objets: [], équipé: { arme: null, armure: null } };
    joueur.inventaire.équipé ||= { arme: null, armure: null };

    // Recalcule base + bonus à chaque affichage
    recalcTotalStats(joueur);
    await playersDB.write();

    const profil = `
🪪 **Profil de ${joueur.pseudo}**
🎂 Âge : ${joueur.age ?? 23} ans
💰 Obsidienne : ${joueur.obsidienne ?? 0}
🍗 Faim : ${joueur.stats?.faim ?? 0}
😊 Humeur : ${joueur.stats?.humeur ?? 0}
⚡ Énergie : ${joueur.stats?.energie ?? 0}
🏆 Réputation: ${joueur.reputation ?? 0}
📈 Niveau: ${joueur.niveau ?? 1}
⚔️ Attaque: ${joueur.statsCombat.attaque}
🛡️ Défense: ${joueur.statsCombat.defense}
    `;
    await interaction.editReply(profil);
  },
};
