const { acheterService } = require("../servicesManager");

module.exports = {
  customId: "acheter_service",

  async execute(interaction) {
    const [categorie, nomService] = interaction.values[0].split("|");
    const playerId = interaction.user.id;

    const resultat = await acheterService(playerId, categorie, nomService);

    await interaction.reply({
      content: resultat.message,
      ephemeral: true,
    });
  },
};
