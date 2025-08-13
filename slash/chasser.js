const { SlashCommandBuilder } = require("discord.js");
const monstres = require("../data/monstres.json");
const { lootMonstre } = require("../utils/lootManager");
const { playersDB } = require("../db");

// Helpers intégrés
const clamp = (n, min = 0, max = 999) => Math.max(min, Math.min(max, n));
function computeEquipBonus(equipe = {}) {
  const bonus = { attaque: 0, defense: 0 };
  for (const slot of ["arme", "armure"]) {
    const it = equipe?.[slot];
    if (it?.effets) {
      if (typeof it.effets.attaque === "number")
        bonus.attaque += it.effets.attaque;
      if (typeof it.effets.defense === "number")
        bonus.defense += it.effets.defense;
    }
  }
  return bonus;
}
function recalcTotalStats(joueur) {
  joueur.statsCombatBase ||= { attaque: 0, defense: 0 };
  joueur.inventaire ||= { objets: [], équipé: { arme: null, armure: null } };
  joueur.inventaire.équipé ||= { arme: null, armure: null };
  const base = joueur.statsCombatBase;
  const bonus = computeEquipBonus(joueur.inventaire.équipé);
  joueur.statsCombat = {
    attaque: clamp((base.attaque || 0) + (bonus.attaque || 0)),
    defense: clamp((base.defense || 0) + (bonus.defense || 0)),
  };
}

const COOLDOWN_MINUTES = 6;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("chasser")
    .setDescription("Affronte un monstre sauvage dans une zone")
    .addStringOption((option) =>
      option
        .setName("zone")
        .setDescription("Choisis ta zone de chasse")
        .setRequired(true)
        .addChoices(
          { name: "Zone 1 (niveau 1)", value: "zone_1" },
          { name: "Zone 2 (niveau 2)", value: "zone_2" },
          { name: "Zone 3 (niveau 3)", value: "zone_3" },
          { name: "Zone dangereuse (mélangée)", value: "zone_melange" }
        )
    ),

  async execute(interaction) {
    const zoneChoisie = interaction.options.getString("zone");
    await playersDB.read();

    const joueurs = playersDB.data;
    const joueur = joueurs[interaction.user.id];

    if (!joueur) return interaction.reply("Tu n'as pas encore de personnage !");

    // Cooldown
    const maintenant = new Date();
    const derniereChasse = joueur.derniereChasse
      ? new Date(joueur.derniereChasse)
      : new Date(0);
    const diffMinutes = (maintenant - derniereChasse) / 60000;

    if (diffMinutes < COOLDOWN_MINUTES) {
      const restantes = Math.ceil(COOLDOWN_MINUTES - diffMinutes);
      return interaction.reply(
        `⏳ Tu dois attendre encore ${restantes} minute(s) avant de chasser à nouveau.`
      );
    }
    joueur.derniereChasse = maintenant.toISOString();

    // Init/migration
    joueur.niveau = joueur.niveau || 1;
    joueur.xp = joueur.xp || 0;

    joueur.inventaire ||= { objets: [], équipé: { arme: null, armure: null } };
    joueur.inventaire.équipé ||= { arme: null, armure: null };

    // si ancien schéma: déduire base = total - bonus d’équipement courant
    joueur.statsCombat ||= {
      attaque: 3 + joueur.niveau,
      defense: 2 + Math.floor(joueur.niveau / 2),
    };
    const equipBonusInit = computeEquipBonus(joueur.inventaire.équipé);
    joueur.statsCombatBase ||= {
      attaque: Math.max(
        0,
        (joueur.statsCombat.attaque || 0) - (equipBonusInit.attaque || 0)
      ),
      defense: Math.max(
        0,
        (joueur.statsCombat.defense || 0) - (equipBonusInit.defense || 0)
      ),
    };

    joueur.pvMax = 20 + joueur.niveau * 2;
    joueur.pv = joueur.pv ?? joueur.pvMax;

    // Recalc total avant combat
    recalcTotalStats(joueur);

    // Monstres selon zone
    let monstresDisponibles = [];
    if (zoneChoisie === "zone_1")
      monstresDisponibles = monstres.filter((m) => m.niveau === 1);
    else if (zoneChoisie === "zone_2")
      monstresDisponibles = monstres.filter((m) => m.niveau === 2);
    else if (zoneChoisie === "zone_3")
      monstresDisponibles = monstres.filter((m) => m.niveau === 3);
    else if (zoneChoisie === "zone_melange")
      monstresDisponibles = [...monstres];

    if (monstresDisponibles.length === 0) {
      return interaction.reply("Aucun monstre disponible dans cette zone.");
    }

    // Tirage
    const monstre =
      monstresDisponibles[
        Math.floor(Math.random() * monstresDisponibles.length)
      ];

    // Combat
    const degatsJoueur = Math.max(
      joueur.statsCombat.attaque - monstre.stats.defense,
      1
    );
    const degatsSubis = Math.max(
      monstre.stats.attaque - joueur.statsCombat.defense,
      1
    );

    const victoire = degatsJoueur >= degatsSubis;
    let message = `🧟 Tu rencontres **${monstre.nom}** (niv ${monstre.niveau}) !\n`;

    if (victoire) {
      joueur.pv -= degatsSubis;
      const xpGagnee = monstre.niveau * 5;
      joueur.xp += xpGagnee;

      message += `💥 Tu as infligé ${degatsJoueur} dégâts et subi ${degatsSubis} !\n`;
      message += `✅ Tu remportes le combat ! +${xpGagnee} XP\n`;

      const loot = lootMonstre(monstre);
      if (loot) {
        message += `🎁 Tu trouves : **${loot.objet.nom}** *(rareté ${loot.rarete})*\n`;
      } else {
        message += `😢 Le monstre ne laisse rien derrière lui.\n`;
      }

      const xpPourMonter = joueur.niveau * 20;
      if (joueur.xp >= xpPourMonter) {
        joueur.niveau++;
        joueur.xp = 0;
        joueur.pvMax = 20 + joueur.niveau * 2;
        joueur.pv = joueur.pvMax;

        // MAJ de la BASE selon la règle de progression
        joueur.statsCombatBase.attaque = 3 + joueur.niveau;
        joueur.statsCombatBase.defense = 2 + Math.floor(joueur.niveau / 2);

        recalcTotalStats(joueur);

        message += `🎉 Tu passes niveau ${joueur.niveau} ! Tes PV sont restaurés (${joueur.pv})\n`;
      } else {
        message += `🧠 XP actuelle : ${joueur.xp}/${xpPourMonter}\n`;
      }
    } else {
      joueur.pv -= degatsSubis;
      if (joueur.pv <= 0) {
        joueur.niveau = Math.max(1, joueur.niveau - 1);
        joueur.xp = 0;
        joueur.pvMax = 20 + joueur.niveau * 2;
        joueur.pv = 10 + joueur.niveau * 2;

        // Base selon niveau actuel
        joueur.statsCombatBase.attaque = 3 + joueur.niveau;
        joueur.statsCombatBase.defense = 2 + Math.floor(joueur.niveau / 2);

        recalcTotalStats(joueur);

        message += `☠️ Tu as été vaincu et perds 1 niveau. Tu es maintenant niveau ${joueur.niveau} avec ${joueur.pv} PV.\n`;
      } else {
        message += `❌ Tu perds le combat et subis ${degatsSubis} dégâts. Il te reste ${joueur.pv} PV.\n`;
      }
    }

    await playersDB.write();
    await interaction.reply(message);
  },
};
