const { acheterService } = require("../utils/servicesManager");
const { statutReputation } = require("../utils/utils");

module.exports = {
  customId: "acheter_service",

  async execute(interaction) {
    const [categorie, nomService] = interaction.values[0].split("|");
    const playerId = interaction.user.id;

    const joueurData = require("../data/players.json")[playerId];
    const reputation = joueurData?.reputation || 0;
    const statut = statutReputation(reputation);

    const resultat = await acheterService(
      playerId,
      categorie,
      nomService,
      reputation
    );

    let message = resultat.message;
    if (resultat.success) {
      message += `\n\n🧭 Statut actuel : **${statut}**`;
    }

    await interaction.reply({
      content: message,
      ephemeral: true,
    });
  },
};
