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

// ✅ Import correct du handler du menu déroulant
const serviceSelectHandler = require("./select/serviceCategorie");

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
});

// 🎯 Gestion des interactions
client.on(Events.InteractionCreate, async (interaction) => {
  // Gestion des commandes
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

  // 🎯 Gestion du menu déroulant pour les services
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "choix_categorie_service") {
      await serviceSelectHandler.execute(interaction);
    }
  }
});

// 🟡 Initialisation des bases de données puis lancement des systèmes
initDB().then(() => {
  client.login(token);
  paroleDuMaitre(client);
  lancerNarrationAuto(client);
  lancerTickPNJs(client);
  lancerTickGroupes(client);
  lancerTickEvenements(client);
});
