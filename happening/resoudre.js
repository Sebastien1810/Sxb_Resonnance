const { playersDB, worldDB } = require("../db");

const canalNarrationId = "1395384816588816425";

async function resoudreHappening(interaction, choix) {
  const playerId = interaction.user.id;
  await playersDB.read();
  await worldDB.read();

  const joueur = playersDB.data[playerId];
  const monde = worldDB.data;
  const canal = await interaction.client.channels.fetch(canalNarrationId);

  let message = "";
  if (choix === "stopper") {
    joueur.reputation = (joueur.reputation || 0) + 3;
    monde.stats.crime = Math.max(0, monde.stats.crime - 2);
    message = `🛡️ ${joueur.pseudo} a stoppé un voleur en pleine action. Les habitants le remercient !`;
  } else {
    joueur.reputation = (joueur.reputation || 0) - 4;
    monde.stats.tensionSociale = Math.min(100, monde.stats.tensionSociale + 2);
    message = `😶 ${joueur.pseudo} a assisté à une agression… et a laissé le criminel s’échapper.`;
  }

  await playersDB.write();
  await worldDB.write();

  if (canal) await canal.send(`🎭 ${message}`);
}

module.exports = { resoudreHappening };
