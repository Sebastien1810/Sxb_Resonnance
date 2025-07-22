const { Client, Collection, GatewayIntentBits, Events } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { token } = require("./config.json");
const { initDB } = require("./db");
const { lancerTickPNJs } = require("./pnj");
const { lancerNarrationAuto, paroleDuMaitre } = require("./maitre_du_jeu");
require("./temporalité/horloge"); // contient tickDuMonde + happenings
const { lancerTickGroupes } = require("./temporalité/horlogeGroupe");
const { lancerTickEvenements } = require("./temporalité/horlogeEvenements");
const { resoudreHappening } = require("./happeningsManager");

// ✅ Handlers pour les menus déroulants
const serviceSelectHandler = require("./select/serviceCategorie");
const acheterServiceHandler = require("./select/acheter_service");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

// 🔁 Chargement des commandes slash
const commandFiles = fs
  .readdirSync(path.join(__dirname, "slash"))
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./slash/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
  global.client = client; // important pour les ticks
});

// 🎯 Gestion des interactions
client.on(Events.InteractionCreate, async (interaction) => {
  // Slash command
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Une erreur est survenue.",
        ephemeral: true,
      });
    }
  }

  // 🎯 Menus déroulants
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "choix_categorie_service") {
      await serviceSelectHandler.execute(interaction);
    }
    if (interaction.customId === "acheter_service") {
      await acheterServiceHandler.execute(interaction);
    }
  }

  // 🎭 Boutons de happening
  if (interaction.isButton()) {
    if (interaction.customId === "stopper_larcin") {
      await interaction.reply({
        content: "Tu interviens courageusement.",
        ephemeral: true,
      });
      await resoudreHappening(interaction, "stopper");
    }
    if (interaction.customId === "ignorer_larcin") {
      await interaction.reply({
        content: "Tu détournes les yeux…",
        ephemeral: true,
      });
      await resoudreHappening(interaction, "ignorer");
    }
  }
});

// 🟡 Lancement du bot après init DB
initDB().then(() => {
  client.login(token);
  paroleDuMaitre(client);
  lancerNarrationAuto(client);
  lancerTickPNJs(client);
  lancerTickGroupes(client);
  lancerTickEvenements(client);
});
