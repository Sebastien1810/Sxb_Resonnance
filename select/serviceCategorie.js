const {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuInteraction,
} = require("discord.js");
const { getAllServices } = require("../utils/servicesManager");

module.exports = {
  customId: "choix_categorie_service",

  /**
   * @param {StringSelectMenuInteraction} interaction
   */
  async execute(interaction) {
    const allServices = await getAllServices();
    const selectedCategory = interaction.values[0];

    const services = allServices[selectedCategory];

    if (!services || services.length === 0) {
      return interaction.reply({
        content: `❌ Aucun service trouvé dans la catégorie : ${selectedCategory}`,
        ephemeral: true,
      });
    }

    // 📝 Message d'information
    let message = `📋 **Services disponibles dans _${selectedCategory}_** :\n\n`;

    services.forEach((service, index) => {
      message += `**${index + 1}. ${service.nom}** — ${
        service.description
      }\n💰 Coût : ${service.prix} obsidienne\n\n`;
    });

    // 🔽 Menu de sélection des services
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("acheter_service")
      .setPlaceholder("Choisis un service à acheter")
      .addOptions(
        services.map((service) => ({
          label: service.nom,
          description: service.description,
          value: `${selectedCategory}|${service.nom}`,
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // 🔄 Répond avec message + menu
    await interaction.reply({
      content: message,
      components: [row],
      ephemeral: true,
    });
  },
};
