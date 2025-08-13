const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");

const { playersDB } = require("../db");
const marcheNoirData = require("../data/marche_noir.json");

// Helpers intégrés
const clamp = (n, min = 0, max = 999) => Math.max(min, Math.min(max, n));
function computeEquipBonus(equipe = {}) {
  const bonus = { attaque: 0, defense: 0 };
  for (const slot of ["arme", "armure"]) {
    const it = equipe?.[slot];
    if (it?.effets) {
      if (typeof it.effets.attaque === "number")
        bonus.attaque += it.effets.attaque;
      if (typeof it.effets.defense === "number")
        bonus.defense += it.effets.defense;
    }
  }
  return bonus;
}
function recalcTotalStats(joueur) {
  joueur.statsCombatBase ||= { attaque: 0, defense: 0 };
  joueur.inventaire ||= { objets: [], équipé: { arme: null, armure: null } };
  joueur.inventaire.équipé ||= { arme: null, armure: null };
  const base = joueur.statsCombatBase;
  const bonus = computeEquipBonus(joueur.inventaire.équipé);
  joueur.statsCombat = {
    attaque: clamp((base.attaque || 0) + (bonus.attaque || 0)),
    defense: clamp((base.defense || 0) + (bonus.defense || 0)),
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("marché_noir")
    .setDescription(
      "Permet d'accéder au marché noir si les conditions sont réunies"
    ),

  async execute(interaction) {
    const userId = interaction.user.id;

    await playersDB.read();
    const joueur = playersDB.data[userId];

    if (!joueur) {
      return interaction.reply({
        content:
          "❌ Tu n'as pas encore de personnage. Utilise `/profil` pour en créer un.",
        ephemeral: true,
      });
    }

    if (joueur.reputation > 35) {
      return interaction.reply({
        content:
          "❌ Tu n'as pas assez de ténèbres en toi pour accéder à ce lieu interdit.",
        ephemeral: true,
      });
    }

    // Objets accessibles
    const objetsDisponibles = marcheNoirData.objets.filter((objet) => {
      if (objet.exigeGang && !joueur.gang) return false;
      if (
        objet.usageUnique &&
        (joueur.objetsUtilisés || []).includes(objet.nom)
      )
        return false;
      return true;
    });

    if (objetsDisponibles.length === 0) {
      return interaction.reply({
        content: "Aucun objet du marché noir ne t'est actuellement accessible.",
        ephemeral: true,
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("achat_marche_noir")
      .setPlaceholder("Choisis un objet à acheter")
      .addOptions(
        objetsDisponibles.map((objet) => ({
          label: objet.nom,
          description: (objet.description || "").slice(0, 50),
          value: objet.nom,
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const reply = await interaction.reply({
      content:
        "🕳️ Bienvenue dans l'antre du marché noir, là où les fumiers rêvent de ténèbre",
      components: [row],
      ephemeral: true,
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 30_000,
    });

    collector.on("collect", async (selectInteraction) => {
      const selected = selectInteraction.values[0];
      const objet = marcheNoirData.objets.find((o) => o.nom === selected);

      if (!objet) {
        return selectInteraction.reply({
          content: "❌ Objet introuvable.",
          ephemeral: true,
        });
      }

      if (objet.exigeGang && !joueur.gang) {
        return selectInteraction.reply({
          content: `❌ Tu dois être membre d’un gang pour acheter **${objet.nom}**.`,
          ephemeral: true,
        });
      }

      if (
        objet.usageUnique &&
        (joueur.objetsUtilisés || []).includes(objet.nom)
      ) {
        return selectInteraction.reply({
          content: `❌ Tu as déjà utilisé **${objet.nom}** (usage unique).`,
          ephemeral: true,
        });
      }

      if ((joueur.obsidienne || 0) < objet.prix) {
        return selectInteraction.reply({
          content: `❌ Tu n’as pas assez d’obsidienne. Il te faut ${objet.prix}💠.`,
          ephemeral: true,
        });
      }

      // Débit
      joueur.obsidienne = (joueur.obsidienne || 0) - objet.prix;

      // Structures
      joueur.inventaire ||= {
        objets: [],
        équipé: { arme: null, armure: null },
      };
      joueur.inventaire.équipé ||= { arme: null, armure: null };
      joueur.statsCombatBase ||= { attaque: 0, defense: 0 };
      joueur.statsCombat ||= { attaque: 0, defense: 0 };
      joueur.objetsUtilisés ||= [];

      if (objet.type === "consommable" || objet.usageUnique === true) {
        // Appliquer uniquement effets PERMANENTS sur la BASE
        if (objet.effets) {
          if (typeof objet.effets.attaque === "number") {
            joueur.statsCombatBase.attaque += objet.effets.attaque;
          }
          if (typeof objet.effets.defense === "number") {
            joueur.statsCombatBase.defense += objet.effets.defense;
          }
          if (typeof objet.effets.pvMax === "number") {
            joueur.pvMax = (joueur.pvMax || 100) + objet.effets.pvMax;
            joueur.pv = Math.min(joueur.pv || joueur.pvMax, joueur.pvMax);
          }
        }
        joueur.objetsUtilisés.push(objet.nom);

        // Recalc total suite à la modif de base
        recalcTotalStats(joueur);

        await playersDB.write();
        return selectInteraction.reply({
          content: `✅ Tu as utilisé **${objet.nom}**. Tes stats ont été mises à jour.`,
          ephemeral: true,
        });
      }

      // Sinon: ÉQUIPEMENT → on stocke seulement (effets appliqués quand on équipe)
      joueur.inventaire.objets.push(objet);

      await playersDB.write();
      return selectInteraction.reply({
        content: `✅ Tu as acheté **${objet.nom}** pour ${objet.prix}💠. (Équipe-le avec /equiper)`,
        ephemeral: true,
      });
    });

    collector.on("end", async () => {
      try {
        await reply.edit({ components: [] });
      } catch {}
    });
  },
};
