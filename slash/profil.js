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

      return interaction.reply({
        content: `👤 Nouveau personnage créé pour ${pseudo} ! Bienvenue dans ta nouvelle vie ✨`,
      });
    }

    const joueur = playersDB.data[userId];

    // Formatage du profil
    const profil = `
🪪 **Profil de ${joueur.pseudo}**
🎂 Âge : ${joueur.age} ans
💰 Obsidienne : ${joueur.obsidienne}
🍗 Faim : ${joueur.stats.faim}
😊 Humeur : ${joueur.stats.humeur}
⚡ Énergie : ${joueur.stats.energie}
    `;

    await interaction.reply({
      content: profil,
      ephemeral: false, // 👈 visible par tous (tu peux le retirer, c’est l’option par défaut)
    });
  },
};
