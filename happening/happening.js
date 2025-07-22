const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { resoudreHappening } = require("../happeningManager");

module.exports = {
  customIdList: ["stopper_larcin", "ignorer_larcin"],

  async execute(interaction) {
    const choix =
      interaction.customId === "stopper_larcin" ? "stopper" : "ignorer";

    // Résolution de l’happening
    await resoudreHappening(interaction, choix);

    // Désactivation des boutons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("disabled1")
        .setLabel("🛑 Stopper")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("disabled2")
        .setLabel("🤐 Ignorer")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    await interaction.update({
      content: `✅ Tu as choisi : **${
        choix === "stopper" ? "Stopper le voleur" : "Ignorer la scène"
      }**`,
      components: [row],
    });
  },
};
