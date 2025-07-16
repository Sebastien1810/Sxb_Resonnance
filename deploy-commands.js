const { REST, Routes } = require("discord.js");
const { clientId, guildId, token } = require("./config.json");
const fs = require("fs");
const path = require("path");

// Préparer les commandes
const commands = [];

const commandFiles = fs
  .readdirSync(path.join(__dirname, "slash"))
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./slash/${file}`);
  commands.push(command.data.toJSON());
}

// Envoyer à l’API Discord
const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("🚀 Enregistrement des commandes slash...");

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log("✅ Commandes slash déployées !");
  } catch (error) {
    console.error(error);
  }
})();
