const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

const { getAllServices } = require("../servicesManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("services")
    .setDescription("Consulte les services disponibles"),

  async execute(interaction) {
    const allServices = await getAllServices();

    const categories = Object.keys(allServices);
    if (categories.length === 0) {
      return interaction.reply({
        content: "Aucune catégorie de services disponible.",
        ephemeral: true,
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

    await interaction.reply({
      content: "Choisis une catégorie de services ci-dessous :",
      components: [row],
      ephemeral: true,
    });
  },
};
