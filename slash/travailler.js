const { SlashCommandBuilder } = require("discord.js");
const { playersDB, worldDB } = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("travailler")
    .setDescription(
      "Permet de gagner de l'obsidienne mais fatigue ton personnage"
    ),

  async execute(interaction) {
    const userId = interaction.user.id;

    await playersDB.read();
    const joueur = playersDB.data[userId];

    if (!joueur) {
      return interaction.reply({
        content:
          "❌ Tu n'as pas encore de personnage. Utilise `/profil` pour en créer un.",
        ephemeral: true,
      });
    }

    // ⏳ Cooldown spécifique à /travailler
    const maintenant = new Date();
    const derniereAction = joueur.actions?.travailler
      ? new Date(joueur.actions.travailler)
      : new Date(0);

    const diffMinutes = (maintenant - derniereAction) / (1000 * 60);
    const cooldown = 60; // 1 heure

    if (diffMinutes < cooldown) {
      const minutesRestantes = Math.ceil(cooldown - diffMinutes);
      return interaction.reply({
        content: `⏳ Tu dois te reposer encore ${minutesRestantes} minute(s) avant de retravailler.`,
        ephemeral: true,
      });
    }

    // 💼 Application des effets
    joueur.obsidienne += 30;
    joueur.stats.energie = Math.max(joueur.stats.energie - 20, 0);
    joueur.stats.humeur = Math.max(joueur.stats.humeur - 10, 0);

    // 🔁 Mise à jour de l'action
    if (!joueur.actions) joueur.actions = {};
    joueur.actions.travailler = maintenant.toISOString();

    await playersDB.write();

    // 📣 Message immersif
    await interaction.reply({
      content: `
💼 ${joueur.pseudo} a travaillé dur aujourd’hui.

+30 💰 Obsidienne → ${joueur.obsidienne}
-20 ⚡ Énergie → ${joueur.stats.energie}/100
-10 😊 Humeur → ${joueur.stats.humeur}/100
      `,
    });
    //influence de la commande sur le monde
    worldDB.data.stats.santePublique -= 0.4;
  },
};
