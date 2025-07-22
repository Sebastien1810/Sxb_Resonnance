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

// ✅ Handlers pour les menus déroulants
const serviceSelectHandler = require("./select/serviceCategorie");
const acheterServiceHandler = require("./select/acheter_service");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ✅ Rend le client accessible globalement pour les fichiers comme horloge.js
global.client = client;

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
});

// 🎯 Gestion des interactions
client.on(Events.InteractionCreate, async (interaction) => {
  // 📦 Commandes slash
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

  // 🎛️ Menus déroulants
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "choix_categorie_service") {
      await serviceSelectHandler.execute(interaction);
    }

    if (interaction.customId === "acheter_service") {
      await acheterServiceHandler.execute(interaction);
    }
  }
});

// 🚀 Initialisation des bases de données + systèmes
initDB().then(() => {
  client.login(token);
  paroleDuMaitre(client);
  lancerNarrationAuto(client);
  lancerTickPNJs(client);
  lancerTickGroupes(client);
  lancerTickEvenements(client);
});
