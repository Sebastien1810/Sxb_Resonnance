const { SlashCommandBuilder } = require("discord.js");
const { playersDB } = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("manger")
    .setDescription(
      "Permet de manger pour regagner de l'énergie, de la faim et de l'humeur"
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

    // 🕒 Gestion du cooldown spécifique
    const maintenant = new Date();
    const derniereAction = joueur.actions?.manger
      ? new Date(joueur.actions.manger)
      : new Date(0);

    const diffMinutes = (maintenant - derniereAction) / (1000 * 60);
    const cooldown = 60; // 1 heure

    if (diffMinutes < cooldown) {
      const minutesRestantes = Math.ceil(cooldown - diffMinutes);
      return interaction.reply({
        content: `⏳ Tu dois attendre encore ${minutesRestantes} minute(s) avant de pouvoir remanger.`,
        ephemeral: true,
      });
    }

    // 🍽️ Application des effets
    joueur.stats.faim = Math.min(joueur.stats.faim + 40, 100);
    joueur.stats.energie = Math.min(joueur.stats.energie + 15, 100);
    joueur.stats.humeur = Math.min(joueur.stats.humeur + 10, 100);

    // 🔁 Mise à jour de la date d'action
    if (!joueur.actions) joueur.actions = {};
    joueur.actions.manger = maintenant.toISOString();

    await playersDB.write();

    // 📣 Message immersif (public)
    await interaction.reply({
      content: `
🍽️ ${joueur.pseudo} a pris un bon repas !

+40 🍗 Faim → ${joueur.stats.faim}/100  
+15 ⚡ Énergie → ${joueur.stats.energie}/100  
+10 😊 Humeur → ${joueur.stats.humeur}/100
      `,
    });
  },
};
