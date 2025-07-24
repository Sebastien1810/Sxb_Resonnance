const { playersDB, pnjsDB } = require("../db");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const COOLDOWN_HOURS = 12;

function joueurEligible(joueur) {
  const derniere = joueur.dernierHappening
    ? new Date(joueur.dernierHappening)
    : new Date(0);
  const diffHeures = (new Date() - derniere) / (1000 * 60 * 60);
  return diffHeures >= COOLDOWN_HOURS;
}

async function declencherHappening(client) {
  await playersDB.read();
  await pnjsDB.read();

  const spidicus = Object.values(pnjsDB.data).find((p) => p.nom === "Spidicus");
  if (!spidicus || !spidicus.gang || spidicus.gang.length === 0) return;

  const eligibles = Object.entries(playersDB.data).filter(([_, j]) =>
    joueurEligible(j)
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

module.exports = { declencherHappening };
