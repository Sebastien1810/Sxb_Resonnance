const { Client, Collection, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { token } = require("./config.json");
const { initDB } = require("./db");
require("./horloge");
const { lancerNarrationAuto, paroleDuMaitre } = require("./maitre_du_jeu");
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

// 🔁 Charger toutes les commandes du dossier /slash
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

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de l'exécution de la commande.",
      ephemeral: true,
    });
  }
});

// 🟡 Lancer le bot après avoir lu les BDD
initDB().then(() => {
  client.login(token);
  paroleDuMaitre(client);
  lancerNarrationAuto(client);
  require("./horloge"); // 🕐 Tick automatique du monde
});
