const { SlashCommandBuilder } = require("discord.js");
const monstres = require("../data/monstres.json");
const { lootMonstre } = require("../utils/lootManager");
const { playersDB } = require("../db");

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

    // 🕒 Vérification du cooldown
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

    // ⏱️ Mise à jour de la dernière chasse
    joueur.derniereChasse = maintenant.toISOString();

    // ➕ Initialisation des stats si manquantes
    joueur.niveau = joueur.niveau || 1;
    joueur.xp = joueur.xp || 0;
    joueur.pv = joueur.pv || 20 + joueur.niveau * 2;
    joueur.statsCombat = joueur.statsCombat || {
      attaque: 3 + joueur.niveau,
      defense: 2 + Math.floor(joueur.niveau / 2),
    };

    // 🎯 Sélection du monstre
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

    const monstre =
      monstresDisponibles[
        Math.floor(Math.random() * monstresDisponibles.length)
      ];

    // ⚔️ Combat
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
        joueur.pv = 20 + joueur.niveau * 2;
        joueur.statsCombat.attaque = 3 + joueur.niveau;
        joueur.statsCombat.defense = 2 + Math.floor(joueur.niveau / 2);
        message += `🎉 Tu passes niveau ${joueur.niveau} ! Tes PV sont restaurés (${joueur.pv})\n`;
      } else {
        message += `🧠 XP actuelle : ${joueur.xp}/${xpPourMonter}\n`;
      }
    } else {
      joueur.pv -= degatsSubis;
      if (joueur.pv <= 0) {
        joueur.niveau = Math.max(1, joueur.niveau - 1);
        joueur.pv = 10 + joueur.niveau * 2;
        joueur.xp = 0;
        joueur.statsCombat.attaque = 3 + joueur.niveau;
        joueur.statsCombat.defense = 2 + Math.floor(joueur.niveau / 2);
        message += `☠️ Tu as été vaincu et perds 1 niveau. Tu es maintenant niveau ${joueur.niveau} avec ${joueur.pv} PV.\n`;
      } else {
        message += `❌ Tu perds le combat et subis ${degatsSubis} dégâts. Il te reste ${joueur.pv} PV.\n`;
      }
    }

    await playersDB.write();
    await interaction.reply(message);
  },
};
