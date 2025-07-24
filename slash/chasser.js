const { SlashCommandBuilder } = require("discord.js");
const monstres = require("../data/monstres.json");
const { lootMonstre } = require("../utils/lootManager");

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

    let monstresDisponibles = [];

    if (zoneChoisie === "zone_1") {
      monstresDisponibles = monstres.filter((m) => m.niveau === 1);
    } else if (zoneChoisie === "zone_2") {
      monstresDisponibles = monstres.filter((m) => m.niveau === 2);
    } else if (zoneChoisie === "zone_3") {
      monstresDisponibles = monstres.filter((m) => m.niveau === 3);
    } else if (zoneChoisie === "zone_melange") {
      monstresDisponibles = [...monstres]; // tous les monstres
    }

    if (monstresDisponibles.length === 0) {
      return interaction.reply("Aucun monstre disponible dans cette zone.");
    }

    const monstre =
      monstresDisponibles[
        Math.floor(Math.random() * monstresDisponibles.length)
      ];

    const loot = lootMonstre(monstre);

    await interaction.reply(
      `🧟 Tu as affronté **${monstre.nom}** !\n` +
        (loot
          ? `🎁 Tu as obtenu : **${loot.objet.nom}** *(rareté ${loot.rarete})*`
          : `😢 Malheureusement, tu n'as rien trouvé.`)
    );
  },
};
