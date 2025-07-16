const { SlashCommandBuilder } = require("discord.js");
const { playersDB } = require("../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profil")
    .setDescription("Affiche le profil de ton personnage"),

  async execute(interaction) {
    const userId = interaction.user.id;
    const pseudo = interaction.user.username;

    // Charger les données des joueurs
    await playersDB.read();

    // Si le joueur n'existe pas encore
    if (!playersDB.data[userId]) {
      playersDB.data[userId] = {
        pseudo,
        age: 18,
        obsidienne: 50,
        stats: {
          faim: 100,
          humeur: 70,
          energie: 80,
        },
        derniereAction: new Date().toISOString(),
      };
      await playersDB.write();

      await interaction.reply({
        content: `👤 Nouveau personnage créé pour ${pseudo} ! Bienvenue dans ta nouvelle vie ✨`,
      });
      return;
    }

    const joueur = playersDB.data[userId];

    // Formatage du message
    const profil = `🪪 **Profil de ${joueur.pseudo}**
🎂 Âge : ${joueur.age} ans
💰 Obsidienne : ${joueur.obsidienne}
🍗 Faim : ${joueur.stats.faim}
😊 Humeur : ${joueur.stats.humeur}
⚡ Énergie : ${joueur.stats.energie}`;

    await interaction.reply({
      content: profil,
    });
  },
};
