const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

const { getAllServices } = require("../utils/servicesManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("services")
    .setDescription("Consulte les services disponibles"),

  async execute(interaction) {
    try {
      // Réserve l'interaction (version éphémère)
      await interaction.deferReply({ flags: 64 });

      const allServices = await getAllServices();
      const categories = Object.keys(allServices);

      if (categories.length === 0) {
        return await interaction.editReply({
          content: "❌ Aucune catégorie de services disponible pour le moment.",
        });
      }

      // Création du menu déroulant
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("choix_categorie_service")
        .setPlaceholder("Choisis une catégorie de services")
        .addOptions(
          categories.map((categorie) => ({
            label: categorie.charAt(0).toUpperCase() + categorie.slice(1),
            value: categorie,
          }))
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.editReply({
        content: "📋 Choisis une catégorie de services ci-dessous :",
        components: [row],
      });
    } catch (error) {
      console.error("❌ Erreur dans la commande /services :", error);
      if (!interaction.replied) {
        await interaction.reply({
          content: "Une erreur est survenue en consultant les services.",
          ephemeral: true,
        });
      }
    }
  },
};
