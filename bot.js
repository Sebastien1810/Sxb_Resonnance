const { Client, Collection, GatewayIntentBits, Events } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { token } = require("./config.json");
const { initDB } = require("./db");
const { lancerTickPNJs } = require("./pnj");
const { lancerNarrationAuto, paroleDuMaitre } = require("./maitre_du_jeu");
require("./temporalité/horloge");
const { lancerTickGroupes } = require("./temporalité/horlogeGroupe");
const { lancerTickEvenements } = require("./temporalité/horlogeEvenements");
const { resoudreHappening } = require("./happening/resoudre");
const {
  declencherHappening,
} = require("../Sxb_Resonnance/happening/declencher");

// ✅ Handlers
const serviceSelectHandler = require("./select/serviceCategorie");
const acheterServiceHandler = require("./select/acheter_service");
const happeningButtons = require("./happening/buttons");

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
  global.client = client; // utile pour horloge
});

// 🎯 Gestion des interactions
client.on(Events.InteractionCreate, async (interaction) => {
  // Slash commands
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

  // Menus déroulants
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "choix_categorie_service") {
      await serviceSelectHandler.execute(interaction);
    }

    if (interaction.customId === "acheter_service") {
      await acheterServiceHandler.execute(interaction);
    }
  }

  // Boutons de happening
  if (interaction.isButton()) {
    if (happeningButtons.customIdList.includes(interaction.customId)) {
      return happeningButtons.execute(interaction);
    }
  }
});

// 🔁 Démarrage des systèmes
initDB().then(() => {
  client.login(token);
  paroleDuMaitre(client);
  lancerNarrationAuto(client);
  lancerTickPNJs(client);
  lancerTickGroupes(client);
  lancerTickEvenements(client);
});
