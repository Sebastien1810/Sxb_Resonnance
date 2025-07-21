const { StringSelectMenuInteraction } = require("discord.js");
const { getAllService } = require("../servicesManager");

module.exports = {
  customId: "choix_categorie_service",

  /**
   *
   * @param {StringSelectMenuInteraction} interaction
   */
  async execute(interaction) {
    const allServices = await getAllService();
    const selectedCategory = interaction.values[0];

    const services = allServices[selectedCategory];

    if (!services || services.length === 0) {
      return interaction.reply({
        content: `❌ Aucun service trouvé dans la catégorie : ${selectedCategory}`,
        ephemeral: true,
      });
    }

    let message = `📋 **Services disponibles dans _${selectedCategory}_** :\n\n`;

    services.forEach((service, index) => {
      message += `**${index + 1}. ${service.nom}** — ${
        service.description
      }\n💰 Coût : ${service.prix} obsidienne\n\n`;
    });

    await interaction.reply({
      content: message,
      ephemeral: true,
    });
  },
};
