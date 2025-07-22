const { resoudreHappening } = require("./happeningsManager");

const customIdList = ["stopper_larcin", "ignorer_larcin"];

async function execute(interaction) {
  const reponse =
    interaction.customId === "stopper_larcin" ? "stopper" : "ignorer";

  // Désactivation des boutons
  const message = await interaction.message.fetch();
  const components = message.components.map((row) => {
    row.components.forEach((button) => (button.data.disabled = true));
    return row;
  });

  await interaction.update({
    content: `✅ Choix effectué : **${
      reponse === "stopper" ? "Tu interviens" : "Tu ignores"
    }**`,
    components,
  });

  // Appliquer les conséquences
  await resoudreHappening(interaction, reponse);
}

module.exports = {
  customIdList,
  execute,
};
