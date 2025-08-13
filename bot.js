// bot.js
const { Client, Collection, GatewayIntentBits, Events } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { token } = require("./config.json");
const { initDB, playersDB } = require("./db");
const { lancerTickPNJs } = require("./pnj");
const { lancerNarrationAuto, paroleDuMaitre } = require("./maitre_du_jeu");
require("./temporalité/horloge");
const { lancerTickGroupes } = require("./temporalité/horlogeGroupe");
const { lancerTickEvenements } = require("./temporalité/horlogeEvenements");
const { resoudreHappening } = require("./happening/resoudre");
const { declencherHappening } = require("./happening/declencher");

// Handlers existants
const serviceSelectHandler = require("./select/serviceCategorie");
const acheterServiceHandler = require("./select/acheter_service");
const happeningButtons = require("./happening/buttons");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

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

// 🔧 util: réponse d’erreur sûre (évite 40060 / 10062)
async function safeErrorReply(
  interaction,
  content = "❌ Une erreur est survenue."
) {
  const payload = { content, flags: 64 }; // 64 = EPHEMERAL
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch {
    // interaction expirée: on ignore proprement
  }
}

// 🎯 Gestion des interactions
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      // ⚠️ Si certaines commandes peuvent durer >3s, décommente:
      // await interaction.deferReply({ flags: 64 });
      // et à l'intérieur des commandes utilise editReply() au lieu de reply()

      await command.execute(interaction, playersDB);
      return;
    }

    // Menus déroulants
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "choix_categorie_service") {
        try {
          await serviceSelectHandler.execute(interaction);
        } catch (e) {
          console.error(e);
          await safeErrorReply(interaction);
        }
        return;
      }

      if (interaction.customId === "acheter_service") {
        try {
          await acheterServiceHandler.execute(interaction);
        } catch (e) {
          console.error(e);
          await safeErrorReply(interaction);
        }
        return;
      }
    }

    // Boutons de happening
    if (interaction.isButton()) {
      if (happeningButtons.customIdList.includes(interaction.customId)) {
        try {
          await happeningButtons.execute(interaction);
        } catch (e) {
          console.error(e);
          await safeErrorReply(interaction);
        }
        return;
      }
    }
  } catch (error) {
    console.error(error);
    await safeErrorReply(interaction);
  }
});

// 🛡️ catcher global pour éviter crash process
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
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
