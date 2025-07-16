const { SlashCommandBuilder } = require("discord.js");
const { playersDB } = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dormir")
    .setDescription(
      "Permet de dormir pour regagner de l'énergie et de l'humeur"
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

    // ⏳ Cooldown spécifique à /dormir
    const maintenant = new Date();
    const derniereAction = joueur.actions?.dormir
      ? new Date(joueur.actions.dormir)
      : new Date(0);

    const diffMinutes = (maintenant - derniereAction) / (1000 * 60);
    const cooldown = 360; // 6 heures

    if (diffMinutes < cooldown) {
      const minutesRestantes = Math.ceil(cooldown - diffMinutes);
      return interaction.reply({
        content: `⏳ Tu dois attendre encore ${minutesRestantes} minute(s) avant de redormir.`,
        ephemeral: true,
      });
    }

    // 😴 Application des effets
    joueur.stats.energie = Math.min(joueur.stats.energie + 40, 100);
    joueur.stats.humeur = Math.min(joueur.stats.humeur + 10, 100);
    joueur.stats.faim = Math.max(joueur.stats.faim - 10, 0);

    // 🔁 Mise à jour de l'action
    if (!joueur.actions) joueur.actions = {};
    joueur.actions.dormir = maintenant.toISOString();

    await playersDB.write();

    // 📣 Message immersif
    await interaction.reply({
      content: `
😴 ${joueur.pseudo} s'est bien reposé.

+40 ⚡ Énergie → ${joueur.stats.energie}/100  
+10 😊 Humeur → ${joueur.stats.humeur}/100  
-10 🍗 Faim → ${joueur.stats.faim}/100
      `,
    });
  },
};
