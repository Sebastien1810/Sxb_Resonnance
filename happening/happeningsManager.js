const { playersDB, pnjsDB, worldDB } = require("../db");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const canalNarrationId = "1395384816588816425";
const COOLDOWN_HOURS = 12;

function joueurEligible(joueur) {
  if (!joueur) return false;
  const derniere = joueur.dernierHappening
    ? new Date(joueur.dernierHappening)
    : new Date(0);
  const now = new Date();
  const diffHeures = (now - derniere) / (1000 * 60 * 60);
  return diffHeures >= COOLDOWN_HOURS;
}

async function declencherHappening(client) {
  await playersDB.read();
  await pnjsDB.read();

  const spidicus = Object.values(pnjsDB.data).find((p) => p.nom === "Spidicus");
  if (!spidicus || !spidicus.gang || spidicus.gang.length === 0) return;

  const eligibles = Object.entries(playersDB.data).filter(([_, joueur]) =>
    joueurEligible(joueur)
  );

  if (eligibles.length === 0) return;

  const [playerId, joueur] =
    eligibles[Math.floor(Math.random() * eligibles.length)];
  joueur.dernierHappening = new Date().toISOString();
  await playersDB.write();

  try {
    const user = await client.users.fetch(playerId);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("stopper_larcin")
        .setLabel("🛑 Stopper")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("ignorer_larcin")
        .setLabel("🤐 Ignorer")
        .setStyle(ButtonStyle.Secondary)
    );

    await user.send({
      content: `👀 Tu assistes à une scène choquante :

> Un sbire de Spidicus tabasse une vieille dame et lui vole son sac.

Que fais-tu ?`,
      components: [row],
    });
  } catch (err) {
    console.log(`❌ Impossible d'envoyer de DM à ${joueur.pseudo}`);
  }
}

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

module.exports = { declencherHappening, resoudreHappening };
